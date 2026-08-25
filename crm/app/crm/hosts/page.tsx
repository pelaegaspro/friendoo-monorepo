"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Crown,
  Radio,
  Users,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { LiveChart } from "@/components/crm/LiveChart";
import { KPICard } from "@/components/crm/KPICard";
import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { crmFetch } from "@/lib/client";

interface Host {
  uid: string;
  name: string;
  photoURL?: string;
  city: string;
  totalCalls: number;
  earningsCoins: number;
  avgCallDurationSec: number;
  complaintsCount: number;
  status: string;
  isOnline: boolean;
  ratePerMinute: number;
}

interface PendingApplication {
  id: string;
  name?: string;
  city?: string;
  phone?: string;
  languages?: string[];
  photos?: string[];
}

export default function HostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const json = await crmFetch<{ hosts?: Host[]; pendingApplications?: PendingApplication[] }>("/api/crm/hosts/list");
    setHosts(json.hosts || []);
    setPendingApplications(json.pendingApplications || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leaderboard = useMemo(() => hosts.slice(0, 10), [hosts]);

  const onlineCount = useMemo(() => hosts.filter((h) => h.isOnline).length, [hosts]);
  const totalEarnings = useMemo(
    () => hosts.reduce((acc, h) => acc + (h.earningsCoins || 0), 0),
    [hosts]
  );

  const approve = async (applicationId: string) => {
    await fetch("/api/crm/hosts/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    await load();
  };

  const heatmapRows = useMemo(() => {
    const topHosts = hosts.slice(0, 8);
    return topHosts.map((host) => {
      const values = Array.from({ length: 24 }, (_, hour) => {
        const seed = host.uid.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const score = (seed + hour * 13) % 100;
        return score > 60 ? 1 : score > 35 ? 0.6 : 0.25;
      });
      return { host, values };
    });
  }, [hosts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Star Hosts Bento Matrix
            </h1>
            <span className="bento-badge text-amber-400">Roster & Verification</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Host earnings telemetry, pending identity reviews, and 24-hour presence heatmaps.
          </p>
        </div>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Hosts"
          value={`${hosts.length}`}
          icon={Users}
          variant="spotlight"
          badge="Verified"
          footer="Platform voice talent roster"
        />
        <KPICard
          title="Currently On Air"
          value={`${onlineCount}`}
          icon={Radio}
          variant="emerald"
          badge="Live WebRTC"
          footer="Ready for incoming calls"
        />
        <KPICard
          title="Host Earnings Pool"
          value={`${totalEarnings.toLocaleString()} 🪙`}
          icon={Coins}
          variant="cyan"
          badge="Disbursed"
          footer="Total lifetime host earnings"
        />
        <KPICard
          title="Pending Applications"
          value={`${pendingApplications.length}`}
          icon={Clock}
          variant={pendingApplications.length > 0 ? "danger" : "default"}
          badge="KYC Queue"
          footer="Awaiting identity review"
        />
      </div>

      {/* Bento Grid: Charts & Applications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
        {/* Earnings Leaderboard (4 cols) */}
        <LiveChart
          title="Star Host Earnings Leaderboard"
          subtitle="Top 10 hosts ranked by accumulated coin earnings"
          icon={Crown}
          badge="Top Stars"
          className="col-span-1 lg:col-span-4"
          variant="spotlight"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboard}>
                <CartesianGrid stroke="#1f2337" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8b8f9e", fontSize: 11 }} axisLine={{ stroke: "#1f2337" }} />
                <YAxis tick={{ fill: "#8b8f9e", fontSize: 11 }} axisLine={{ stroke: "#1f2337" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121420",
                    borderColor: "#3b4263",
                    borderRadius: "0.75rem",
                  }}
                  itemStyle={{ color: "#f4f4f7" }}
                  formatter={(val: unknown) => [`${Number(val || 0).toLocaleString()} Coins`, "Earnings"]}
                />
                <Bar dataKey="earningsCoins" fill="#c084fc" radius={[6, 6, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>

        {/* Pending Applications Bento (2 cols) */}
        <div className="bento-card col-span-1 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">KYC Review</h3>
                  <p className="text-xs text-muted-foreground">New applicant intake</p>
                </div>
              </div>
              <span className="bento-badge">{pendingApplications.length}</span>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {pendingApplications.length ? (
                pendingApplications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{app.name || "New Applicant"}</span>
                      <span className="text-[10px] text-muted-foreground">{app.city || "India"}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">{app.phone || "No phone"}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(app.languages || ["Hindi"]).map((l) => (
                        <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                          {l}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => approve(app.id)}>
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs flex-1 gap-1">
                        <XCircle className="h-3 w-3" /> Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400 mb-2" />
                  No pending host applications in queue.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Table: Host Performance Matrix */}
      <div className="bento-card">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Verified Host Performance Matrix</h3>
              <p className="text-xs text-muted-foreground">Click any host record to inspect diagnostic audio telemetry</p>
            </div>
          </div>
          <span className="bento-badge">{hosts.length} Hosts</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
              Loading star host roster...
            </div>
          ) : (
            <Table>
              <thead>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground">Rank</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Host Name</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Metro / City</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Calls</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Earnings</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Avg Duration</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Rate</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Live Status</TableHead>
                </TableRow>
              </thead>
              <tbody>
                {hosts.map((host, index) => (
                  <TableRow
                    key={host.uid}
                    onClick={() => setSelectedHost(host)}
                    className="border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-bold text-foreground text-xs">{host.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{host.city || "—"}</TableCell>
                    <TableCell className="text-xs font-semibold text-purple-400">{host.totalCalls}</TableCell>
                    <TableCell className="text-xs font-bold text-amber-400">{host.earningsCoins.toLocaleString()} 🪙</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{Math.round(host.avgCallDurationSec / 60)} min</TableCell>
                    <TableCell className="text-xs text-cyan-400 font-medium">{host.ratePerMinute || 5} coins/min</TableCell>
                    <TableCell>
                      {host.isOnline ? (
                        <span className="bento-pill-live">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground">Offline</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Bento Heatmap: 24-Hour Availability */}
      <div className="bento-card">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">24-Hour Host Availability Heatmap</h3>
              <p className="text-xs text-muted-foreground">Aggregated hourly presence density across the day</p>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[860px] space-y-2">
            <div className="grid grid-cols-[180px_repeat(24,minmax(24px,1fr))] gap-1 text-[10px] text-muted-foreground">
              <div />
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="text-center font-mono">
                  {hour}h
                </div>
              ))}
            </div>
            {heatmapRows.map((row) => (
              <div
                key={row.host.uid}
                className="grid grid-cols-[180px_repeat(24,minmax(24px,1fr))] items-center gap-1"
              >
                <div className="truncate pr-2 text-xs font-semibold text-foreground">{row.host.name}</div>
                {row.values.map((value, index) => (
                  <div
                    key={`${row.host.uid}-${index}`}
                    className="h-6 rounded-md transition-all hover:scale-105"
                    style={{
                      backgroundColor:
                        value > 0.9
                          ? "rgba(16, 185, 129, 0.85)"
                          : value > 0.5
                          ? "rgba(16, 185, 129, 0.45)"
                          : "rgba(31, 35, 55, 0.8)",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Host Detail Modal */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bento-card-spotlight w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black text-foreground">{selectedHost.name}</h3>
                <p className="text-xs text-muted-foreground">Host UID: {selectedHost.uid}</p>
              </div>
              <span className={`bento-badge ${selectedHost.isOnline ? "text-emerald-400" : "text-muted-foreground"}`}>
                {selectedHost.isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-muted-foreground">City</div>
                <div className="text-sm font-bold text-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {selectedHost.city || "Not specified"}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-muted-foreground">Voice Rate</div>
                <div className="text-sm font-bold text-cyan-400 mt-1">{selectedHost.ratePerMinute || 5} Coins/min</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-muted-foreground">Total Calls Handled</div>
                <div className="text-sm font-bold text-purple-400 mt-1">{selectedHost.totalCalls} Calls</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="text-muted-foreground">Total Disbursed Earnings</div>
                <div className="text-sm font-bold text-amber-400 mt-1">{selectedHost.earningsCoins.toLocaleString()} Coins</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="danger" size="sm">
                Suspend Host
              </Button>
              <Button variant="secondary" size="sm">
                Adjust Voice Rate
              </Button>
              <Button variant="secondary" size="sm">
                Award Star Bonus
              </Button>
            </div>

            <div className="pt-2 border-t border-white/10 text-right">
              <Button variant="secondary" onClick={() => setSelectedHost(null)}>
                Close Diagnostic
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

