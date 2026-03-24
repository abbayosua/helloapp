import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { MessageWithSender, NewMessage } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/messages - Get paginated messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant in this conversation
    const { data: participation, error: participationError } = await supabase
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

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before'); // cursor for infinite scroll
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Build query for messages
    let query = supabase
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
        is_deleted,
        is_edited,
        sender:profiles!messages_sender_id_fkey (
          id,
          email,
          full_name,
          avatar_url,
          is_online
        ),
        reply_to_message:messages!messages_reply_to_fkey (
          id,
          content,
          sender_id,
          created_at
        ),
        reactions:message_reactions (
          id,
          user_id,
          reaction,
          created_at
        )
      `
      )
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Add cursor condition for pagination
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Determine if there are more messages
    const hasMore = messages && messages.length > limit;
    const messagesData = hasMore ? messages?.slice(0, limit) : messages;

    // Transform data to match MessageWithSender type
    const transformedMessages: MessageWithSender[] = (
      messagesData || []
    ).map((msg) => ({
      id: msg.id,
      created_at: msg.created_at,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      message_type: msg.message_type,
      media_url: msg.media_url,
      reply_to: msg.reply_to,
      is_deleted: msg.is_deleted,
      is_edited: msg.is_edited,
      sender: msg.sender,
      reply_to_message: msg.reply_to_message,
      reactions: msg.reactions || [],
    }));

    // Get the cursor for the next page (oldest message's created_at)
    const nextCursor =
      hasMore && messagesData && messagesData.length > 0
        ? messagesData[messagesData.length - 1].created_at
        : null;

    // Reverse the array so oldest messages come first for display
    const orderedMessages = transformedMessages.reverse();

    return NextResponse.json({
      messages: orderedMessages,
      next_cursor: nextCursor,
      has_more: hasMore,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a new message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant in this conversation
    const { data: participation, error: participationError } = await supabase
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

    // Parse request body
    const body = await request.json();
    const { content, reply_to, message_type = 'text', media_url } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // If replying to a message, verify it exists in the same conversation
    if (reply_to) {
      const { data: replyMessage, error: replyError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', reply_to)
        .eq('conversation_id', conversationId)
        .single();

      if (replyError || !replyMessage) {
        return NextResponse.json(
          { error: 'Reply message not found in this conversation' },
          { status: 400 }
        );
      }
    }

    // Create the message
    const newMessage: NewMessage = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      message_type,
      media_url: media_url || null,
      reply_to: reply_to || null,
      is_deleted: false,
      is_edited: false,
    };

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert(newMessage)
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
        is_deleted,
        is_edited,
        sender:profiles!messages_sender_id_fkey (
          id,
          email,
          full_name,
          avatar_url,
          is_online
        ),
        reply_to_message:messages!messages_reply_to_fkey (
          id,
          content,
          sender_id,
          created_at
        ),
        reactions:message_reactions (
          id,
          user_id,
          reaction,
          created_at
        )
      `
      )
      .single();

    if (insertError) {
      console.error('Error creating message:', insertError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Update conversation's last_message_at timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Transform the message to match MessageWithSender type
    const transformedMessage: MessageWithSender = {
      id: message.id,
      created_at: message.created_at,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.message_type,
      media_url: message.media_url,
      reply_to: message.reply_to,
      is_deleted: message.is_deleted,
      is_edited: message.is_edited,
      sender: message.sender,
      reply_to_message: message.reply_to_message,
      reactions: message.reactions || [],
    };

    return NextResponse.json({ message: transformedMessage }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
