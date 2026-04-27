"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPICard } from "@/components/crm/KPICard";
import { LiveChart } from "@/components/crm/LiveChart";
import { FraudAlertCard } from "@/components/crm/FraudAlertCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toNumber } from "@/lib/utils";

interface DashboardResponse {
  kpis: {
    totalRevenueToday: number;
    revenueVsYesterdayPct: number;
    activeCalls: number;
    coinsInCirculation: number;
    onlineHosts: number;
    newUsersToday: number;
    newUsersYesterday: number;
    openTickets: number;
  };
  revenueTrend: Array<{ day: string; amount: number }>;
  funnel: Array<{ step: string; count: number }>;
  topHosts: Array<{ hostId: string; name: string; totalCalls: number }>;
  callVolumeByHour: Array<{ hour: number; calls: number }>;
  alerts: Array<{
    id: string;
    severity?: "low" | "medium" | "high" | "urgent";
    userId?: string;
    type?: string;
    description?: string;
    createdAt?: unknown;
  }>;
}

export default function CrmDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHost, setSelectedHost] = useState<{ hostId: string; name: string; totalCalls: number } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/crm/stats/live", { cache: "no-store" });
    const json = (await response.json()) as DashboardResponse;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const funnelRows = useMemo(() => {
    const funnel = data?.funnel ?? [];
    return funnel.map((row, index) => {
      const previous = index > 0 ? funnel[index - 1].count : row.count;
      const conversion = previous > 0 ? (row.count / previous) * 100 : 0;
      return {
        ...row,
        conversion: Number(conversion.toFixed(1)),
      };
    });
  }, [data?.funnel]);

  const triggerAlertAction = async (alertId: string, action: string) => {
    await fetch("/api/crm/fraud/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, action }),
    });
    await load();
  };

  if (loading || !data) {
    return <div className="text-sm text-muted">Loading live dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KPICard
          title="Total Revenue (Today)"
          value={`Rs ${toNumber(data.kpis.totalRevenueToday).toFixed(0)}`}
          deltaValue={data.kpis.revenueVsYesterdayPct}
          deltaText={`${Math.abs(toNumber(data.kpis.revenueVsYesterdayPct)).toFixed(1)}% vs yesterday`}
        />
        <KPICard
          title="Active Calls"
          value={`Live ${data.kpis.activeCalls}`}
          footer="Updating every 15 sec"
        />
        <KPICard
          title="Coins in Circulation"
          value={`${data.kpis.coinsInCirculation.toLocaleString()} coins`}
        />
        <KPICard title="Online Hosts" value={`${data.kpis.onlineHosts}`} />
        <KPICard
          title="New Users"
          value={`${data.kpis.newUsersToday}`}
          footer={`Yesterday: ${data.kpis.newUsersYesterday}`}
        />
        <KPICard
          title="Open Tickets"
          value={`${data.kpis.openTickets}`}
          alert={data.kpis.openTickets > 10}
          footer={data.kpis.openTickets > 10 ? "High queue load" : "Within healthy range"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LiveChart title="Revenue Trend (Last 14 Days)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#a855f7" fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>

        <LiveChart title="User Funnel">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelRows} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis type="category" dataKey="step" tick={{ fill: "#a1a1aa", fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>

        <LiveChart title="Top Performing Hosts (This Week)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topHosts}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="totalCalls"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.topHosts.map((host) => (
              <Button
                key={host.hostId}
                size="sm"
                variant="secondary"
                onClick={() => setSelectedHost(host)}
              >
                {host.name}
              </Button>
            ))}
          </div>
        </LiveChart>

        <LiveChart title="Call Volume by Hour">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.callVolumeByHour}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="calls" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.alerts.length ? (
          data.alerts.map((alert) => (
            <FraudAlertCard key={alert.id} alert={alert} onAction={triggerAlertAction} />
          ))
        ) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm">No open fraud alerts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">All clear for now.</CardContent>
          </Card>
        )}
      </div>

      {selectedHost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{selectedHost.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>Host ID: {selectedHost.hostId}</div>
              <div>Total calls this week: {selectedHost.totalCalls}</div>
              <Button variant="secondary" onClick={() => setSelectedHost(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
