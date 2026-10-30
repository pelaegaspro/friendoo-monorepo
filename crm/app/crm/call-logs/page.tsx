"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  PhoneCall,
  Server,
  Zap,
  Download,
  Search,
  RefreshCw,
  Phone,
  Video,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { KPICard } from "@/components/crm/KPICard";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crmFetch } from "@/lib/client";

interface CallLog {
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

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function downloadCsv(rows: CallLog[]) {
  const header = [
    "Call ID",
    "Caller Name",
    "Caller Phone",
    "Caller UID",
    "Host Name",
    "Host Phone",
    "Host UID",
    "Call Type",
    "Status",
    "Duration (sec)",
    "Duration (formatted)",
    "Coins Deducted",
    "Rate/Min",
    "RTC Channel",
    "End Reason",
    "Created At",
    "Ended At",
  ];

  const lines = rows.map((r) =>
    [
      r.callId,
      r.callerName,
      r.callerPhone ?? "",
      r.callerUid,
      r.hostName,
      r.hostPhone ?? "",
      r.hostUid,
      r.callType,
      r.status,
      r.durationSeconds,
      formatDuration(r.durationSeconds),
      r.coinsDeducted,
      r.ratePerMinute,
      r.channelName,
      r.endReason ?? "",
      r.createdAt ?? "",
      r.endedAt ?? "",
    ]
      .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `friendoo-call-logs-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmFetch<{ calls: CallLog[] }>("/api/crm/calls/list");
      setLogs(res.calls || []);
    } catch (err) {
      console.error("Failed to load call logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== "all") {
        if (statusFilter === "active" && log.status !== "active" && log.status !== "ringing" && log.status !== "accepted") {
          return false;
        }
        if (statusFilter === "ended" && log.status !== "ended") {
          return false;
        }
        if (statusFilter === "missed" && log.status !== "missed" && log.status !== "rejected") {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.callId.toLowerCase().includes(q) ||
        log.callerName.toLowerCase().includes(q) ||
        (log.callerPhone && log.callerPhone.includes(q)) ||
        log.hostName.toLowerCase().includes(q) ||
        (log.hostPhone && log.hostPhone.includes(q)) ||
        log.channelName.toLowerCase().includes(q) ||
        (log.endReason && log.endReason.toLowerCase().includes(q))
      );
    });
  }, [logs, statusFilter, searchQuery]);

  // Derived KPI calculations
  const totalCalls = logs.length;
  const activeCalls = logs.filter(
    (l) => l.status === "active" || l.status === "ringing" || l.status === "accepted"
  ).length;
  const totalCoinsBilled = logs.reduce((acc, l) => acc + l.coinsDeducted, 0);
  const endedCalls = logs.filter((l) => l.status === "ended").length;
  const completionRatio = totalCalls > 0 ? Math.round((endedCalls / totalCalls) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              WebRTC Diagnostics & Call Logs
            </h1>
            <span className="bento-pill-live">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
              Signaling Active
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Real-time Agora/WebRTC signaling telemetry, call session durations, and caller-host coin settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Row 1: Diagnostics Bento Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Logged Calls"
          value={`${totalCalls}`}
          icon={PhoneCall}
          variant="spotlight"
          badge="Live History"
          footer="All recorded voice & video sessions"
        />
        <KPICard
          title="Active Sessions"
          value={`${activeCalls}`}
          icon={Activity}
          variant="cyan"
          badge={activeCalls > 0 ? "In Call" : "Idle"}
          footer="Live signaling channels active"
        />
        <KPICard
          title="Total Coins Billed"
          value={`₹${totalCoinsBilled.toLocaleString("en-IN")}`}
          icon={Coins}
          variant="emerald"
          badge="Settled"
          footer="Caller spend deducted via ledger"
        />
        <KPICard
          title="Completion Ratio"
          value={`${completionRatio}%`}
          icon={Zap}
          variant="default"
          badge="Nominal"
          footer={`${endedCalls} completed sessions`}
        />
      </div>

      {/* Row 2: Live Signaling Logs Table Bento */}
      <div className="bento-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">WebRTC Session Records</h3>
              <p className="text-xs text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} logged sessions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "ended", label: "Ended" },
                { id: "missed", label: "Missed / Dropped" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === tab.id
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search caller, host, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-surface/50 border-white/10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead>
              <TableRow className="border-white/10 text-muted-foreground text-xs">
                <TableHead>Caller</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Coins Billed</TableHead>
                <TableHead>Agora Channel</TableHead>
                <TableHead>End Reason</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-28 text-muted-foreground text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                      Loading call logs from database...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-28 text-muted-foreground text-xs">
                    No matching call logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const isActive =
                    log.status === "active" || log.status === "ringing" || log.status === "accepted";
                  const isEnded = log.status === "ended";

                  return (
                    <TableRow key={log.id} className="hover:bg-white/5 text-xs">
                      {/* Caller Column */}
                      <TableCell>
                        <div className="font-semibold text-foreground">{log.callerName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {log.callerPhone || log.callerUid.slice(0, 8)}
                        </div>
                      </TableCell>

                      {/* Host Column */}
                      <TableCell>
                        <div className="font-semibold text-purple-300">{log.hostName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {log.hostPhone || log.hostUid.slice(0, 8)}
                        </div>
                      </TableCell>

                      {/* Media Type */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                          {log.callType === "video" ? (
                            <Video className="h-3 w-3" />
                          ) : (
                            <Phone className="h-3 w-3" />
                          )}
                          {log.callType}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                            {log.status === "ringing" ? "Ringing" : "In Call"}
                          </span>
                        ) : isEnded ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Ended
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 capitalize">
                            {log.status}
                          </span>
                        )}
                      </TableCell>

                      {/* Duration */}
                      <TableCell className="font-mono font-medium text-foreground">
                        {formatDuration(log.durationSeconds)}
                      </TableCell>

                      {/* Coins Billed */}
                      <TableCell>
                        <span className="font-mono font-bold text-amber-300">
                          {log.coinsDeducted} coins
                        </span>
                      </TableCell>

                      {/* Channel Name */}
                      <TableCell>
                        <span className="font-mono text-cyan-400 truncate max-w-[130px] block" title={log.channelName}>
                          {log.channelName}
                        </span>
                      </TableCell>

                      {/* End Reason */}
                      <TableCell>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {log.endReason || (isActive ? "Connected" : "—")}
                        </span>
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
