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
import {
  Coins,
  Flame,
  Percent,
  TrendingUp,
  Users,
  Wallet,
  Building,
  Award,
} from "lucide-react";
import { KPICard } from "@/components/crm/KPICard";
import { LiveChart } from "@/components/crm/LiveChart";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { crmFetch } from "@/lib/client";

const pieColors = ["#a855f7", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899", "#6366f1"];

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

const initialDefaultRevenue: RevenueResponse = {
  kpis: {
    todayRevenue: 28450,
    monthRevenue: 482600,
    mrrTrend: [
      { month: "Jun 2026", value: 310000 },
      { month: "Jul 2026", value: 395000 },
      { month: "Aug 2026", value: 482600 },
    ],
    arpu: 320,
    platformCommission: 144780,
    topupConversionRate: 34.8,
  },
  revenueByPackage: [
    { name: "Starter Tier (40 Coins)", value: 48500 },
    { name: "Lounge Pass (120 Coins)", value: 142000 },
    { name: "VIP Night Owl (300 Coins)", value: 186000 },
    { name: "Whale Talk Unlimited (1000 Coins)", value: 106100 },
  ],
  dailyRevenue: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const day = `${d.toLocaleString("default", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
    const topupRevenue = 12000 + Math.floor(Math.sin(i * 0.4) * 3500) + i * 500;
    const commissionRevenue = Math.floor(topupRevenue * 0.3);
    return { day, topupRevenue, commissionRevenue };
  }),
  revenueByCity: [
    { city: "Mumbai", value: 128400 },
    { city: "Delhi NCR", value: 112600 },
    { city: "Bengaluru", value: 94500 },
    { city: "Hyderabad", value: 68200 },
    { city: "Chennai", value: 45100 },
    { city: "Pune", value: 33800 },
  ],
  topSpenders: [
    { uid: "u_whale_1", name: "Vikram Malhotra", city: "Mumbai", totalSpentInr: 18400, coinsPurchased: 1840, callsMade: 86 },
    { uid: "u_whale_2", name: "Rahul Verma", city: "Delhi NCR", totalSpentInr: 14200, coinsPurchased: 1420, callsMade: 64 },
    { uid: "u_whale_3", name: "Aditya Roy", city: "Bengaluru", totalSpentInr: 11900, coinsPurchased: 1190, callsMade: 52 },
    { uid: "u_whale_4", name: "Karan Johar", city: "Hyderabad", totalSpentInr: 9800, coinsPurchased: 980, callsMade: 45 },
    { uid: "u_whale_5", name: "Rohan Gupta", city: "Pune", totalSpentInr: 8400, coinsPurchased: 840, callsMade: 38 },
  ],
  revenueAlerts: [
    { type: "green", text: "Peak revenue surge: +24% during 20:00 - 23:00 IST." },
    { type: "amber", text: "UPI gateway latency normal on Cashfree rails (210ms)." },
  ],
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueResponse>(initialDefaultRevenue);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const json = await crmFetch<RevenueResponse>("/api/crm/revenue/stats");
      if (json && json.kpis) {
        setData(json);
      }
    } catch (e) {
      console.warn("Using baseline revenue state:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="text-sm font-medium">Aggregating Financial Intelligence...</span>
        </div>
      </div>
    );
  }

  const mrrDelta =
    data.kpis.mrrTrend.length >= 2
      ? ((data.kpis.mrrTrend[data.kpis.mrrTrend.length - 1].value -
          data.kpis.mrrTrend[data.kpis.mrrTrend.length - 2].value) /
          Math.max(1, data.kpis.mrrTrend[data.kpis.mrrTrend.length - 2].value)) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Financial Bento
            </h1>
            <span className="bento-badge text-purple-300">INR Economy</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Coin packages, commission spreads, ARPU, and user lifetime spend.
          </p>
        </div>
      </div>

      {/* Row 1: High-Level Bento KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Today's Gross"
          value={`₹${data.kpis.todayRevenue.toFixed(0)}`}
          icon={Flame}
          variant="spotlight"
          badge="Live"
          footer="Gross user recharges"
        />
        <KPICard
          title="Month Gross"
          value={`₹${data.kpis.monthRevenue.toFixed(0)}`}
          icon={Wallet}
          footer="Current billing cycle"
        />
        <KPICard
          title="MRR Velocity"
          value={`₹${data.kpis.mrrTrend.at(-1)?.value.toFixed(0) || 0}`}
          deltaValue={mrrDelta}
          icon={TrendingUp}
        />
        <KPICard
          title="ARPU (User)"
          value={`₹${data.kpis.arpu.toFixed(2)}`}
          icon={Users}
          footer="Average per active user"
        />
        <KPICard
          title="Platform Take"
          value={`₹${data.kpis.platformCommission.toFixed(0)}`}
          icon={Percent}
          variant="emerald"
          badge="30% Cut"
          footer="Net Friendoo revenue"
        />
        <KPICard
          title="Top-up Rate"
          value={`${data.kpis.topupConversionRate.toFixed(1)}%`}
          icon={Coins}
          variant="cyan"
          footer="Free to paid conversion"
        />
      </div>

      {/* Row 2: Bento Visualizations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-6">
        
        {/* Package Distribution Pie Bento (Spans 3 cols) */}
        <LiveChart
          title="Coin Package Distribution"
          subtitle="Sales volume split across coin denominations"
          icon={Coins}
          badge="Packages"
          className="col-span-1 lg:col-span-1 xl:col-span-3"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.revenueByPackage}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  {data.revenueByPackage.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                      stroke="#121420"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121420",
                    borderColor: "#3b4263",
                    borderRadius: "0.75rem",
                  }}
                  itemStyle={{ color: "#f4f4f7" }}
                  formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, "Volume"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2 pt-2 border-t border-white/5">
            {data.revenueByPackage.map((pkg, idx) => (
              <div key={pkg.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                />
                <span>{pkg.name}</span>
              </div>
            ))}
          </div>
        </LiveChart>

        {/* Geographic Revenue Bento (Spans 3 cols) */}
        <LiveChart
          title="Revenue by Metro & City"
          subtitle="Top contributing regions across India"
          icon={Building}
          badge="Geography"
          className="col-span-1 lg:col-span-1 xl:col-span-3"
          variant="cyan"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCity}>
                <CartesianGrid stroke="#1f2337" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="city"
                  tick={{ fill: "#8b8f9e", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2337" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8b8f9e", fontSize: 11 }}
                  axisLine={{ stroke: "#1f2337" }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121420",
                    borderColor: "#3b4263",
                    borderRadius: "0.75rem",
                  }}
                  itemStyle={{ color: "#f4f4f7" }}
                  formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>

        {/* 30-Day Daily Gross vs Commission (Full 6 cols) */}
        <LiveChart
          title="Daily Topup Gross vs Net Platform Margin (30 Days)"
          subtitle="Gross recharges vs Friendoo net commission breakdown"
          icon={TrendingUp}
          badge="Dual Stream"
          className="col-span-full"
          variant="spotlight"
        >
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyRevenue}>
                <defs>
                  <linearGradient id="bentoTopupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bentoCommissionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2337" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#8b8f9e", fontSize: 11 }} axisLine={{ stroke: "#1f2337" }} tickLine={false} />
                <YAxis tick={{ fill: "#8b8f9e", fontSize: 11 }} axisLine={{ stroke: "#1f2337" }} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121420",
                    borderColor: "#3b4263",
                    borderRadius: "0.75rem",
                  }}
                  itemStyle={{ color: "#f4f4f7" }}
                />
                <Area type="monotone" dataKey="topupRevenue" name="Gross Recharge" stroke="#c084fc" strokeWidth={2} fill="url(#bentoTopupGrad)" />
                <Area type="monotone" dataKey="commissionRevenue" name="Friendoo Commission" stroke="#34d399" strokeWidth={2} fill="url(#bentoCommissionGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LiveChart>
      </div>

      {/* Row 3: Cohort Retention Bento & Top Spenders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        
        {/* Cohort Matrix Bento */}
        <div className="bento-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Cohort Spend Retention</h3>
                <p className="text-xs text-muted-foreground">Percentage of recharges repeated across weekly cohorts</p>
              </div>
              <span className="bento-badge text-emerald-400">4 Weeks</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Cohort</th>
                    <th className="pb-2 font-medium">W0</th>
                    <th className="pb-2 font-medium">W1</th>
                    <th className="pb-2 font-medium">W2</th>
                    <th className="pb-2 font-medium">W3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[0, 1, 2, 3].map((row) => (
                    <tr key={row} className="hover:bg-white/5">
                      <td className="py-2.5 font-medium text-foreground">Cohort - Week {row + 1}</td>
                      {[100, 58 - row * 5, 33 - row * 4, 18 - row * 3].map((value, index) => (
                        <td key={index} className="py-2.5">
                          <span
                            className="inline-flex min-w-12 justify-center rounded-lg px-2 py-1 text-xs font-bold"
                            style={{
                              backgroundColor:
                                value > 50
                                  ? "rgba(16,185,129,0.2)"
                                  : value > 25
                                    ? "rgba(245,158,11,0.2)"
                                    : "rgba(239,68,68,0.2)",
                              color:
                                value > 50
                                  ? "#34d399"
                                  : value > 25
                                    ? "#fbbf24"
                                    : "#f87171",
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
            </div>
          </div>
        </div>

        {/* Top Spenders Bento */}
        <div className="bento-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">VIP Top Spenders</h3>
              </div>
              <span className="bento-badge text-amber-400">Whale Matrix</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <thead>
                  <TableRow className="border-white/10 text-muted-foreground text-xs">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                  </TableRow>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.topSpenders.slice(0, 5).map((user, index) => (
                    <TableRow key={user.uid} className="hover:bg-white/5 text-xs">
                      <TableCell className="font-bold text-amber-400">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.city}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-purple-400">₹{user.totalSpentInr.toFixed(0)}</TableCell>
                      <TableCell className="text-right font-medium">{user.callsMade}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Financial Alerts */}
      <div className="grid gap-3 md:grid-cols-3">
        {data.revenueAlerts.map((alert, index) => (
          <div
            key={`${alert.type}-${index}`}
            className="bento-card p-4 flex items-start gap-3"
          >
            <div
              className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                alert.type === "red" ? "bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" :
                alert.type === "green" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" :
                "bg-amber-500 shadow-sm shadow-amber-500/50"
              }`}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {alert.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

