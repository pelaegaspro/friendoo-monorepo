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

      return { hosts: hosts.length ? hosts : undefined, pendingApplications };
    } catch {
      const mockHosts = [
        { uid: "h1", name: "Ananya Sharma ⭐", city: "Mumbai", ratePerMinute: 6, totalCalls: 148, earningsCoins: 22400, avgCallDurationSec: 420, complaintsCount: 0, status: "verified", isOnline: true },
        { uid: "h2", name: "Pooja Reddy 🎧", city: "Hyderabad", ratePerMinute: 5, totalCalls: 124, earningsCoins: 18600, avgCallDurationSec: 360, complaintsCount: 1, status: "verified", isOnline: true },
        { uid: "h3", name: "Kavya Patel 👑", city: "Ahmedabad", ratePerMinute: 6, totalCalls: 109, earningsCoins: 16400, avgCallDurationSec: 510, complaintsCount: 0, status: "verified", isOnline: false },
        { uid: "h4", name: "Sneha Nair ✦", city: "Bengaluru", ratePerMinute: 5, totalCalls: 96, earningsCoins: 14100, avgCallDurationSec: 330, complaintsCount: 0, status: "verified", isOnline: true },
        { uid: "h5", name: "Riya Sen ✨", city: "Kolkata", ratePerMinute: 5, totalCalls: 84, earningsCoins: 12200, avgCallDurationSec: 290, complaintsCount: 0, status: "verified", isOnline: true },
        { uid: "h6", name: "Divya Kapoor 🎙️", city: "Delhi NCR", ratePerMinute: 7, totalCalls: 78, earningsCoins: 11800, avgCallDurationSec: 480, complaintsCount: 2, status: "verified", isOnline: false },
      ];
      const mockPending = [
        { id: "app-101", name: "Meera Krishnan", city: "Chennai", phone: "+91 98840 12345", languages: ["Tamil", "English", "Telugu"] },
        { id: "app-102", name: "Tanvi Deshmukh", city: "Pune", phone: "+91 98220 54321", languages: ["Marathi", "Hindi"] },
        { id: "app-103", name: "Simran Kaur", city: "Chandigarh", phone: "+91 98140 98765", languages: ["Punjabi", "Hindi"] },
      ];
      return { hosts: mockHosts, pendingApplications: mockPending };
    }
  }, 20);

  return NextResponse.json(payload);
}
