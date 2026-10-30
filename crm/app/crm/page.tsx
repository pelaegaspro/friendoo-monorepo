"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { KPICard } from "@/components/crm/KPICard";
import { LiveChart } from "@/components/crm/LiveChart";
import { FraudAlertCard } from "@/components/crm/FraudAlertCard";
import { toNumber } from "@/lib/utils";
import { crmFetch } from "@/lib/client";

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
  topHosts: Array<{ hostId?: string; uid?: string; name: string; totalCalls?: number; calls?: number }>;
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

const initialDefaultData: DashboardResponse = {
  kpis: {
    totalRevenueToday: 0,
    revenueVsYesterdayPct: 0,
    activeCalls: 0,
    coinsInCirculation: 0,
    onlineHosts: 0,
    newUsersToday: 0,
    newUsersYesterday: 0,
    openTickets: 0,
  },
  revenueTrend: [],
  funnel: [],
  topHosts: [],
  callVolumeByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 })),
  alerts: [],
};

export default function CrmDashboardPage() {
  const [data, setData] = useState<DashboardResponse>(initialDefaultData);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const json = await crmFetch<DashboardResponse>("/api/crm/stats/live");
      if (json && json.kpis) {
        setData(json);
      }
    } catch (e) {
      console.warn("Using baseline dashboard state:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const manualRefresh = () => {
    setIsRefreshing(true);
    load();
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const triggerAlertAction = async (alertId: string, action: string) => {
    await fetch("/api/crm/fraud/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, action }),
    });
    await load();
  };

  // Identify "Today" point on the single-line chart
  const lastPoint = useMemo(() => {
    const list = data?.revenueTrend ?? [];
    return list.length > 0 ? list[list.length - 1] : null;
  }, [data?.revenueTrend]);

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="text-sm text-muted">Loading metrics...</span>
      </div>
    );
  }

  const revenuePct = toNumber(data.kpis.revenueVsYesterdayPct);
  const revenueTrendText = `${revenuePct >= 0 ? "+" : ""}${revenuePct.toFixed(1)}% vs yesterday`;
  const userDelta = data.kpis.newUsersToday - data.kpis.newUsersYesterday;
  const userTrendText = `${userDelta >= 0 ? "+" : ""}${userDelta} vs yesterday`;

  return (
    <div className="space-y-6">
      {/* Header Bar with exactly ONE clear primary action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Platform Metrics
          </h1>
          <p className="mt-1 text-xs text-muted">
            Overview of live calling sessions, host availability, and daily revenue.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={manualRefresh}
            disabled={isRefreshing}
            className="inline-flex h-8 items-center justify-center rounded-[8px] bg-accent px-4 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </div>

      {/* Grid Row 1: Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue today"
          value={`₹${toNumber(data.kpis.totalRevenueToday).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          metricChange={revenueTrendText}
          footer="Platform collections"
        />

        <KPICard
          title="Active calls"
          value={`${data.kpis.activeCalls}`}
          metricChange="Live voice sessions"
          footer="RTC connections"
        />

        <KPICard
          title="Online hosts"
          value={`${data.kpis.onlineHosts}`}
          metricChange="Available now"
          footer="Ready to accept calls"
        />

        <KPICard
          title="New users"
          value={`${data.kpis.newUsersToday}`}
          metricChange={userTrendText}
          footer="Registrations today"
        />
      </div>

      {/* Grid Row 2: Charts & Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simplified Single Line Chart with Today clearly marked */}
        <div className="lg:col-span-2">
          <LiveChart
            title="Revenue trend"
            subtitle="Daily performance with current day reference"
            metaBadge="Last 14 days"
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E4E4E7" strokeDasharray="2 2" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#71717A", fontSize: 12 }}
                    axisLine={{ stroke: "#E4E4E7" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717A", fontSize: 12 }}
                    axisLine={{ stroke: "#E4E4E7" }}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E4E4E7",
                      borderRadius: "8px",
                      boxShadow: "none",
                      fontSize: "12px",
                      color: "#18181B",
                    }}
                    formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, "Revenue"]}
                  />
                  {/* Single calm muted line */}
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#1F5C4E"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#1F5C4E", stroke: "#FFFFFF", strokeWidth: 2 }}
                  />
                  {/* Today clearly marked point */}
                  {lastPoint && (
                    <ReferenceDot
                      x={lastPoint.day}
                      y={lastPoint.amount}
                      r={5}
                      fill="#1F5C4E"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      label={{ value: "Today", position: "top", fill: "#1F5C4E", fontSize: 12, fontWeight: 500 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </LiveChart>
        </div>

        {/* Data Table: 6px Status Dots + Plain Text in 44px Rows */}
        <div className="crm-clean-card flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Top active hosts</h2>
              <p className="mt-0.5 text-xs text-muted">Weekly volume distribution</p>
            </div>

            <div className="divide-y divide-border">
              {(data?.topHosts ?? []).slice(0, 5).map((host, idx) => {
                const hostId = host.hostId || host.uid || `host-${idx + 1}`;
                const callCount = host.totalCalls ?? host.calls ?? 0;
                return (
                  <div key={hostId} className="crm-table-row justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={idx < 2 ? "status-dot-green" : "status-dot-neutral"} />
                      <span className="font-medium text-foreground">{host.name}</span>
                    </div>
                    <span className="text-muted font-normal">
                      {callCount} calls
                    </span>
                  </div>
                );
              })}

              {(!data?.topHosts || data.topHosts.length === 0) && (
                <div className="crm-table-row justify-center text-xs text-muted">
                  No active host records today
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>Minimum threshold: 10 calls</span>
            <span className="font-medium text-accent">Active</span>
          </div>
        </div>
      </div>

      {/* Grid Row 3: Account & Session Reviews */}
      <div className="crm-clean-card">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Activity review</h2>
            <p className="mt-0.5 text-xs text-muted">Items requiring manual operational sign-off</p>
          </div>
          <span className="text-xs text-muted font-medium">
            {data.alerts.length} pending
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.alerts.length > 0 ? (
            data.alerts.map((alert) => (
              <FraudAlertCard key={alert.id} alert={alert} onAction={triggerAlertAction} />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-muted">
              <span className="status-dot-green mr-2" />
              All systems operating within standard baseline parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
