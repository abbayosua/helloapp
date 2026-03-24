import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Profile } from '@/types/database';

// GET - Get current user's full profile
export async function GET() {
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

    // Get full profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Get profile error:', error);
      return NextResponse.json(
        { error: 'Failed to get profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update current user's profile
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { display_name, about, avatar_url, phone } = body as Partial<Pick<Profile, 'display_name' | 'about' | 'avatar_url' | 'phone'>>;

    // Build update object with only provided fields
    const updateData: Record<string, string | undefined> = {};
    
    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 100) {
        return NextResponse.json(
          { error: 'Display name must be a string with max 100 characters' },
          { status: 400 }
        );
      }
      updateData.display_name = display_name;
    }

    if (about !== undefined) {
      if (typeof about !== 'string' || about.length > 500) {
        return NextResponse.json(
          { error: 'About must be a string with max 500 characters' },
          { status: 400 }
        );
      }
      updateData.about = about;
    }

    if (avatar_url !== undefined) {
      if (typeof avatar_url !== 'string') {
        return NextResponse.json(
          { error: 'Avatar URL must be a string' },
          { status: 400 }
        );
      }
      updateData.avatar_url = avatar_url;
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return NextResponse.json(
          { error: 'Phone must be a string' },
          { status: 400 }
        );
      }
      // Check if phone is already taken by another user
      if (phone) {
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phone)
          .neq('id', user.id)
          .single();

        if (existingPhone) {
          return NextResponse.json(
            { error: 'Phone number is already in use' },
            { status: 400 }
          );
        }
      }
      updateData.phone = phone;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedProfile,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
