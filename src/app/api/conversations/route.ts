import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Profile, Conversation, Message } from '@/types/database';

// Extended types for API responses
interface ConversationWithDetails extends Conversation {
  participants: (Profile & {
    role: string;
    last_read_at: string | null;
  })[];
  last_message: Message | null;
  unread_count: number;
}

interface CreateConversationBody {
  participant_ids: string[];
  is_group?: boolean;
  name?: string;
  avatar_url?: string;
}

// GET /api/conversations - List all conversations for authenticated user
export async function GET(request: NextRequest) {
  try {
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

    // Get all conversations the user is part of
    const { data: participations, error: participationsError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        role,
        last_read_at,
        joined_at
      `)
      .eq('user_id', profile.id);

    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const conversationIds = participations.map(p => p.conversation_id);
    const participantLastReadMap = new Map(
      participations.map(p => [p.conversation_id, { last_read_at: p.last_read_at, role: p.role }])
    );

    // Get conversation details
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Get all participants for these conversations
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        user_id,
        role,
        last_read_at
      `)
      .in('conversation_id', conversationIds);

    if (allParticipantsError) {
      console.error('Error fetching participants:', allParticipantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // Get profile data for all participants
    const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', participantUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch participant profiles' },
        { status: 500 }
      );
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get last messages for all conversations
    const { data: lastMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      // Continue without last messages
    }

    // Group last messages by conversation
    const lastMessageMap = new Map<string, Message>();
    lastMessages?.forEach(msg => {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    });

    // Group participants by conversation
    const participantsByConversation = new Map<string, typeof allParticipants>();
    allParticipants?.forEach(p => {
      const existing = participantsByConversation.get(p.conversation_id) || [];
      existing.push(p);
      participantsByConversation.set(p.conversation_id, existing);
    });

    // Get unread counts for each conversation
    const { data: unreadCounts, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('is_deleted', false)
      .neq('sender_id', profile.id);

    if (unreadError) {
      console.error('Error fetching unread counts:', unreadError);
    }

    // Calculate unread counts based on last_read_at
    const unreadCountMap = new Map<string, number>();
    conversations?.forEach(conv => {
      const userLastRead = participantLastReadMap.get(conv.id)?.last_read_at;
      const convMessages = unreadCounts?.filter(m => m.conversation_id === conv.id) || [];
      
      // For now, we'll need to do a more accurate count
      // This is a simplified version - in production you'd want a more efficient query
      unreadCountMap.set(conv.id, 0);
    });

    // Better unread count calculation
    for (const conv of conversations || []) {
      const userLastRead = participantLastReadMap.get(conv.id)?.last_read_at;
      
      if (!userLastRead) {
        // User hasn't read any messages, count all messages not from user
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .neq('sender_id', profile.id);
        
        if (!countError && count !== null) {
          unreadCountMap.set(conv.id, count);
        }
      } else {
        // Count messages after last read
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .neq('sender_id', profile.id)
          .gt('created_at', userLastRead);
        
        if (!countError && count !== null) {
          unreadCountMap.set(conv.id, count);
        }
      }
    }

    // Build the response
    const conversationsWithDetails: ConversationWithDetails[] = (conversations || []).map(conv => {
      const convParticipants = participantsByConversation.get(conv.id) || [];
      
      const participants = convParticipants.map(p => {
        const userProfile = profileMap.get(p.user_id);
        return {
          ...(userProfile || { id: p.user_id, email: '', created_at: '', updated_at: '', is_online: false }),
          role: p.role,
          last_read_at: p.last_read_at,
        } as Profile & { role: string; last_read_at: string | null };
      });

      return {
        ...conv,
        participants,
        last_message: lastMessageMap.get(conv.id) || null,
        unread_count: unreadCountMap.get(conv.id) || 0,
      };
    });

    // Sort by last message time (most recent first)
    conversationsWithDetails.sort((a, b) => {
      const aTime = a.last_message_at || a.created_at;
      const bTime = b.last_message_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
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

    const body: CreateConversationBody = await request.json();
    const { participant_ids, is_group = false, name, avatar_url } = body;

    // Validate input
    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([profile.id, ...participant_ids])];

    // For direct messages (not groups), check if conversation already exists
    if (!is_group && allParticipantIds.length === 2) {
      const otherUserId = allParticipantIds.find(id => id !== profile.id);
      
      if (otherUserId) {
        // Find existing direct conversation between these two users
        const { data: existingConvos, error: existingError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', profile.id);

        if (!existingError && existingConvos && existingConvos.length > 0) {
          const convoIds = existingConvos.map(c => c.conversation_id);
          
          const { data: otherParticipations, error: otherError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', otherUserId)
            .in('conversation_id', convoIds);

          if (!otherError && otherParticipations && otherParticipations.length > 0) {
            // Check each conversation to see if it's a direct conversation (exactly 2 participants)
            for (const p of otherParticipations) {
              const { data: participants, error: participantsError } = await supabase
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', p.conversation_id);

              if (!participantsError && participants && participants.length === 2) {
                // Check if it's not a group
                const { data: conv, error: convError } = await supabase
                  .from('conversations')
                  .select('*')
                  .eq('id', p.conversation_id)
                  .eq('is_group', false)
                  .single();

                if (!convError && conv) {
                  // Return existing conversation
                  return NextResponse.json({
                    conversation: conv,
                    is_new: false,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Validate group requirements
    if (is_group) {
      if (allParticipantIds.length < 3) {
        return NextResponse.json(
          { error: 'Group conversations require at least 3 participants' },
          { status: 400 }
        );
      }
      if (!name) {
        return NextResponse.json(
          { error: 'Group name is required for group conversations' },
          { status: 400 }
        );
      }
    }

    // Create the conversation
    const { data: conversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        is_group,
        name: is_group ? name : null,
        avatar_url: is_group ? avatar_url : null,
        created_by: profile.id,
      })
      .select()
      .single();

    if (createError || !conversation) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    // Add participants
    const participantInserts = allParticipantIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === profile.id ? 'admin' : 'member',
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Try to clean up the conversation
      await supabase.from('conversations').delete().eq('id', conversation.id);
      return NextResponse.json(
        { error: 'Failed to add participants to conversation' },
        { status: 500 }
      );
    }

    // Get participant profiles for response
    const { data: participantProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', allParticipantIds);

    const response = {
      ...conversation,
      participants: (participantProfiles || []).map(p => ({
        ...p,
        role: p.id === profile.id ? 'admin' : 'member',
        last_read_at: p.id === profile.id ? new Date().toISOString() : null,
      })),
      last_message: null,
      unread_count: 0,
    };

    return NextResponse.json({
      conversation: response,
      is_new: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
