import { NextRequest, NextResponse } from 'next/server';
import { requireCrmAuth } from '@/app/api/crm/_utils';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getCachedOrFetch } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const search = new URL(request.url).searchParams.get('search')?.trim() || '';
    const payload = await getCachedOrFetch('crm:api:users:list:' + search, async () => {
      const supabase = getSupabaseAdmin();
      let profilesQuery = supabase.from('profiles').select('id, phone, display_name, role, is_banned, created_at, updated_at').order('created_at', { ascending: false }).limit(200);
      if (search) profilesQuery = profilesQuery.or('display_name.ilike.%' + search + '%,phone.ilike.%' + search + '%');
      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;
      const ids = (profiles ?? []).map((profile) => profile.id);
      const { data: wallets, error: walletsError } = ids.length ? await supabase.from('wallets').select('user_id, coin_balance, is_frozen, frozen_reason, updated_at').in('user_id', ids) : { data: [], error: null };
      if (walletsError) throw walletsError;
      const walletByUser = new Map((wallets ?? []).map((wallet) => [wallet.user_id, wallet]));
      const users = (profiles ?? []).map((profile) => ({ ...profile, uid: profile.id, displayName: profile.display_name, createdAt: profile.created_at, lastActive: profile.updated_at, coinBalance: walletByUser.get(profile.id)?.coin_balance ?? 0, wallet: walletByUser.get(profile.id) ?? null }));
      return { users };
    }, 20);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load users.' }, { status: 500 });
  }
}

