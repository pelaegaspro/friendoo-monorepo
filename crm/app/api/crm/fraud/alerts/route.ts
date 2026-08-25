import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase.from('fraud_alerts').select('id, user_id, alert_type, severity, status, evidence, assigned_to, resolution_note, resolved_at, created_at, updated_at').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const ids = Array.from(new Set((rows ?? []).flatMap((alert) => [alert.user_id, alert.assigned_to]).filter(Boolean)));
    const { data: profiles, error: profilesError } = ids.length ? await supabase.from('profiles').select('id, display_name').in('id', ids) : { data: [], error: null };
    if (profilesError) throw profilesError;
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const alerts = (rows ?? []).map((alert) => ({ ...alert, flaggedUserId: alert.user_id, flaggedUserName: alert.user_id ? names.get(alert.user_id) ?? 'Anonymous' : 'Unknown', assignedToName: alert.assigned_to ? names.get(alert.assigned_to) ?? null : null, createdAt: alert.created_at, updatedAt: alert.updated_at, resolvedAt: alert.resolved_at }));
    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load fraud alerts.' }, { status: 500 });
  }
}

