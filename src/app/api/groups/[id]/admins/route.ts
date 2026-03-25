import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/groups/[id]/admins - Promote member to admin
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

    // Check if user is a super_admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('group_admins')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can promote members' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, role = 'admin' } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if target user is a participant (use admin client to bypass RLS)
    console.log('Checking participation for:', { groupId, userId: user_id });
    
    const { data: participation, error: participationError } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', groupId)
      .eq('user_id', user_id)
      .single();

    console.log('Participation check result:', { participation, error: participationError });

    if (participationError || !participation) {
      // Try without single() to see all participants
      const { data: allParticipants } = await adminClient
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', groupId);
      console.log('All participants in group:', allParticipants);
      
      return NextResponse.json({ error: 'User is not a group member' }, { status: 400 });
    }

    // Check if already an admin
    const { data: existingAdmin } = await adminClient
      .from('group_admins')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user_id)
      .single();

    if (existingAdmin) {
      // Update role if already admin
      const { error: updateError } = await adminClient
        .from('group_admins')
        .update({ role })
        .eq('group_id', groupId)
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating admin:', updateError);
        return NextResponse.json({ error: 'Failed to update admin role' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Admin role updated', role });
    }

    // Add new admin
    const { error: insertError } = await adminClient
      .from('group_admins')
      .insert({ group_id: groupId, user_id, role });

    if (insertError) {
      console.error('Error adding admin:', insertError);
      return NextResponse.json({ error: 'Failed to promote member' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Member promoted to admin', role }, { status: 201 });
  } catch (error) {
    console.error('Promote admin error:', error);
    return NextResponse.json({ error: 'Failed to promote member' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/admins - Demote admin to member
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

    // Check if user is a super_admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('group_admins')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can demote admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userIdToDemote = searchParams.get('user_id');

    if (!userIdToDemote) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Cannot demote group creator
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (group?.created_by === userIdToDemote) {
      return NextResponse.json({ error: 'Cannot demote the group creator' }, { status: 400 });
    }

    // Cannot demote yourself
    if (userIdToDemote === user.id) {
      return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
    }

    // Remove admin
    const { error: removeError } = await adminClient
      .from('group_admins')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userIdToDemote);

    if (removeError) {
      console.error('Error demoting admin:', removeError);
      return NextResponse.json({ error: 'Failed to demote admin' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Admin demoted to member' });
  } catch (error) {
    console.error('Demote admin error:', error);
    return NextResponse.json({ error: 'Failed to demote admin' }, { status: 500 });
  }
}

// GET /api/groups/[id]/admins - List group admins
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant
    const { data: participation, error: participationError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all admins with profiles
    const { data: admins, error: adminsError } = await supabase
      .from('group_admins')
      .select('*, profile:profiles!group_admins_user_id_fkey(*)')
      .eq('group_id', groupId);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}
