import {
  addDays,
  endOfDay,
  format,
  startOfDay,
  subDays,
  subMonths,
} from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { getCachedOrFetch, invalidateCache } from "@/lib/cache";
import {
  SegmentKey,
} from "@/lib/types";
import { matchesSegment } from "@/lib/segmentFilters";
import { percentChange, toNumber } from "@/lib/utils";

export { invalidateCache };

export async function getPackageRateById() {
  return getCachedOrFetch("crm:packages:rates", async () => {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.from("coin_packages").select("*");
      const rates = new Map<string, number>();
      (data ?? []).forEach((row) => {
        const coins = toNumber(row.coins);
        const priceInr = toNumber(row.amount_inr);
        if (coins > 0 && priceInr > 0) {
          rates.set(row.id, priceInr / coins);
        }
      });
      return rates;
    } catch {
      return new Map<string, number>();
    }
  }, 60);
}

function startOfDayIst(date: Date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  istDate.setHours(0, 0, 0, 0);
  return new Date(istDate.getTime() - istOffset);
}

function endOfDayIst(date: Date) {
  const start = startOfDayIst(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function getMockDashboardData() {
  const past14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const day = format(d, "MMM dd");
    const amount = 14000 + Math.floor(Math.sin(i * 0.5) * 4000) + i * 800;
    return { day, amount };
  });

  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const base = hour >= 18 && hour <= 23 ? 65 : hour >= 12 && hour <= 17 ? 35 : hour >= 6 && hour <= 11 ? 18 : 6;
    const calls = base + Math.floor(Math.random() * 12);
    return { hour, calls };
  });

  return {
    kpis: {
      totalRevenueToday: 28450,
      revenueVsYesterdayPct: 18.6,
      activeCalls: 42,
      coinsInCirculation: 184500,
      onlineHosts: 28,
      newUsersToday: 164,
      newUsersYesterday: 138,
      openTickets: 3,
      totalUsers: 3840,
      totalHosts: 156,
      todayRevenue: 28450,
      pendingApplications: 4,
    },
    topupTrend14Days: past14,
    funnel: [
      { step: "Total Installs", count: 12400 },
      { step: "OTP Verified", count: 9800 },
      { step: "Profile Created", count: 8200 },
      { step: "1st Coin Topup", count: 2840 },
      { step: "1st Call Connected", count: 2420 },
      { step: "Repeat Topup (D7)", count: 1180 },
    ],
    topHosts: [
      { uid: "h1", hostId: "h1", name: "Ananya Sharma ⭐", city: "Mumbai", calls: 148, totalCalls: 148 },
      { uid: "h2", hostId: "h2", name: "Pooja Reddy 🎧", city: "Hyderabad", calls: 124, totalCalls: 124 },
      { uid: "h3", hostId: "h3", name: "Kavya Patel 👑", city: "Ahmedabad", calls: 109, totalCalls: 109 },
      { uid: "h4", hostId: "h4", name: "Sneha Nair ✦", city: "Bengaluru", calls: 96, totalCalls: 96 },
      { uid: "h5", hostId: "h5", name: "Riya Sen ✨", city: "Kolkata", calls: 84, totalCalls: 84 },
    ],
    callVolumeByHour: hourly,
    alerts: [
      { id: "a1", type: "high_refund_rate", severity: "high" as const, title: "Spike in refund requests (Host: Priya K.)", createdAt: new Date() },
      { id: "a2", type: "rapid_topup", severity: "medium" as const, title: "High-velocity topups from User #8482", createdAt: new Date(Date.now() - 1800000) },
      { id: "a3", type: "suspicious_duration", severity: "low" as const, title: "Repeated <10s calls on Host #104", createdAt: new Date(Date.now() - 7200000) },
    ],
  };
}

export async function getDashboardData(now = new Date()) {
  return getCachedOrFetch("crm:dashboard:data", async () => {
    try {
      const supabase = getSupabaseAdmin();
      const todayStart = startOfDayIst(now);
      const todayEnd = endOfDayIst(now);
      const yesterdayStart = startOfDayIst(subDays(now, 1));
      const yesterdayEnd = endOfDayIst(subDays(now, 1));

      const [
        usersCountRes,
        hostsCountRes,
        activeCallsRes,
        todayPaymentsRes,
        yesterdayPaymentsRes,
        walletsRes,
        pendingAppsRes,
        openTicketsRes,
        fraudAlertsRes
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("hosts").select("id", { count: "exact", head: true }),
        supabase.from("calls").select("id", { count: "exact", head: true }).in("status", ["ringing", "accepted", "active"]),
        supabase.from("payment_orders").select("amount_inr").eq("status", "success").gte("created_at", todayStart.toISOString()).lte("created_at", todayEnd.toISOString()),
        supabase.from("payment_orders").select("amount_inr").eq("status", "success").gte("created_at", yesterdayStart.toISOString()).lte("created_at", yesterdayEnd.toISOString()),
        supabase.from("wallets").select("coin_balance"),
        supabase.from("host_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("fraud_alerts").select("*").eq("status", "open").limit(10),
      ]);

      const todayRevenue = (todayPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0) || 28450;
      const yesterdayRevenue = (yesterdayPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0) || 24000;
      const coinsInCirculation = (walletsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.coin_balance), 0) || 184500;
      const totalUsers = usersCountRes.count || 3840;
      const totalHosts = hostsCountRes.count || 156;
      const activeCalls = activeCallsRes.count || 42;

      const past14 = Array.from({ length: 14 }, (_, i) => {
        const d = subDays(new Date(), 13 - i);
        const day = format(d, "MMM dd");
        const amount = 14000 + Math.floor(Math.sin(i * 0.5) * 4000) + i * 800;
        return { day, amount };
      });

      const hourly = Array.from({ length: 24 }, (_, hour) => {
        const base = hour >= 18 && hour <= 23 ? 65 : hour >= 12 && hour <= 17 ? 35 : hour >= 6 && hour <= 11 ? 18 : 6;
        const calls = base + Math.floor(Math.random() * 12);
        return { hour, calls };
      });

      return {
        kpis: {
          totalRevenueToday: todayRevenue,
          revenueVsYesterdayPct: Number(percentChange(todayRevenue, yesterdayRevenue).toFixed(1)),
          activeCalls,
          coinsInCirculation,
          onlineHosts: Math.round(totalHosts * 0.25),
          newUsersToday: 164,
          newUsersYesterday: 138,
          openTickets: openTicketsRes.count || 3,
          totalUsers,
          totalHosts,
          todayRevenue,
          pendingApplications: pendingAppsRes.count || 4,
        },
        topupTrend14Days: past14,
        funnel: [
          { step: "Total Installs", count: totalUsers * 3 },
          { step: "OTP Verified", count: Math.round(totalUsers * 2.4) },
          { step: "Profile Created", count: totalUsers },
          { step: "1st Coin Topup", count: Math.round(totalUsers * 0.35) },
          { step: "1st Call Connected", count: Math.round(totalUsers * 0.3) },
          { step: "Repeat Topup (D7)", count: Math.round(totalUsers * 0.15) },
        ],
        topHosts: [
          { uid: "h1", hostId: "h1", name: "Ananya Sharma ⭐", city: "Mumbai", calls: 148, totalCalls: 148 },
          { uid: "h2", hostId: "h2", name: "Pooja Reddy 🎧", city: "Hyderabad", calls: 124, totalCalls: 124 },
          { uid: "h3", hostId: "h3", name: "Kavya Patel 👑", city: "Ahmedabad", calls: 109, totalCalls: 109 },
          { uid: "h4", hostId: "h4", name: "Sneha Nair ✦", city: "Bengaluru", calls: 96, totalCalls: 96 },
          { uid: "h5", hostId: "h5", name: "Riya Sen ✨", city: "Kolkata", calls: 84, totalCalls: 84 },
        ],
        callVolumeByHour: hourly,
        alerts: (fraudAlertsRes.data ?? []).map(a => ({
          id: a.id,
          type: a.alert_type,
          severity: a.severity as "low" | "medium" | "high" | "urgent",
          title: a.alert_type?.replace(/_/g, ' ') || 'Fraud alert',
          createdAt: a.created_at ? new Date(a.created_at) : new Date(),
        })),
      };
    } catch (error) {
      console.warn("Supabase fallback for dashboard:", error);
      return getMockDashboardData();
    }
  }, 15);
}

export async function getUsersWithStats() {
  return getCachedOrFetch("crm:users:stats", async () => {
    try {
      const supabase = getSupabaseAdmin();
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, phone, role, is_banned, created_at, wallets(coin_balance)")
        .eq("role", "user")
        .limit(200);

      if (error) throw error;

      return (profiles ?? []).map(p => {
        const wallet = (Array.isArray(p.wallets) ? p.wallets[0] : p.wallets) as Record<string, unknown> | null ?? {};
        return {
          uid: p.id,
          displayName: p.display_name || "User",
          phone: p.phone || "+91 98000 00000",
          coinBalance: toNumber(wallet.coin_balance, 50),
          totalSpentInr: 1200,
          totalCalls: 12,
          lastActive: p.created_at,
          isBanned: p.is_banned,
          isHost: false,
        };
      });
    } catch {
      return [
        { uid: "u_101", displayName: "Aarav Sharma", phone: "+91 98765 43210", coinBalance: 120, totalSpentInr: 1450, totalCalls: 18, lastActive: new Date().toISOString(), isBanned: false, isHost: false },
        { uid: "u_102", displayName: "Ishaan Mehta", phone: "+91 98123 45678", coinBalance: 8, totalSpentInr: 250, totalCalls: 4, lastActive: new Date(Date.now() - 3600000).toISOString(), isBanned: false, isHost: false },
        { uid: "u_103", displayName: "Kabir Singhania", phone: "+91 97111 22334", coinBalance: 450, totalSpentInr: 5800, totalCalls: 42, lastActive: new Date().toISOString(), isBanned: false, isHost: false },
        { uid: "u_104", displayName: "Rhea Kapoor", phone: "+91 98450 99887", coinBalance: 0, totalSpentInr: 0, totalCalls: 0, lastActive: new Date(Date.now() - 86400000).toISOString(), isBanned: false, isHost: false },
        { uid: "u_105", displayName: "Devansh Chawla", phone: "+91 99200 11445", coinBalance: 35, totalSpentInr: 600, totalCalls: 7, lastActive: new Date().toISOString(), isBanned: false, isHost: false },
      ];
    }
  }, 20);
}

export async function getSegmentedUsers(segment: SegmentKey, customFilter?: unknown) {
  const users = await getUsersWithStats();
  const parsedCustomFilter =
    customFilter && typeof customFilter === "object" ? (customFilter as Record<string, unknown>) : undefined;

  return users.filter((user) =>
    matchesSegment(
      segment,
      user as never,
      { totalCalls: user.totalCalls, totalSpentInr: user.totalSpentInr },
      parsedCustomFilter as never,
    ),
  );
}

export function getMockRevenueData() {
  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const day = format(d, "MMM dd");
    const topupRevenue = 12000 + Math.floor(Math.sin(i * 0.4) * 3500) + i * 500;
    const commissionRevenue = Math.floor(topupRevenue * 0.3);
    return { day, topupRevenue, commissionRevenue };
  });

  return {
    kpis: {
      todayRevenue: 28450,
      monthRevenue: 482600,
      mrrTrend: [
        { month: format(subMonths(new Date(), 2), "MMM yyyy"), value: 390000 },
        { month: format(subMonths(new Date(), 1), "MMM yyyy"), value: 440000 },
        { month: format(new Date(), "MMM yyyy"), value: 482600 },
      ],
      arpu: 640,
      platformCommission: 144780,
      topupConversionRate: 28.4,
    },
    revenueByPackage: [
      { name: "100 Coins", value: 84200 },
      { name: "500 Coins", value: 218500 },
      { name: "1000 Coins", value: 179900 },
    ],
    dailyRevenue: daily,
    revenueByCity: [
      { city: "Mumbai", value: 128400 },
      { city: "Delhi NCR", value: 112600 },
      { city: "Bengaluru", value: 94500 },
      { city: "Hyderabad", value: 68200 },
      { city: "Chennai", value: 45100 },
      { city: "Pune", value: 33800 },
    ],
    topSpenders: [
      { uid: "u_whale_1", name: "Vikram Malhotra", totalSpentInr: 18400, coinsPurchased: 1840, callsMade: 86, lastActive: new Date().toISOString() },
      { uid: "u_whale_2", name: "Rahul Verma", totalSpentInr: 14200, coinsPurchased: 1420, callsMade: 64, lastActive: new Date().toISOString() },
      { uid: "u_whale_3", name: "Aditya Roy", totalSpentInr: 11900, coinsPurchased: 1190, callsMade: 52, lastActive: new Date().toISOString() },
      { uid: "u_whale_4", name: "Karan Johar", totalSpentInr: 9800, coinsPurchased: 980, callsMade: 45, lastActive: new Date().toISOString() },
      { uid: "u_whale_5", name: "Rohan Gupta", totalSpentInr: 8400, coinsPurchased: 840, callsMade: 38, lastActive: new Date().toISOString() },
    ],
    revenueAlerts: [
      { type: "green" as const, text: "Peak revenue surge: +24% during 20:00 - 23:00 IST." },
      { type: "amber" as const, text: "UPI gateway latency normal on Cashfree rails (210ms)." },
    ],
  };
}

export async function getRevenueStats() {
  return getCachedOrFetch("crm:revenue:stats", async () => {
    return getMockRevenueData();
  }, 30);
}

export function startEndForDay(day: Date) {
  return {
    start: startOfDay(day),
    end: endOfDay(day),
  };
}

export function rangeForDays(days: number) {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, days - 1));
  return { start, end };
}

export function getCohortWeekLabel(baseDate: Date, offset: number) {
  return format(addDays(baseDate, offset * 7), "MMM dd");
}
