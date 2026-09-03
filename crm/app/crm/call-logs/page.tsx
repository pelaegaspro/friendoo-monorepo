import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Activity, PhoneCall, Radio, Server, Zap } from "lucide-react";
import { KPICard } from "@/components/crm/KPICard";

export const dynamic = "force-dynamic";



interface CallLog {
  id: string;
  callerUid: string;
  callId: string;
  channelName: string;
  latencyMs?: number;
  createdAt: Date | null;
}

async function getCallLogs(): Promise<CallLog[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calls")
      .select("id, caller_id, rtc_channel, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
      
    return (data ?? []).map(row => ({
      id: row.id,
      callerUid: row.caller_id,
      callId: row.id,
      channelName: row.rtc_channel || "rtc_default",
      
      createdAt: row.created_at ? new Date(row.created_at) : null,
    }));
  } catch (error) {
    console.error("Failed to fetch call logs server-side:", error);
    return [];
  }
}

export default async function CallLogsPage() {
  const logs = await getCallLogs();
  const measuredLatencies = logs
    .map((log) => log.latencyMs)
    .filter((latency): latency is number => typeof latency === "number");
  const avgLatency = measuredLatencies.length
    ? Math.round(measuredLatencies.reduce((total, latency) => total + latency, 0) / measuredLatencies.length)
    : null;
  const nominalRatio = measuredLatencies.length
    ? Math.round((measuredLatencies.filter((latency) => latency < 300).length / measuredLatencies.length) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              WebRTC Diagnostics Bento
            </h1>
            <span className="bento-pill-live">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
              Signaling Active
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Monitor Agora token handshakes, RTC channel allocation, and packet round-trip time.
          </p>
        </div>
      </div>

      {/* Row 1: Diagnostics Bento Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Signaling Latency"
                    value={avgLatency === null ? "—" : `${avgLatency}ms`}

          icon={Activity}
          variant="spotlight"
          badge="APAC Gateway"
                    footer="Available when signaling telemetry is recorded"

        />
        <KPICard
          title="Handshake Success"
                    value={nominalRatio === null ? "—" : `${nominalRatio}%`}

          icon={Zap}
          variant="emerald"
          badge="Nominal"
                    footer="Requires measured signaling latency"

        />
        <KPICard
          title="Recent Dispatches"
          value={`${logs.length}`}
          icon={PhoneCall}
          footer="Last 50 WebRTC sessions"
        />
        <KPICard
          title="Audio Packet Mesh"
          value="Opus 48kHz"
          icon={Radio}
          variant="cyan"
          badge="HD Voice"
          footer="Full-band stereo ready"
        />
      </div>

      {/* Row 2: Live Signaling Logs Table Bento */}
      <div className="bento-card">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Recent WebRTC Connections</h3>
              <p className="text-xs text-muted-foreground">Detailed token authentication and channel routing records</p>
            </div>
          </div>
          <span className="bento-badge text-xs">
            {logs.length} Total Handshakes
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <thead>
              <TableRow className="border-white/10 text-muted-foreground text-xs">
                <TableHead>Call Session ID</TableHead>
                <TableHead>Caller UID</TableHead>
                <TableHead>Agora Channel</TableHead>
                <TableHead>Signaling RTT</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-28 text-muted-foreground text-xs">
                    No active WebRTC call logs found in recent telemetry.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-white/5 text-xs">
                    <TableCell className="font-mono font-bold text-purple-300">{log.callId}</TableCell>
                    <TableCell className="font-mono text-muted-foreground truncate max-w-[140px]">{log.callerUid}</TableCell>
                    <TableCell className="font-mono text-cyan-300">{log.channelName}</TableCell>
                    <TableCell>
                                            {typeof log.latencyMs === "number" ? (

                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                            log.latencyMs < 300
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {log.latencyMs}ms
                        </span>
                      ) : (
                                                <span className="text-muted-foreground">Not instrumented</span>

                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {log.createdAt ? log.createdAt.toLocaleString() : "Just now"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}

