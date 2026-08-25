import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/guard';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const uiToDatabaseStatus: Record<string, string> = {
  pending: 'open',
  under_review: 'reviewed',
  resolved: 'resolved',
};

function toUiStatus(status: string) {
  return ({ open: 'pending', reviewed: 'under_review', resolved: 'resolved' } as Record<string, string>)[status] ?? 'pending';
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const requestedStatus = new URL(request.url).searchParams.get('status') ?? 'all';
    let reportsQuery = getSupabaseAdmin()
      .from('reports')
      .select('id, reporter_id, reported_user_id, call_id, reason, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const databaseStatus = uiToDatabaseStatus[requestedStatus];
    if (databaseStatus) reportsQuery = reportsQuery.eq('status', databaseStatus);
    if (requestedStatus === 'rejected') return NextResponse.json({ reports: [] });

    const { data: reportRows, error: reportsError } = await reportsQuery;
    if (reportsError) throw reportsError;

    const profileIds = Array.from(new Set((reportRows ?? []).flatMap((report) => [report.reporter_id, report.reported_user_id])));
    const { data: profiles, error: profilesError } = profileIds.length
      ? await getSupabaseAdmin().from('profiles').select('id, display_name').in('id', profileIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;

    const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const reports = (reportRows ?? []).map((report) => ({
      id: report.id,
      reporterId: report.reporter_id,
      reporterName: profileNames.get(report.reporter_id) ?? 'Anonymous',
      reportedId: report.reported_user_id,
      reportedName: profileNames.get(report.reported_user_id) ?? 'Anonymous',
      reportedAlias: profileNames.get(report.reported_user_id) ?? 'Anonymous',
      callId: report.call_id,
      reason: report.reason,
      status: toUiStatus(report.status),
      createdAt: report.created_at,
      timestamp: report.created_at,
      evidenceUrl: null,
      amountLost: 0,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.warn('reports route fallback:', error);
    return NextResponse.json({ reports: [] });
  }
}
