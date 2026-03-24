import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Profile, Conversation, ConversationParticipant } from '@/types/database';

interface UpdateConversationBody {
  name?: string;
  avatar_url?: string;
  muted?: boolean;
  archived?: boolean;
  pinned?: boolean;
}

// Helper to verify user is participant in conversation
async function verifyParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string
): Promise<{ isParticipant: boolean; participant?: ConversationParticipant }> {
  const { data: participant, error } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error || !participant) {
    return { isParticipant: false };
  }

  return { isParticipant: true, participant };
}

// GET /api/conversations/[id] - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify user is participant
    const { isParticipant, participant } = await verifyParticipant(supabase, profile.id, conversationId);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get all participants with their profiles
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        role,
        last_read_at,
        joined_at
      `)
      .eq('conversation_id', conversationId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // Get profiles for participants
    const userIds = participants?.map(p => p.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch participant profiles' },
        { status: 500 }
      );
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Combine participants with their profiles
    const participantsWithProfiles = (participants || []).map(p => {
      const userProfile = profileMap.get(p.user_id);
      return {
        ...(userProfile || { id: p.user_id, email: '', created_at: '', updated_at: '', is_online: false }),
        role: p.role,
        last_read_at: p.last_read_at,
        joined_at: p.joined_at,
      } as Profile & { role: string; last_read_at: string | null; joined_at: string };
    });

    // Get last message
    const { data: lastMessage, error: lastMsgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate unread count
    let unreadCount = 0;
    const userLastRead = participant?.last_read_at;

    if (!userLastRead) {
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .neq('sender_id', profile.id);

      if (!countError && count !== null) {
        unreadCount = count;
      }
    } else {
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .neq('sender_id', profile.id)
        .gt('created_at', userLastRead);

      if (!countError && count !== null) {
        unreadCount = count;
      }
    }

    const response = {
      ...conversation,
      participants: participantsWithProfiles,
      last_message: lastMessage || null,
      unread_count: unreadCount,
      user_role: participant?.role || 'member',
    };

    return NextResponse.json({ conversation: response });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify user is participant
    const { isParticipant, participant } = await verifyParticipant(supabase, profile.id, conversationId);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const body: UpdateConversationBody = await request.json();
    const { name, avatar_url } = body;

    // Get conversation to check if it's a group
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Only admins can update group settings
    if (conversation.type === 'group' && (name !== undefined || avatar_url !== undefined)) {
      if (participant?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can update group settings' },
          { status: 403 }
        );
      }

      // Update group record
      const updateData: { name?: string; avatar_url?: string | null } = {};
      if (name !== undefined) updateData.name = name;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('groups')
          .update(updateData)
          .eq('id', conversationId);

        if (updateError) {
          console.error('Error updating group:', updateError);
          return NextResponse.json(
            { error: 'Failed to update group' },
            { status: 500 }
          );
        }
      }
    }

    // Update participant-specific settings (muted, archived, pinned)
    // Note: These fields are not in the current schema but can be added later
    // For now, we'll just return success

    // Get updated conversation
    const { data: updatedConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated conversation:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: updatedConversation,
      message: 'Conversation updated successfully',
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Leave/delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify user is participant
    const { isParticipant, participant } = await verifyParticipant(supabase, profile.id, conversationId);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get all participants count
    const { count: participantCount, error: countError } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (countError) {
      console.error('Error counting participants:', countError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    // If this is the last participant or it's a direct conversation, delete the whole conversation
    if ((participantCount || 0) <= 1 || conversation.type === 'direct') {
      // Delete all messages first
      const { error: deleteMessagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (deleteMessagesError) {
        console.error('Error deleting messages:', deleteMessagesError);
      }

      // Delete all participants
      const { error: deleteParticipantsError } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId);

      if (deleteParticipantsError) {
        console.error('Error deleting participants:', deleteParticipantsError);
      }

      // Delete the conversation
      const { error: deleteConvError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (deleteConvError) {
        console.error('Error deleting conversation:', deleteConvError);
        return NextResponse.json(
          { error: 'Failed to delete conversation' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Conversation deleted successfully',
        action: 'deleted',
      });
    }

    // For group conversations, just leave (remove participant)
    // If the user is admin, transfer admin role to another participant
    if (participant?.role === 'admin') {
      // Find another participant to transfer admin
      const { data: otherParticipants, error: otherError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', profile.id)
        .limit(1);

      if (!otherError && otherParticipants && otherParticipants.length > 0) {
        // Transfer admin role
        await supabase
          .from('conversation_participants')
          .update({ role: 'admin' })
          .eq('conversation_id', conversationId)
          .eq('user_id', otherParticipants[0].user_id);
      }
    }

    // Remove the user from participants
    const { error: leaveError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', profile.id);

    if (leaveError) {
      console.error('Error leaving conversation:', leaveError);
      return NextResponse.json(
        { error: 'Failed to leave conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Left conversation successfully',
      action: 'left',
    });
  } catch (error) {
    console.error('Leave/delete conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
