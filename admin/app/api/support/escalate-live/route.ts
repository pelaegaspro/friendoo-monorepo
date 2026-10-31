import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jprbldvymjhgawzrqvun.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      name = 'Friendoo User',
      phone,
      role = 'user',
      scenario = 'live_support_request',
      initialMessage = 'User initiated live 1-on-1 chat with support team',
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Create or update an active support ticket in support_tickets table
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        reporter_id: userId,
        subject: `Live Support Request: ${name}`,
        category: scenario,
        status: 'open',
        metadata: {
          role,
          name,
          phone,
          scenario,
          escalated_at: new Date().toISOString(),
          initial_message: initialMessage,
        },
      })
      .select()
      .single();

    if (ticketError) {
      console.warn('Could not persist ticket to support_tickets (continuing with realtime broadcast):', ticketError.message);
    }

    // 2. Realtime Broadcast to both user-specific channel and global admin desk
    const userChannel = supabase.channel(`support_live:${userId}`);
    await userChannel.send({
      type: 'broadcast',
      event: 'user_escalation_request',
      payload: {
        userId,
        name,
        phone,
        role,
        scenario,
        message: initialMessage,
        ticketId: ticket?.id || `ticket_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    });

    const globalDeskChannel = supabase.channel('support_live_desk');
    await globalDeskChannel.send({
      type: 'broadcast',
      event: 'new_live_session',
      payload: {
        userId,
        name,
        phone,
        role,
        scenario,
        message: initialMessage,
        ticketId: ticket?.id || `ticket_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket?.id || `ticket_${Date.now()}`,
      message: 'Live chat session initialized with admin desk',
    });
  } catch (error: any) {
    console.error('Live escalation error:', error);
    return NextResponse.json(
      { error: 'Failed to escalate to live admin desk', details: error.message },
      { status: 500 }
    );
  }
}
