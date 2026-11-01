import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const { data: tickets, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ticketError) throw ticketError;

    const reporterIds = Array.from(new Set((tickets || []).map((t) => t.reporter_id).filter(Boolean)));
    const profileMap: Record<string, { display_name: string; phone?: string; role: string; languages?: string[] }> = {};

    if (reporterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, phone, role, preferred_languages')
        .in('id', reporterIds);

      if (profiles) {
        profiles.forEach((p) => {
          profileMap[p.id] = {
            display_name: p.display_name || 'Friendoo User',
            phone: p.phone,
            role: p.role || 'user',
            languages: p.preferred_languages,
          };
        });
      }
    }

    const liveSessions = (tickets || []).map((t) => {
      const meta = (t.metadata as Record<string, any>) || {};
      const profile = profileMap[t.reporter_id];
      const role: 'user' | 'host' =
        meta.reporter_role === 'host' || profile?.role === 'host' ? 'host' : 'user';

      const name =
        meta.reporter_name || profile?.display_name || (role === 'host' ? 'Host User' : 'Caller User');
      const phone = meta.reporter_phone || profile?.phone;
      const utr = meta.utr || meta.order_id || (t.subject?.match(/\b\d{12}\b/)?.[0]);
      const payoutId = meta.payout_id || meta.payoutId;
      const amount = meta.amount_inr ? `₹${meta.amount_inr}` : meta.amount;
      const language = meta.language || (profile?.languages?.length ? profile.languages[0] : 'Tamil');

      const timeStr = new Date(t.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: t.id,
        userId: t.reporter_id || t.id,
        name,
        phone,
        role,
        scenario: meta.scenario || t.category || 'general',
        subject: t.subject || 'Support Ticket',
        status: (t.status === 'resolved' || t.status === 'closed' ? 'resolved' : 'active') as 'active' | 'resolved' | 'pending',
        utr,
        amount,
        payoutId,
        language,
        lastMessage: meta.last_admin_message || meta.verification_error || meta.initial_message || t.subject,
        lastMessageTime: timeStr,
        createdAt: t.created_at,
      };
    });

    return NextResponse.json({ tickets: liveSessions });
  } catch (error) {
    console.error('Error fetching admin support tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not fetch support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { userId, role, subject, message } = body;
    if (!userId || !message?.trim()) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Resolve user ID or short ID / phone to full UUID
    let targetId = userId.trim();
    const clean = targetId.replace(/^(host-|user-)/i, '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
      const { data: list } = await supabase
        .from('profiles')
        .select('id, display_name, role, phone')
        .or(`phone.ilike.%${clean}%,id.ilike.${clean}%`)
        .limit(1);
      if (list && list.length > 0) {
        targetId = list[0].id;
      }
    } else {
      targetId = clean;
    }

    const finalSubject = subject?.trim() || 'Official Account Notice';
    const finalMessage = message.trim();

    // 1. Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        reporter_id: targetId,
        category: 'admin_outreach',
        subject: finalSubject,
        status: 'open',
        priority: 'high',
        metadata: {
          admin_direct_message: true,
          last_admin_message: finalMessage,
          reporter_role: role || 'user',
          has_admin_message: true,
        },
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // 2. Insert into support_messages
    await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      body: finalMessage,
      is_internal: false,
    });

    // 3. Realtime broadcast to mobile app
    try {
      const channel = supabase.channel(`support_live:${targetId}`);
      await channel.send({
        type: 'broadcast',
        event: 'admin_message',
        payload: {
          message: finalMessage,
          sender: 'Friendoo Official Admin 🛡️',
          ticketId: ticket.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Realtime broadcast failed:', e);
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error('Error creating direct outreach ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create outreach ticket' },
      { status: 500 }
    );
  }
}
