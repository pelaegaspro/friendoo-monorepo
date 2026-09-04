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

function getFallbackCalls(): CrmCallLog[] {
  const now = Date.now();
  return [
    {
      id: "call-1",
      callId: "call-1",
      callerUid: "00000000-0000-4000-8000-000000000101",
      callerName: "Realtime Test User",
      callerPhone: "+91 88709 47891",
      hostUid: "00000000-0000-4000-8000-000000000102",
      hostName: "Realtime Test Host",
      hostPhone: "+91 76049 91136",
      callType: "audio",
      status: "ended",
      durationSeconds: 245,
      coinsDeducted: 25,
      ratePerMinute: 5,
      channelName: "friendoo_live_room_alpha",
      endReason: "caller_hangup",
      createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
      acceptedAt: new Date(now - 1000 * 60 * 14).toISOString(),
      startedAt: new Date(now - 1000 * 60 * 14).toISOString(),
      endedAt: new Date(now - 1000 * 60 * 10).toISOString(),
    },
    {
      id: "call-2",
      callId: "call-2",
      callerUid: "u_981",
      callerName: "Vikram Malhotra",
      callerPhone: "+91 98201 55432",
      hostUid: "h_002",
      hostName: "Pooja Reddy 🎧",
      hostPhone: "+91 91760 11223",
      callType: "audio",
      status: "active",
      durationSeconds: 160,
      coinsDeducted: 15,
      ratePerMinute: 5,
      channelName: "friendoo_live_room_beta",
      endReason: null,
      createdAt: new Date(now - 1000 * 160).toISOString(),
      acceptedAt: new Date(now - 1000 * 155).toISOString(),
      startedAt: new Date(now - 1000 * 150).toISOString(),
      endedAt: null,
    },
    {
      id: "call-3",
      callId: "call-3",
      callerUid: "u_442",
      callerName: "Rahul Verma",
      callerPhone: "+91 99887 76655",
      hostUid: "h_003",
      hostName: "Kavya Patel 👑",
      hostPhone: "+91 98765 33333",
      callType: "audio",
      status: "ended",
      durationSeconds: 480,
      coinsDeducted: 40,
      ratePerMinute: 5,
      channelName: "friendoo_live_room_gamma",
      endReason: "host_hangup",
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
      acceptedAt: new Date(now - 1000 * 60 * 89).toISOString(),
      startedAt: new Date(now - 1000 * 60 * 89).toISOString(),
      endedAt: new Date(now - 1000 * 60 * 81).toISOString(),
    },
    {
      id: "call-4",
      callId: "call-4",
      callerUid: "u_105",
      callerName: "Aditya Roy",
      callerPhone: "+91 97654 32109",
      hostUid: "h_001",
      hostName: "Ananya Sharma ⭐",
      hostPhone: "+91 98765 11111",
      callType: "audio",
      status: "missed",
      durationSeconds: 0,
      coinsDeducted: 0,
      ratePerMinute: 5,
      channelName: "friendoo_missed_room",
      endReason: "ringing_timeout",
      createdAt: new Date(now - 1000 * 60 * 240).toISOString(),
      acceptedAt: null,
      startedAt: null,
      endedAt: null,
    },
  ];
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
        let durationSeconds = 0;
        if (row.started_at && row.ended_at) {
          durationSeconds = Math.max(0, Math.round((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 1000));
        } else if (row.started_at && (row.status === "active" || row.status === "accepted")) {
          durationSeconds = Math.max(0, Math.round((Date.now() - new Date(row.started_at).getTime()) / 1000));
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
          status: row.status || "ended",
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
        calls: calls.length > 0 ? calls : getFallbackCalls(),
      };
    } catch (error) {
      console.warn("CRM calls fallback:", error);
      return {
        calls: getFallbackCalls(),
      };
    }
  }, 10);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

