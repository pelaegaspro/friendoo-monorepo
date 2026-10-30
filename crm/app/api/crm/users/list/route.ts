import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getCachedOrFetch } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const segment = url.searchParams.get('segment')?.trim() || 'all';

    const cacheKey = `crm:api:users:list:${segment}:${search}`;
    const payload = await getCachedOrFetch(cacheKey, async () => {
      const supabase = getSupabaseAdmin();

      // Only load caller accounts with role 'user'
      let profilesQuery = supabase
        .from('profiles')
        .select('id, phone, display_name, avatar_path, city, role, is_banned, created_at, updated_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(200);

      if (search) {
        profilesQuery = profilesQuery.or(`display_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      // Load candidate profiles and authoritative host IDs to enforce 100% strict caller/host separation
      const [profilesRes, hostsRes] = await Promise.all([
        profilesQuery,
        supabase.from('hosts').select('id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      const hostIdSet = new Set((hostsRes.data ?? []).map((h) => h.id));

      // Strips out any account that belongs to a host
      const callerProfiles = (profilesRes.data ?? []).filter(
        (p) => p.role !== 'host' && !hostIdSet.has(p.id)
      );

      const ids = callerProfiles.map((p) => p.id);

      // Concurrent retrieval of wallets, payment totals, and call counts
      const [walletsRes, paymentsRes, callsRes] = await Promise.all([
        ids.length
          ? supabase
              .from('wallets')
              .select('user_id, coin_balance, is_frozen, frozen_reason, updated_at')
              .in('user_id', ids)
          : { data: [], error: null },
        ids.length
          ? supabase
              .from('payment_orders')
              .select('user_id, amount_inr')
              .eq('status', 'success')
              .in('user_id', ids)
          : { data: [], error: null },
        ids.length
          ? supabase
              .from('calls')
              .select('caller_id')
              .in('caller_id', ids)
          : { data: [], error: null },
      ]);

      const walletByUser = new Map((walletsRes.data ?? []).map((w) => [w.user_id, w]));

      const spentByUser = new Map<string, number>();
      (paymentsRes.data ?? []).forEach((p) => {
        if (p.user_id) {
          spentByUser.set(p.user_id, (spentByUser.get(p.user_id) ?? 0) + Number(p.amount_inr || 0));
        }
      });

      const callsByUser = new Map<string, number>();
      (callsRes.data ?? []).forEach((c) => {
        if (c.caller_id) {
          callsByUser.set(c.caller_id, (callsByUser.get(c.caller_id) ?? 0) + 1);
        }
      });

      let users = callerProfiles.map((profile) => {
        const wallet = walletByUser.get(profile.id);
        const coinBalance = wallet?.coin_balance ?? 0;
        const totalSpentInr = spentByUser.get(profile.id) ?? 0;
        const totalCalls = callsByUser.get(profile.id) ?? 0;

        return {
          ...profile,
          uid: profile.id,
          displayName: profile.display_name || 'Caller',
          phone: profile.phone || '—',
          city: profile.city || '—',
          avatarPath: profile.avatar_path || null,
          createdAt: profile.created_at,
          lastActive: profile.updated_at || profile.created_at,
          coinBalance,
          totalSpentInr,
          totalCalls,
          wallet: wallet ?? null,
          isHost: false,
        };
      });

      // Segment filtering and dedicated sorting
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

      if (segment === 'low_balance') {
        users = users.filter((u) => u.coinBalance < 15);
        users.sort((a, b) => a.coinBalance - b.coinBalance);
      } else if (segment === 'vip') {
        users = users.filter((u) => u.totalSpentInr > 0 || u.coinBalance >= 50);
        users.sort((a, b) => (b.totalSpentInr - a.totalSpentInr) || (b.coinBalance - a.coinBalance));
      } else if (segment === 'new_user') {
        users = users.filter((u) => {
          const created = u.createdAt ? new Date(u.createdAt).getTime() : 0;
          return now - created <= fourteenDaysMs || u.totalSpentInr === 0;
        });
        users.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
      } else if (segment === 'first_call') {
        users = users.filter((u) => u.totalCalls >= 1);
        users.sort((a, b) => b.totalCalls - a.totalCalls);
      } else if (segment === 'inactive') {
        users = users.filter((u) => {
          const active = u.lastActive ? new Date(u.lastActive).getTime() : 0;
          return now - active > sevenDaysMs;
        });
        users.sort((a, b) => {
          const da = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          const db = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          return da - db;
        });
      } else if (segment === 'at_risk') {
        users = users.filter((u) => (u.totalCalls > 0 || u.totalSpentInr > 0) && u.coinBalance < 15);
        users.sort((a, b) => a.coinBalance - b.coinBalance);
      } else {
        // 'all'
        users.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
      }

      return { users };
    }, 5); // 5-second TTL for snappy responsive navigation

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load users.' },
      { status: 500 }
    );
  }
}
