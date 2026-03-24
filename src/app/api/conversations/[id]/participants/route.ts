import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Profile } from '@/types/database';

interface AddParticipantsBody {
  user_ids: string[];
}

// Helper to verify user is participant in conversation
async function verifyParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string
): Promise<{ isParticipant: boolean; role?: string }> {
  const { data: participant, error } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error || !participant) {
    return { isParticipant: false };
  }

  return { isParticipant: true, role: participant.role };
}

// GET /api/conversations/[id]/participants - List participants
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
    const { isParticipant } = await verifyParticipant(supabase, profile.id, conversationId);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        role,
        last_read_at,
        joined_at
      `)
      .eq('conversation_id', conversationId)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ participants: [] });
    }

    // Get profiles for all participants
    const userIds = participants.map(p => p.user_id);
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

    // Combine data
    const participantsWithProfiles = participants.map(p => {
      const userProfile = profileMap.get(p.user_id);
      return {
        ...(userProfile || {
          id: p.user_id,
          email: 'Unknown',
          created_at: '',
          updated_at: '',
          is_online: false,
          full_name: null,
          avatar_url: null,
          phone: null,
          status: null,
          last_seen: null,
        }),
        role: p.role,
        last_read_at: p.last_read_at,
        joined_at: p.joined_at,
      } as Profile & { role: string; last_read_at: string | null; joined_at: string };
    });

    return NextResponse.json({ participants: participantsWithProfiles });
  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/participants - Add participants to group
export async function POST(
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

    // Get conversation to verify it's a group
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

    // Verify it's a group conversation
    if (!conversation.is_group) {
      return NextResponse.json(
        { error: 'Cannot add participants to direct conversations' },
        { status: 400 }
      );
    }

    // Verify user is participant with admin role
    const { isParticipant, role } = await verifyParticipant(supabase, profile.id, conversationId);

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can add participants to the group' },
        { status: 403 }
      );
    }

    const body: AddParticipantsBody = await request.json();
    const { user_ids } = body;

    // Validate input
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one user ID is required' },
        { status: 400 }
      );
    }

    // Verify all users exist
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', user_ids);

    if (usersError) {
      console.error('Error verifying users:', usersError);
      return NextResponse.json(
        { error: 'Failed to verify users' },
        { status: 500 }
      );
    }

    const existingUserIds = new Set(existingUsers?.map(u => u.id) || []);
    const invalidUserIds = user_ids.filter(id => !existingUserIds.has(id));

    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid user IDs: ${invalidUserIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if any users are already participants
    const { data: existingParticipants, error: existingError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .in('user_id', user_ids);

    if (existingError) {
      console.error('Error checking existing participants:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing participants' },
        { status: 500 }
      );
    }

    const alreadyParticipantIds = new Set(existingParticipants?.map(p => p.user_id) || []);
    const newParticipantIds = user_ids.filter(id => !alreadyParticipantIds.has(id));

    if (newParticipantIds.length === 0) {
      return NextResponse.json(
        { error: 'All specified users are already participants' },
        { status: 400 }
      );
    }

    // Add new participants
    const participantInserts = newParticipantIds.map(userId => ({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member',
    }));

    const { error: insertError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (insertError) {
      console.error('Error adding participants:', insertError);
      return NextResponse.json(
        { error: 'Failed to add participants' },
        { status: 500 }
      );
    }

    // Get profiles of newly added participants
    const { data: newProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', newParticipantIds);

    if (profilesError) {
      console.error('Error fetching new participant profiles:', profilesError);
      // Still return success but without full profiles
      return NextResponse.json({
        message: 'Participants added successfully',
        added_count: newParticipantIds.length,
        participants: newParticipantIds.map(id => ({ id, role: 'member' })),
        skipped: alreadyParticipantIds.size > 0 ? Array.from(alreadyParticipantIds) : undefined,
      });
    }

    return NextResponse.json({
      message: 'Participants added successfully',
      added_count: newParticipantIds.length,
      participants: newProfiles?.map(p => ({
        ...p,
        role: 'member',
        joined_at: new Date().toISOString(),
        last_read_at: null,
      })),
      skipped: alreadyParticipantIds.size > 0 ? Array.from(alreadyParticipantIds) : undefined,
    });
  } catch (error) {
    console.error('Add participants error:', error);
    return NextResponse.json(
      { error: 'Failed to add participants' },
      { status: 500 }
    );
  }
}
