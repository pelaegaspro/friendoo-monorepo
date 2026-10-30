import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const uiToDatabaseStatus: Record<string, string> = {
  pending: 'open',
  under_review: 'in_progress',
  resolved: 'resolved',
};

function toUiStatus(status: string) {
  return ({ open: 'pending', in_progress: 'under_review', resolved: 'resolved', closed: 'resolved' } as Record<string, string>)[status] ?? 'pending';
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get('status') ?? 'all';

    // 1. Concurrently query support_tickets and call reports
    const [ticketsRes, reportsRes] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('id, reporter_id, subject, category, priority, status, metadata, created_at, updated_at, resolved_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('reports')
        .select('id, reporter_id, reported_user_id, call_id, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    // 2. Resolve profile names & details
    const reporterIds = new Set<string>();
    (ticketsRes.data ?? []).forEach((t) => {
      if (t.reporter_id) reporterIds.add(t.reporter_id);
    });
    (reportsRes.data ?? []).forEach((r) => {
      if (r.reporter_id) reporterIds.add(r.reporter_id);
      if (r.reported_user_id) reporterIds.add(r.reported_user_id);
    });

    const idList = Array.from(reporterIds);
    const [profilesRes, walletsRes] = await Promise.all([
      idList.length
        ? supabase.from('profiles').select('id, display_name, phone, city, role').in('id', idList)
        : { data: [], error: null },
      idList.length
        ? supabase.from('wallets').select('user_id, coin_balance').in('user_id', idList)
        : { data: [], error: null },
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const walletMap = new Map((walletsRes.data ?? []).map((w) => [w.user_id, w.coin_balance]));

    // 3. Format Support Tickets
    const tickets = (ticketsRes.data ?? []).map((t) => {
      const p = t.reporter_id ? profileMap.get(t.reporter_id) : null;
      const meta = (t.metadata && typeof t.metadata === 'object' ? t.metadata : {}) as Record<string, unknown>;
      const scenario = String(meta.scenario || 'general');

      return {
        id: t.id,
        reporterId: t.reporter_id,
        reporterName: p?.display_name || meta.reporter_name || 'Anonymous Caller',
        reporterPhone: p?.phone || meta.reporter_phone || '—',
        reporterCity: p?.city || meta.reporter_city || '—',
        reporterRole: p?.role || meta.reporter_role || 'user',
        coinBalance: t.reporter_id ? (walletMap.get(t.reporter_id) ?? 0) : Number(meta.reporter_coin_balance || 0),
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        scenario,
        orderId: meta.order_id ? String(meta.order_id) : null,
        amountInr: meta.amount_inr ? Number(meta.amount_inr) : null,
        coins: meta.coins ? Number(meta.coins) : null,
        metadata: meta,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });

    // 4. Format Reports
    const reports = (reportsRes.data ?? []).map((report) => {
      const reporter = report.reporter_id ? profileMap.get(report.reporter_id) : null;
      const reported = report.reported_user_id ? profileMap.get(report.reported_user_id) : null;

      return {
        id: report.id,
        reporterId: report.reporter_id,
        reporterName: reporter?.display_name ?? 'Anonymous',
        reportedId: report.reported_user_id,
        reportedName: reported?.display_name ?? 'Anonymous',
        reportedAlias: reported?.display_name ?? 'Host',
        callId: report.call_id,
        reason: report.reason,
        status: toUiStatus(report.status),
        createdAt: report.created_at,
        timestamp: report.created_at,
        evidenceUrl: null,
        amountLost: 0,
      };
    });

    return NextResponse.json({ tickets, reports });
  } catch (error) {
    console.warn('reports route fallback:', error);
    return NextResponse.json({ tickets: [], reports: [] });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json() as { ticketId?: string; status?: string; internalNotes?: string };
    if (!body?.ticketId || !body?.status) {
      return NextResponse.json({ error: 'Missing ticketId or status' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: ticket, error: fetchErr } = await supabase
      .from('support_tickets')
      .select('metadata')
      .eq('id', body.ticketId)
      .single();

    if (fetchErr) throw fetchErr;

    const existingMeta = (ticket?.metadata && typeof ticket.metadata === 'object' ? ticket.metadata : {}) as Record<string, unknown>;
    const updatedMeta = {
      ...existingMeta,
      ifInternalNotes: body.internalNotes ? body.internalNotes : existingMeta.internal_notes,
      last_updated_by: 'admin',
    };

    const { error: updateErr } = await supabase
      .from('support_tickets')
      .update({
        status: body.status,
        metadata: updatedMeta,
        updated_at: now,
        resolved_at: body.status === 'resolved' ? now : null,
      })
      .eq('id', body.ticketId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, status: body.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
