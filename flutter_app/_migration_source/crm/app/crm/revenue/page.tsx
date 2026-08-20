"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPICard } from "@/components/crm/KPICard";
import { LiveChart } from "@/components/crm/LiveChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";

const pieColors = ["#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#38bdf8", "#f97316"];

interface RevenueResponse {
  kpis: {
    todayRevenue: number;
    monthRevenue: number;
    mrrTrend: Array<{ month: string; value: number }>;
    arpu: number;
    platformCommission: number;
    topupConversionRate: number;
  };
  revenueByPackage: Array<{ name: string; value: number }>;
  dailyRevenue: Array<{ day: string; topupRevenue: number; commissionRevenue: number }>;
  revenueByCity: Array<{ city: string; value: number }>;
  topSpenders: Array<{
    uid: string;
    name: string;
    city: string;
    totalSpentInr: number;
    coinsPurchased: number;
    callsMade: number;
  }>;
  revenueAlerts: Array<{ type: "amber" | "red" | "green"; text: string }>;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/crm/revenue/stats", { cache: "no-store" });
    const json = (await response.json()) as RevenueResponse;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) return <div className="text-sm text-muted">Loading revenue intelligence...</div>;

  const mrrDelta =
    data.kpis.mrrTrend.length >= 2
      ? ((data.kpis.mrrTrend[data.kpis.mrrTrend.length - 1].value -
          data.kpis.mrrTrend[data.kpis.mrrTrend.length - 2].value) /
          Math.max(1, data.kpis.mrrTrend[data.kpis.mrrTrend.length - 2].value)) *
        100
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KPICard title="Today's Revenue" value={`Rs ${data.kpis.todayRevenue.toFixed(0)}`} />
        <KPICard title="Month Revenue" value={`Rs ${data.kpis.monthRevenue.toFixed(0)}`} />
        <KPICard title="MRR Trend" value={`Rs ${data.kpis.mrrTrend.at(-1)?.value.toFixed(0) || 0}`} deltaValue={mrrDelta} />
        <KPICard title="ARPU" value={`Rs ${data.kpis.arpu.toFixed(2)}`} />
        <KPICard title="Platform Commission" value={`Rs ${data.kpis.platformCommission.toFixed(0)}`} />
        <KPICard title="Top-up Conversion" value={`${data.kpis.topupConversionRate.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LiveChart title="Revenue by Package">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.revenueByPackage} dataKey="value" nameKey="name" outerRadius={110} label>
                  {data.revenueByPackage.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>

        <LiveChart title="Revenue by City">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCity}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis dataKey="city" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>

        <LiveChart title="Daily Revenue (30 Days)" className="xl:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyRevenue}>
                <defs>
                  <linearGradient id="topupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="commissionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="topupRevenue" stroke="#a855f7" fill="url(#topupGrad)" />
                <Area type="monotone" dataKey="commissionRevenue" stroke="#22c55e" fill="url(#commissionGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention (Sample Heatmap)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2">Signup Week</th>
                <th className="px-3 py-2">Week 0</th>
                <th className="px-3 py-2">Week 1</th>
                <th className="px-3 py-2">Week 2</th>
                <th className="px-3 py-2">Week 3</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((row) => (
                <tr key={row} className="border-b border-border">
                  <td className="px-3 py-2">Week {row + 1}</td>
                  {[100, 58 - row * 5, 33 - row * 4, 18 - row * 3].map((value, index) => (
                    <td key={index} className="px-3 py-2">
                      <span
                        className="inline-flex min-w-14 justify-center rounded px-2 py-1 text-xs"
                        style={{
                          backgroundColor:
                            value > 50
                              ? "rgba(34,197,94,0.22)"
                              : value > 25
                                ? "rgba(245,158,11,0.22)"
                                : "rgba(239,68,68,0.22)",
                        }}
                      >
                        {Math.max(0, value)}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Spenders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <thead className="bg-surface">
                <tr>
                  <TableHead>Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Total Spent (Rs)</TableHead>
                  <TableHead>Coins Purchased</TableHead>
                  <TableHead>Calls Made</TableHead>
                </tr>
              </thead>
              <tbody>
                {data.topSpenders.map((user, index) => (
                  <TableRow key={user.uid}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.city}</TableCell>
                    <TableCell>{user.totalSpentInr.toFixed(0)}</TableCell>
                    <TableCell>{user.coinsPurchased}</TableCell>
                    <TableCell>{user.callsMade}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {data.revenueAlerts.map((alert, index) => (
          <Card key={`${alert.type}-${index}`}>
            <CardContent className="p-4 text-sm">
              <div
                className="mb-2 h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    alert.type === "red" ? "#ef4444" : alert.type === "green" ? "#22c55e" : "#f59e0b",
                }}
              />
              {alert.text}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
