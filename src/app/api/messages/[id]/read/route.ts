import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { NewMessageStatus } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/messages/[id]/read - Mark message as read
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        conversation_id,
        sender_id,
        is_deleted
      `
      )
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if message is deleted
    if (message.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot mark deleted message as read' },
        { status: 400 }
      );
    }

    // Check if user is a participant in this conversation
    const { data: participation, error: participationError } = await supabase
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

    // Don't mark own messages as read
    if (message.sender_id === user.id) {
      return NextResponse.json({
        success: true,
        message: 'Own messages are automatically read',
      });
    }

    // Check if already marked as read
    const { data: existingStatus } = await supabase
      .from('message_status')
      .select('id, status')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .single();

    if (existingStatus) {
      // Update existing status to 'read'
      const { error: updateError } = await supabase
        .from('message_status')
        .update({
          status: 'read',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStatus.id);

      if (updateError) {
        console.error('Error updating message status:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark message as read' },
          { status: 500 }
        );
      }
    } else {
      // Create new read status
      const newStatus: NewMessageStatus = {
        message_id: messageId,
        user_id: user.id,
        status: 'read',
      };

      const { error: insertError } = await supabase
        .from('message_status')
        .insert(newStatus);

      if (insertError) {
        console.error('Error creating message status:', insertError);
        return NextResponse.json(
          { error: 'Failed to mark message as read' },
          { status: 500 }
        );
      }
    }

    // Update the participant's last_read_at timestamp
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
