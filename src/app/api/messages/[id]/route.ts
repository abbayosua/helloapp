import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { UpdateMessage, MessageWithSender } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/messages/[id] - Edit message content
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender
    if (message.sender_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // Check if message is deleted
    if (message.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot edit a deleted message' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Update the message
    const updates: UpdateMessage = {
      content: content.trim(),
      is_edited: true,
    };

    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
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

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    // Transform the message to match MessageWithSender type
    const transformedMessage: MessageWithSender = {
      id: updatedMessage.id,
      created_at: updatedMessage.created_at,
      conversation_id: updatedMessage.conversation_id,
      sender_id: updatedMessage.sender_id,
      content: updatedMessage.content,
      message_type: updatedMessage.message_type,
      media_url: updatedMessage.media_url,
      reply_to: updatedMessage.reply_to,
      is_deleted: updatedMessage.is_deleted,
      is_edited: updatedMessage.is_edited,
      sender: updatedMessage.sender,
      reply_to_message: updatedMessage.reply_to_message,
      reactions: updatedMessage.reactions || [],
    };

    return NextResponse.json({ message: transformedMessage });
  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete message (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: messageId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select(
        `
        id,
        sender_id,
        conversation_id,
        is_deleted,
        conversation:conversations (
          type,
          created_by
        )
      `
      )
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if message is already deleted
    if (message.is_deleted) {
      return NextResponse.json(
        { error: 'Message is already deleted' },
        { status: 400 }
      );
    }

    // Check permissions:
    // - User can delete their own messages
    // - Group admins can delete any message in the group
    const isSender = message.sender_id === user.id;
    let isAdmin = false;

    if (!isSender && message.conversation?.type === 'group') {
      // Check if user is a group admin
      const { data: adminCheck } = await supabase
        .from('group_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('group_id', message.conversation_id)
        .single();

      isAdmin = !!adminCheck;
    }

    if (!isSender && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Parse request body for delete options
    let deleteForEveryone = true;
    try {
      const body = await request.json();
      deleteForEveryone = body.delete_for_everyone !== false;
    } catch {
      // No body provided, default to delete for everyone
    }

    if (deleteForEveryone) {
      // Soft delete for everyone (mark as deleted)
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          content: null,
          media_url: null,
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error deleting message:', updateError);
        return NextResponse.json(
          { error: 'Failed to delete message' },
          { status: 500 }
        );
      }
    } else {
      // Delete only for the current user
      // This would require a separate table to track deleted_for
      // For now, we'll treat it as a soft delete for everyone
      // In a real implementation, you'd insert into a message_deletions table
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          content: null,
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error deleting message:', updateError);
        return NextResponse.json(
          { error: 'Failed to delete message' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
