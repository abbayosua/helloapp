import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/groups/[id]/members - Add members to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant (any participant can add members)
    const { data: participation, error: participationError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 });
    }

    // Get group details to check member limit
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // Get current participant count
    const { count, error: countError } = await adminClient
      .from('conversation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', groupId);

    if (countError) {
      console.error('Error counting participants:', countError);
    }

    // Check max members (256)
    const currentCount = count || 0;
    const newCount = currentCount + user_ids.length;

    if (newCount > 256) {
      return NextResponse.json({ 
        error: `Group is full. Maximum 256 members allowed. Current: ${currentCount}` 
      }, { status: 400 });
    }

    // Filter out users already in the group
    const { data: existingParticipants, error: existingError } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', groupId)
      .in('user_id', user_ids);

    if (existingError) {
      console.error('Error checking existing participants:', existingError);
    }

    const existingIds = new Set((existingParticipants || []).map(p => p.user_id));
    const newUserIds = user_ids.filter((id: string) => !existingIds.has(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({ 
        message: 'All users are already in the group',
        added: 0 
      });
    }

    // Add new participants
    const participantInserts = newUserIds.map((userId: string) => ({
      conversation_id: groupId,
      user_id: userId,
    }));

    const { error: insertError } = await adminClient
      .from('conversation_participants')
      .insert(participantInserts);

    if (insertError) {
      console.error('Error adding participants:', insertError);
      return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
    }

    // Get profiles of new members for response
    const { data: newProfiles } = await adminClient
      .from('profiles')
      .select('*')
      .in('id', newUserIds);

    return NextResponse.json({ 
      message: 'Members added successfully',
      added: newUserIds.length,
      new_members: newProfiles || []
    });
  } catch (error) {
    console.error('Add members error:', error);
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members - Remove member from group (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('group_admins')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('user_id');

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Cannot remove group creator
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (group?.created_by === userIdToRemove) {
      return NextResponse.json({ error: 'Cannot remove the group creator' }, { status: 400 });
    }

    // Check if target is a super_admin (only super_admin can remove admins)
    const { data: targetAdmin } = await supabase
      .from('group_admins')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userIdToRemove)
      .single();

    if (targetAdmin && adminCheck.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can remove other admins' }, { status: 403 });
    }

    // Remove participant
    const { error: removeError } = await adminClient
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', groupId)
      .eq('user_id', userIdToRemove);

    if (removeError) {
      console.error('Error removing participant:', removeError);
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }

    // Remove from admins if applicable
    await adminClient
      .from('group_admins')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userIdToRemove);

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
