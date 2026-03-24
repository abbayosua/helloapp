import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/search - Search messages in conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
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

    // Check if user is a participant in this conversation
    const { data: participation, error: participationError } = await adminClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get search query
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ messages: [] });
    }

    // Search messages
    const { data: messages, error: messagesError } = await adminClient
      .from('messages')
      .select(
        `
        id,
        created_at,
        conversation_id,
        sender_id,
        content,
        message_type,
        media_url,
        reply_to,
        deleted_at,
        sender:profiles!sender_id (
          id,
          display_name,
          avatar_url,
          status
        )
      `
      )
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .ilike('content', `%${query.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) {
      console.error('Error searching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to search messages' },
        { status: 500 }
      );
    }

    // Transform messages
    const transformedMessages = (messages || []).map((msg) => ({
      ...msg,
      is_own: msg.sender_id === user.id,
      reactions: [],
    }));

    return NextResponse.json({
      messages: transformedMessages,
      query: query.trim(),
    });
  } catch (error) {
    console.error('Search messages error:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
