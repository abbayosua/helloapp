import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// POST /api/groups/[id]/invite - Generate/regenerate invite link
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

    // Check if user is an admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('group_admins')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Only admins can generate invite links' }, { status: 403 });
    }

    // Generate unique invite link
    const inviteLink = randomBytes(16).toString('base64url');

    // Update group with new invite link
    const { data: group, error: updateError } = await adminClient
      .from('groups')
      .update({ invite_link: inviteLink })
      .eq('id', groupId)
      .select()
      .single();

    if (updateError || !group) {
      console.error('Error updating invite link:', updateError);
      return NextResponse.json({ error: 'Failed to generate invite link' }, { status: 500 });
    }

    return NextResponse.json({ 
      invite_link: inviteLink,
      invite_url: `/join/${inviteLink}`
    });
  } catch (error) {
    console.error('Generate invite error:', error);
    return NextResponse.json({ error: 'Failed to generate invite link' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/invite - Revoke invite link
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
      return NextResponse.json({ error: 'Only admins can revoke invite links' }, { status: 403 });
    }

    // Remove invite link
    const { error: updateError } = await adminClient
      .from('groups')
      .update({ invite_link: null })
      .eq('id', groupId);

    if (updateError) {
      console.error('Error revoking invite link:', updateError);
      return NextResponse.json({ error: 'Failed to revoke invite link' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Invite link revoked' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    return NextResponse.json({ error: 'Failed to revoke invite link' }, { status: 500 });
  }
}

// GET /api/groups/[id]/invite - Get current invite link
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

    // Get group with invite link
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('invite_link, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      invite_link: group.invite_link,
      invite_url: group.invite_link ? `/join/${group.invite_link}` : null,
      group_name: group.name
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Failed to get invite link' }, { status: 500 });
  }
}
