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
import { LiveChart } from "@/components/crm/LiveChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";

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
    const response = await fetch("/api/crm/hosts/list", { cache: "no-store" });
    const json = await response.json();
    setHosts(json.hosts || []);
    setPendingApplications(json.pendingApplications || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leaderboard = useMemo(() => hosts.slice(0, 10), [hosts]);

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
    <div className="space-y-4">
      <LiveChart title="Host Leaderboard (Top 10 by Earnings)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaderboard}>
              <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="earningsCoins" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </LiveChart>

      <Card>
        <CardHeader>
          <CardTitle>Host Performance Table</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted">Loading hosts...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <thead className="bg-surface">
                  <tr>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Total Calls</TableHead>
                    <TableHead>Total Earnings (coins)</TableHead>
                    <TableHead>Avg Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Online</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map((host, index) => (
                    <TableRow key={host.uid} onClick={() => setSelectedHost(host)} className="cursor-pointer hover:bg-surface">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{host.name}</TableCell>
                      <TableCell>{host.city}</TableCell>
                      <TableCell>{host.totalCalls}</TableCell>
                      <TableCell>{host.earningsCoins}</TableCell>
                      <TableCell>{Math.round(host.avgCallDurationSec / 60)} min</TableCell>
                      <TableCell>{host.status}</TableCell>
                      <TableCell>
                        {host.isOnline ? <Badge variant="success">Online</Badge> : <Badge>Offline</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Host Applications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pendingApplications.length ? (
            pendingApplications.map((application) => (
              <div key={application.id} className="rounded-md border border-border bg-card p-3">
                <div className="text-sm font-semibold">{application.name || "Applicant"}</div>
                <div className="mt-1 text-xs text-muted">
                  {application.city || "-"} • {application.phone || "-"}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {(application.languages || []).join(", ") || "No languages listed"}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => approve(application.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary">
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted">No pending applications.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Host Availability Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[860px] space-y-2">
            <div className="grid grid-cols-[180px_repeat(24,minmax(24px,1fr))] gap-1 text-[10px] text-muted">
              <div />
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="text-center">
                  {hour}
                </div>
              ))}
            </div>
            {heatmapRows.map((row) => (
              <div
                key={row.host.uid}
                className="grid grid-cols-[180px_repeat(24,minmax(24px,1fr))] items-center gap-1"
              >
                <div className="truncate pr-2 text-xs">{row.host.name}</div>
                {row.values.map((value, index) => (
                  <div
                    key={`${row.host.uid}-${index}`}
                    className="h-5 rounded"
                    style={{
                      backgroundColor:
                        value > 0.9 ? "rgba(34,197,94,0.8)" : value > 0.5 ? "rgba(34,197,94,0.5)" : "rgba(63,63,70,0.8)",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedHost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{selectedHost.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>City: {selectedHost.city}</div>
              <div>Rate/min: {selectedHost.ratePerMinute}</div>
              <div>This week calls: {selectedHost.totalCalls}</div>
              <div>Total earnings: {selectedHost.earningsCoins} coins</div>
              <div>Avg duration: {Math.round(selectedHost.avgCallDurationSec / 60)} min</div>
              <div>Complaints: {selectedHost.complaintsCount}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="danger" size="sm">
                  Suspend Host
                </Button>
                <Button variant="secondary" size="sm">
                  Edit Rate
                </Button>
                <Button variant="secondary" size="sm">
                  Add Bonus Coins
                </Button>
              </div>
              <Button variant="secondary" className="mt-3" onClick={() => setSelectedHost(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
