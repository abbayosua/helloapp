import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const searchTerm = query.trim();

    // Search users by phone or display_name
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, phone, status, last_seen')
      .or(`phone.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .neq('id', user.id) // Exclude current user
      .limit(20);

    if (error) {
      console.error('Search users error:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: profiles || [],
      query: searchTerm,
    });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
