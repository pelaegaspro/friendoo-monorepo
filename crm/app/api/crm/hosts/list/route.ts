import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { getCachedOrFetch } from "@/lib/cache";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const payload = await getCachedOrFetch('crm:api:hosts:list', async () => {
    try {
      const supabase = getSupabaseAdmin();
      const [hostsRes, callsRes, pendingAppsRes] = await Promise.all([
        supabase.from("hosts").select(`
          id,
          bio,
          rate_per_audio_minute,
          is_available,
          rating,
          profiles (
            id,
            display_name,
            phone,
            avatar_path,
            about,
            is_banned
          )
        `).limit(100),
        supabase.from("calls").select("host_id, total_coins_deducted"),
        supabase.from("host_applications").select("*").eq("status", "pending"),
      ]);

      const callsByHost = new Map<string, number>();
      const earningsByHost = new Map<string, number>();
      (callsRes.data ?? []).forEach((c) => {
        if (!c.host_id) return;
        callsByHost.set(c.host_id, (callsByHost.get(c.host_id) ?? 0) + 1);
        earningsByHost.set(c.host_id, (earningsByHost.get(c.host_id) ?? 0) + toNumber(c.total_coins_deducted));
      });

      const hosts = (hostsRes.data ?? []).map((h) => {
        const p = (Array.isArray(h.profiles) ? h.profiles[0] : h.profiles) as Record<string, unknown> | null ?? {};
        const totalCalls = callsByHost.get(h.id) ?? 0;
        return {
          uid: h.id,
          name: String(p.display_name || "Friendoo Host"),
          photoURL: String(p.avatar_path || ""),
          city: "Mumbai",
          ratePerMinute: toNumber(h.rate_per_audio_minute, 5),
          totalCalls,
          earningsCoins: earningsByHost.get(h.id) ?? 0,
          avgCallDurationSec: 360,
          complaintsCount: 0,
          status: p.is_banned ? "suspended" : "verified",
          isOnline: Boolean(h.is_available),
        };
      }).sort((a, b) => b.earningsCoins - a.earningsCoins);

      const pendingApplications = (pendingAppsRes.data ?? []).map((app) => ({
        id: app.id,
        name: app.display_name,
        city: app.city || "Mumbai",
        phone: app.phone,
        languages: app.languages || ["Hindi"],
      }));

      return { hosts, pendingApplications };
    } catch (error) {
      console.warn("CRM hosts error:", error);
      return { hosts: [], pendingApplications: [] };
    }
  }, 20);

  return NextResponse.json(payload);
}
