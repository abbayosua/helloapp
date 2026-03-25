import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Group, GroupAdmin, Profile } from '@/types/database';

interface GroupWithDetails extends Group {
  admins: (GroupAdmin & { profile: Profile })[];
  participants: (Profile & { is_admin: boolean; admin_role?: string })[];
  created_by_profile: Profile | null;
}

// GET /api/groups/[id] - Get group details
export async function GET(
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

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get group admins
    const { data: admins, error: adminsError } = await supabase
      .from('group_admins')
      .select('*, profile:profiles!group_admins_user_id_fkey(*)')
      .eq('group_id', groupId);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    }

    // Get all participants using admin client to bypass RLS
    const { data: participants, error: participantsError } = await adminClient
      .from('conversation_participants')
      .select('user_id, joined_at, last_read_at')
      .eq('conversation_id', groupId);

    console.log('Participants query error:', participantsError);
    console.log('Participants data:', JSON.stringify(participants, null, 2));

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
    }

    // Get profiles for all participants
    const participantIds = (participants || []).map(p => p.user_id);
    const { data: participantProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', participantIds);

    console.log('Participant profiles count:', participantProfiles?.length);

    // Get creator profile
    let createdByProfile: Profile | null = null;
    if (group.created_by) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', group.created_by)
        .single();
      createdByProfile = creatorProfile;
    }

    // Build admin set for quick lookup
    const adminSet = new Map(
      (admins || []).map(a => [a.user_id, a.role])
    );

    // Build profile map for quick lookup
    const profileMap = new Map(
      (participantProfiles || []).map(p => [p.id, p])
    );

    // Build response
    const groupWithDetails: GroupWithDetails = {
      ...group,
      admins: (admins || []).map(a => ({
        ...a,
        profile: a.profile as Profile,
      })),
      participants: (participants || []).map(p => {
        const profile = profileMap.get(p.user_id);
        return {
          ...(profile || { id: p.user_id, created_at: '', updated_at: '', status: 'offline', about: '', phone: null, display_name: null, avatar_url: null, last_seen: null }),
          is_admin: adminSet.has(p.user_id),
          admin_role: adminSet.get(p.user_id),
        };
      }),
      created_by_profile: createdByProfile,
    };

    return NextResponse.json({ group: groupWithDetails });
  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] - Update group settings
export async function PATCH(
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
      return NextResponse.json({ error: 'Only admins can update group settings' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, avatar_url, only_admins_send } = body;

    // Build update object
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (only_admins_send !== undefined) updates.only_admins_send = only_admins_send;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update group
    const { data: group, error: updateError } = await adminClient
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError || !group) {
      console.error('Error updating group:', updateError);
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - Leave group (or delete if creator)
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

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a participant
    const { data: participation, error: participationError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Remove user from participants
    const { error: removeError } = await adminClient
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', groupId)
      .eq('user_id', user.id);

    if (removeError) {
      console.error('Error leaving group:', removeError);
      return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
    }

    // Remove from admins if applicable
    await adminClient
      .from('group_admins')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    // Check remaining participants
    const { data: remainingParticipants, error: countError } = await adminClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', groupId);

    if (countError) {
      console.error('Error counting participants:', countError);
    }

    // If no participants left, delete the group
    if (!remainingParticipants || remainingParticipants.length === 0) {
      await adminClient.from('groups').delete().eq('id', groupId);
      await adminClient.from('conversations').delete().eq('id', groupId);
      return NextResponse.json({ message: 'Group deleted', deleted: true });
    }

    // If creator left and there are remaining participants, transfer ownership
    if (group.created_by === user.id && remainingParticipants.length > 0) {
      // Promote the first remaining participant to super_admin
      const newOwnerId = remainingParticipants[0].user_id;
      
      await adminClient
        .from('groups')
        .update({ created_by: newOwnerId })
        .eq('id', groupId);

      // Ensure new owner is an admin
      const { data: existingAdmin } = await adminClient
        .from('group_admins')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', newOwnerId)
        .single();

      if (!existingAdmin) {
        await adminClient
          .from('group_admins')
          .insert({ group_id: groupId, user_id: newOwnerId, role: 'super_admin' });
      } else {
        await adminClient
          .from('group_admins')
          .update({ role: 'super_admin' })
          .eq('group_id', groupId)
          .eq('user_id', newOwnerId);
      }
    }

    return NextResponse.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}
