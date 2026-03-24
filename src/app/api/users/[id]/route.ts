import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile by ID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, phone, about, status, last_seen, created_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      console.error('Get user profile error:', error);
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      );
    }

    // Check if this user is in the current user's contacts
    const { data: contactInfo } = await supabase
      .from('contacts')
      .select('id, name, is_blocked')
      .eq('owner_id', user.id)
      .eq('phone', profile.phone)
      .single();

    return NextResponse.json({
      user: {
        ...profile,
        is_contact: !!contactInfo,
        contact_name: contactInfo?.name || null,
        is_blocked: contactInfo?.is_blocked || false,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}
