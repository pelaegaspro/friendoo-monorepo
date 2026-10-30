import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { getCachedOrFetch } from "@/lib/cache";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export interface CrmCallLog {
  id: string;
  callId: string;
  callerUid: string;
  callerName: string;
  callerPhone?: string;
  hostUid: string;
  hostName: string;
  hostPhone?: string;
  callType: string;
  status: string;
  durationSeconds: number;
  coinsDeducted: number;
  ratePerMinute: number;
  channelName: string;
  endReason: string | null;
  createdAt: string | null;
  acceptedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const payload = await getCachedOrFetch("crm:api:calls:list", async () => {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("calls")
        .select(`
          id,
          caller_id,
          host_id,
          call_type,
          status,
          rate_per_minute,
          total_coins_deducted,
          rtc_channel,
          created_at,
          accepted_at,
          started_at,
          ended_at,
          end_reason
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const participantIds = Array.from(
        new Set((data ?? []).flatMap((c) => [c.caller_id, c.host_id]).filter(Boolean))
      );
      const profileMap = new Map<string, { display_name: string | null; phone: string | null }>();
      if (participantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, phone")
          .in("id", participantIds);
        (profiles ?? []).forEach((p) => {
          profileMap.set(p.id, { display_name: p.display_name, phone: p.phone });
        });
      }

      const calls: CrmCallLog[] = (data ?? []).map((row) => {
        const isStale = !row.ended_at && row.created_at && (Date.now() - new Date(row.created_at).getTime() > 30 * 60 * 1000);
        const hasEnded = Boolean(row.ended_at) || isStale;

        let durationSeconds = 0;
        if (row.started_at && row.ended_at) {
          durationSeconds = Math.max(0, Math.round((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 1000));
        } else if (row.started_at && (row.status === "active" || row.status === "accepted") && !hasEnded) {
          durationSeconds = Math.max(0, Math.round((Date.now() - new Date(row.started_at).getTime()) / 1000));
        } else if (row.started_at) {
          durationSeconds = 60;
        }

        const callerProfile = row.caller_id ? profileMap.get(row.caller_id) : null;
        const hostProfile = row.host_id ? profileMap.get(row.host_id) : null;

        return {
          id: row.id,
          callId: row.id,
          callerUid: row.caller_id || "unknown",
          callerName: callerProfile?.display_name || (row.caller_id ? "Caller " + row.caller_id.slice(0, 6) : "Unknown Caller"),
          callerPhone: callerProfile?.phone || undefined,
          hostUid: row.host_id || "unknown",
          hostName: hostProfile?.display_name || (row.host_id ? "Host " + row.host_id.slice(0, 6) : "Unknown Host"),
          hostPhone: hostProfile?.phone || undefined,
          callType: row.call_type || "audio",
          status: hasEnded ? "ended" : (row.status || "ended"),
          durationSeconds,
          coinsDeducted: toNumber(row.total_coins_deducted, 0),
          ratePerMinute: toNumber(row.rate_per_minute, 5),
          channelName: row.rtc_channel || "rtc_default",
          endReason: row.end_reason ? String(row.end_reason) : null,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
          acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
          startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
          endedAt: row.ended_at ? new Date(row.ended_at).toISOString() : null,
        };
      });

      return {
        calls,
      };
    } catch (error) {
      console.warn("CRM calls error:", error);
      return {
        calls: [],
      };
    }
  }, 10);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

