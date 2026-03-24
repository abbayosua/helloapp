import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/users/presence - Update user presence status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, last_seen } = body;

    // Validate status
    const validStatuses = ['online', 'offline', 'away'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, string | null> = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (last_seen !== undefined) {
      updateData.last_seen = last_seen || new Date().toISOString();
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update profile using admin client to bypass RLS
    const { data: updatedProfile, error } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update presence error:', error);
      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Update presence error:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}

// GET /api/users/presence - Get presence status for multiple users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('user_ids')?.split(',').filter(Boolean);

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get presence for specified users
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id, status, last_seen')
      .in('id', userIds);

    if (error) {
      console.error('Get presence error:', error);
      return NextResponse.json(
        { error: 'Failed to get presence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: profiles || [],
    });
  } catch (error) {
    console.error('Get presence error:', error);
    return NextResponse.json(
      { error: 'Failed to get presence' },
      { status: 500 }
    );
  }
}
