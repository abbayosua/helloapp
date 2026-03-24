import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { NewMessageReaction } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Valid emoji reactions (WhatsApp-style)
const VALID_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// POST /api/messages/[id]/reactions - Add a reaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message
    const { data: message, error: fetchError } = await adminClient
      .from('messages')
      .select(
        `
        id,
        conversation_id,
        deleted_at
      `
      )
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if message is deleted
    if (message.deleted_at) {
      return NextResponse.json(
        { error: 'Cannot react to deleted message' },
        { status: 400 }
      );
    }

    // Check if user is a participant in this conversation
    const { data: participation, error: participationError } = await adminClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reaction } = body;

    // Validate reaction
    if (!reaction || typeof reaction !== 'string') {
      return NextResponse.json(
        { error: 'Reaction is required' },
        { status: 400 }
      );
    }

    if (!VALID_REACTIONS.includes(reaction)) {
      return NextResponse.json(
        { error: 'Invalid reaction. Must be one of: ' + VALID_REACTIONS.join(', ') },
        { status: 400 }
      );
    }

    // Check if user already has a reaction on this message
    const { data: existingReaction } = await adminClient
      .from('message_reactions')
      .select('id, emoji')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    if (existingReaction) {
      // If same reaction, remove it (toggle off)
      if (existingReaction.emoji === reaction) {
        const { error: deleteError } = await adminClient
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error('Error removing reaction:', deleteError);
          return NextResponse.json(
            { error: 'Failed to remove reaction' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'removed',
          message: 'Reaction removed',
        });
      }

      // If different reaction, update it
      const { error: updateError } = await adminClient
        .from('message_reactions')
        .update({ emoji: reaction })
        .eq('id', existingReaction.id);

      if (updateError) {
        console.error('Error updating reaction:', updateError);
        return NextResponse.json(
          { error: 'Failed to update reaction' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        message: 'Reaction updated',
        reaction: { user_id: user.id, emoji: reaction },
      });
    }

    // Add new reaction
    const newReaction: NewMessageReaction = {
      message_id: messageId,
      user_id: user.id,
      emoji: reaction,
    };

    const { data: insertedReaction, error: insertError } = await adminClient
      .from('message_reactions')
      .insert(newReaction)
      .select('id, user_id, emoji, created_at')
      .single();

    if (insertError) {
      console.error('Error adding reaction:', insertError);
      return NextResponse.json(
        { error: 'Failed to add reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: 'added',
      message: 'Reaction added',
      reaction: insertedReaction,
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id]/reactions - Remove a reaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reaction = searchParams.get('reaction');

    // Build the delete query
    let query = adminClient
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    // If specific reaction provided, only delete that one
    if (reaction) {
      query = query.eq('emoji', reaction);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('Error removing reaction:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reaction removed',
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}

// GET /api/messages/[id]/reactions - Get all reactions for a message
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message to verify access
    const { data: message, error: fetchError } = await adminClient
      .from('messages')
      .select(
        `
        id,
        conversation_id
      `
      )
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is a participant in this conversation
    const { data: participation, error: participationError } = await adminClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get all reactions for the message
    const { data: reactions, error: reactionsError } = await adminClient
      .from('message_reactions')
      .select(
        `
        id,
        user_id,
        emoji,
        created_at
      `
      )
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      );
    }

    // Get user profiles for reactions
    const userIds = [...new Set(reactions?.map(r => r.user_id) || [])];
    const { data: profiles } = userIds.length > 0 
      ? await adminClient
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds)
      : { data: [] };

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Group reactions by emoji
    const groupedReactions = (reactions || []).reduce<
      Record<string, { count: number; users: Array<{ id: string; name: string | null; avatar_url: string | null }> }>
    >((acc, reaction) => {
      const emoji = reaction.emoji;
      if (!acc[emoji]) {
        acc[emoji] = { count: 0, users: [] };
      }
      acc[emoji].count += 1;
      const userProfile = profileMap.get(reaction.user_id);
      acc[emoji].users.push({
        id: reaction.user_id,
        name: userProfile?.display_name || null,
        avatar_url: userProfile?.avatar_url || null,
      });
      return acc;
    }, {});

    return NextResponse.json({
      reactions: reactions || [],
      grouped: groupedReactions,
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get reactions' },
      { status: 500 }
    );
  }
}
