import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/groups/join/[inviteLink] - Get group info by invite link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteLink: string }> }
) {
  try {
    const { inviteLink } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find group by invite link
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        avatar_url,
        created_at,
        created_by
      `)
      .eq('invite_link', inviteLink)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    // Get participant count
    const { count, error: countError } = await supabase
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', group.id);

    if (countError) {
      console.error('Error counting participants:', countError);
    }

    // Check if user is already a participant
    const { data: existingParticipation } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', group.id)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      group: {
        ...group,
        participant_count: count || 0,
        is_member: !!existingParticipation
      }
    });
  } catch (error) {
    console.error('Get group by invite error:', error);
    return NextResponse.json({ error: 'Failed to get group info' }, { status: 500 });
  }
}

// POST /api/groups/join/[inviteLink] - Join group via invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteLink: string }> }
) {
  try {
    const { inviteLink } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Find group by invite link
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_link', inviteLink)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    // Check if already a participant
    const { data: existingParticipation } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', group.id)
      .eq('user_id', profile.id)
      .single();

    if (existingParticipation) {
      return NextResponse.json({ 
        message: 'Already a member of this group',
        group_id: group.id,
        is_new: false
      });
    }

    // Check member limit
    const { count, error: countError } = await adminClient
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', group.id);

    if (countError) {
      console.error('Error counting participants:', countError);
    }

    if ((count || 0) >= 256) {
      return NextResponse.json({ error: 'Group is full (maximum 256 members)' }, { status: 400 });
    }

    // Add user to participants
    const { error: insertError } = await adminClient
      .from('conversation_participants')
      .insert({
        conversation_id: group.id,
        user_id: profile.id,
      });

    if (insertError) {
      console.error('Error joining group:', insertError);
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Successfully joined group',
      group_id: group.id,
      is_new: true
    }, { status: 201 });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
