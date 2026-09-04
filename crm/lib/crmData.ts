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
import { SegmentKey } from "@/lib/types";
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
    return { day: format(d, "MMM dd"), amount: 0 };
  });

  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 }));

  return {
    kpis: {
      totalRevenueToday: 0,
      revenueVsYesterdayPct: 0,
      activeCalls: 0,
      coinsInCirculation: 0,
      onlineHosts: 0,
      newUsersToday: 0,
      newUsersYesterday: 0,
      openTickets: 0,
      totalUsers: 0,
      totalHosts: 0,
      todayRevenue: 0,
      pendingApplications: 0,
    },
    topupTrend14Days: past14,
    funnel: [
      { step: "Total Users", count: 0 },
      { step: "Phone Verified", count: 0 },
      { step: "Coin Recharge", count: 0 },
      { step: "Calls Connected", count: 0 },
    ],
    topHosts: [],
    callVolumeByHour: hourly,
    alerts: [],
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
      const fourteenDaysAgo = subDays(now, 13);

      const [
        usersCountRes,
        hostsCountRes,
        activeCallsRes,
        todayPaymentsRes,
        yesterdayPaymentsRes,
        walletsRes,
        pendingAppsRes,
        openTicketsRes,
        fraudAlertsRes,
        past14PaymentsRes,
        todayCallsRes,
        onlineHostsRes,
        newUsersTodayRes,
        newUsersYesterdayRes,
        phoneUsersRes,
        hostsWithProfilesRes,
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
        supabase.from("payment_orders").select("amount_inr, created_at").eq("status", "success").gte("created_at", fourteenDaysAgo.toISOString()),
        supabase.from("calls").select("id, host_id, created_at").gte("created_at", todayStart.toISOString()),
        supabase.from("hosts").select("id", { count: "exact", head: true }).eq("is_available", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lte("created_at", yesterdayEnd.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).not("phone", "is", null),
        supabase.from("hosts").select("id, bio, rate_per_audio_minute, is_available, profiles (id, display_name, phone)").limit(10),
      ]);

      const todayRevenue = (todayPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0);
      const yesterdayRevenue = (yesterdayPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0);
      const coinsInCirculation = (walletsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.coin_balance), 0);
      const totalUsers = usersCountRes.count ?? 0;
      const totalHosts = hostsCountRes.count ?? 0;
      const activeCalls = activeCallsRes.count ?? 0;
      const onlineHosts = onlineHostsRes.count ?? 0;
      const newUsersToday = newUsersTodayRes.count ?? 0;
      const newUsersYesterday = newUsersYesterdayRes.count ?? 0;
      const phoneUsers = phoneUsersRes.count ?? 0;

      // 14 days real revenue trend
      const dayMap = new Map<string, number>();
      (past14PaymentsRes.data ?? []).forEach((row) => {
        if (!row.created_at) return;
        const key = format(new Date(row.created_at), "MMM dd");
        dayMap.set(key, (dayMap.get(key) ?? 0) + toNumber(row.amount_inr));
      });

      const topupTrend14Days = Array.from({ length: 14 }, (_, i) => {
        const d = subDays(new Date(), 13 - i);
        const day = format(d, "MMM dd");
        return { day, amount: dayMap.get(day) ?? 0 };
      });

      // 24 hours real call volume
      const hourMap = new Map<number, number>();
      (todayCallsRes.data ?? []).forEach((c) => {
        if (!c.created_at) return;
        const hour = new Date(c.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
      });

      const callVolumeByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        calls: hourMap.get(hour) ?? 0,
      }));

      // Top hosts with real data
      const hostCallCounts = new Map<string, number>();
      (todayCallsRes.data ?? []).forEach((c) => {
        if (c.host_id) {
          hostCallCounts.set(c.host_id, (hostCallCounts.get(c.host_id) ?? 0) + 1);
        }
      });

      const topHosts = (hostsWithProfilesRes.data ?? []).map((h) => {
        const p = (Array.isArray(h.profiles) ? h.profiles[0] : h.profiles) as Record<string, unknown> | null ?? {};
        const calls = hostCallCounts.get(h.id) ?? 0;
        return {
          uid: h.id,
          hostId: h.id,
          name: String(p.display_name || `Host ${h.id.slice(0, 6)}`),
          city: "—",
          calls,
          totalCalls: calls,
        };
      }).sort((a, b) => b.totalCalls - a.totalCalls).slice(0, 5);

      return {
        kpis: {
          totalRevenueToday: todayRevenue,
          revenueVsYesterdayPct: yesterdayRevenue > 0 ? Number(percentChange(todayRevenue, yesterdayRevenue).toFixed(1)) : 0,
          activeCalls,
          coinsInCirculation,
          onlineHosts,
          newUsersToday,
          newUsersYesterday,
          openTickets: openTicketsRes.count ?? 0,
          totalUsers,
          totalHosts,
          todayRevenue,
          pendingApplications: pendingAppsRes.count ?? 0,
        },
        topupTrend14Days,
        funnel: [
          { step: "Total Users", count: totalUsers },
          { step: "Phone Verified", count: phoneUsers },
          { step: "Active Wallets", count: (walletsRes.data ?? []).filter((w) => toNumber(w.coin_balance) > 0).length },
          { step: "Calls Today", count: (todayCallsRes.data ?? []).length },
        ],
        topHosts,
        callVolumeByHour,
        alerts: (fraudAlertsRes.data ?? []).map((a) => ({
          id: a.id,
          type: a.alert_type,
          severity: a.severity as "low" | "medium" | "high" | "urgent",
          title: a.alert_type?.replace(/_/g, " ") || "Fraud alert",
          createdAt: a.created_at ? new Date(a.created_at) : new Date(),
        })),
      };
    } catch (error) {
      console.warn("Supabase dashboard error:", error);
      return getMockDashboardData();
    }
  }, 15);
}

export async function getUsersWithStats() {
  return getCachedOrFetch("crm:users:stats", async () => {
    try {
      const supabase = getSupabaseAdmin();
      const [profilesRes, paymentsRes, callsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, phone, role, is_banned, created_at, wallets(coin_balance)")
          .eq("role", "user")
          .limit(200),
        supabase.from("payment_orders").select("user_id, amount_inr").eq("status", "success"),
        supabase.from("calls").select("caller_id"),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const spentByUser = new Map<string, number>();
      (paymentsRes.data ?? []).forEach((p) => {
        if (p.user_id) {
          spentByUser.set(p.user_id, (spentByUser.get(p.user_id) ?? 0) + toNumber(p.amount_inr));
        }
      });

      const callsByUser = new Map<string, number>();
      (callsRes.data ?? []).forEach((c) => {
        if (c.caller_id) {
          callsByUser.set(c.caller_id, (callsByUser.get(c.caller_id) ?? 0) + 1);
        }
      });

      return (profilesRes.data ?? []).map((p) => {
        const wallet = (Array.isArray(p.wallets) ? p.wallets[0] : p.wallets) as Record<string, unknown> | null ?? {};
        return {
          uid: p.id,
          displayName: p.display_name || "User",
          phone: p.phone || "—",
          coinBalance: toNumber(wallet.coin_balance, 0),
          totalSpentInr: spentByUser.get(p.id) ?? 0,
          totalCalls: callsByUser.get(p.id) ?? 0,
          lastActive: p.created_at,
          isBanned: p.is_banned,
          isHost: false,
        };
      });
    } catch (error) {
      console.warn("getUsersWithStats error:", error);
      return [];
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
  return {
    kpis: {
      todayRevenue: 0,
      monthRevenue: 0,
      mrrTrend: [],
      arpu: 0,
      platformCommission: 0,
      topupConversionRate: 0,
    },
    revenueByPackage: [],
    dailyRevenue: Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      return { day: format(d, "MMM dd"), topupRevenue: 0, commissionRevenue: 0 };
    }),
    revenueByCity: [],
    topSpenders: [],
    revenueAlerts: [],
  };
}

export async function getRevenueStats() {
  return getCachedOrFetch("crm:revenue:stats", async () => {
    try {
      const supabase = getSupabaseAdmin();
      const now = new Date();
      const todayStart = startOfDayIst(now);
      const todayEnd = endOfDayIst(now);
      const thirtyDaysAgo = subDays(now, 29);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        todayPaymentsRes,
        monthPaymentsRes,
        allPaymentsRes,
        callsRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from("payment_orders").select("amount_inr").eq("status", "success").gte("created_at", todayStart.toISOString()).lte("created_at", todayEnd.toISOString()),
        supabase.from("payment_orders").select("amount_inr").eq("status", "success").gte("created_at", thisMonthStart.toISOString()),
        supabase.from("payment_orders").select("id, user_id, amount_inr, coins, package_id, created_at").eq("status", "success").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at", { ascending: true }),
        supabase.from("calls").select("caller_id, host_id, total_coins_deducted").limit(1000),
        supabase.from("profiles").select("id, display_name, phone, city").limit(1000),
      ]);

      const todayRevenue = (todayPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0);
      const monthRevenue = (monthPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0);

      // 30 days daily trend
      const dailyMap = new Map<string, number>();
      (allPaymentsRes.data ?? []).forEach((p) => {
        if (!p.created_at) return;
        const dayKey = format(new Date(p.created_at), "MMM dd");
        dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + toNumber(p.amount_inr));
      });

      const daily = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(now, 29 - i);
        const day = format(d, "MMM dd");
        const topupRevenue = dailyMap.get(day) ?? 0;
        const commissionRevenue = Math.round(topupRevenue * 0.3);
        return { day, topupRevenue, commissionRevenue };
      });

      // Package breakdown
      const packageMap = new Map<string, number>();
      (allPaymentsRes.data ?? []).forEach((p) => {
        const pkgName = p.package_id || `${p.coins || p.amount_inr || "Custom"} Coins`;
        packageMap.set(pkgName, (packageMap.get(pkgName) ?? 0) + toNumber(p.amount_inr));
      });
      const revenueByPackage = Array.from(packageMap.entries()).map(([name, value]) => ({ name, value }));

      // Profile map
      const profileMap = new Map<string, { name: string; city: string }>();
      (profilesRes.data ?? []).forEach((p) => {
        profileMap.set(p.id, { name: p.display_name || "User", city: p.city || "Unknown" });
      });

      // City breakdown
      const cityMap = new Map<string, number>();
      (allPaymentsRes.data ?? []).forEach((p) => {
        const city = (p.user_id ? profileMap.get(p.user_id)?.city : null) || "Other";
        cityMap.set(city, (cityMap.get(city) ?? 0) + toNumber(p.amount_inr));
      });
      const revenueByCity = Array.from(cityMap.entries()).map(([city, value]) => ({ city, value }));

      // Top Spenders
      const spenderMap = new Map<string, { totalSpentInr: number; coinsPurchased: number }>();
      (allPaymentsRes.data ?? []).forEach((p) => {
        if (!p.user_id) return;
        const cur = spenderMap.get(p.user_id) ?? { totalSpentInr: 0, coinsPurchased: 0 };
        cur.totalSpentInr += toNumber(p.amount_inr);
        cur.coinsPurchased += toNumber(p.coins);
        spenderMap.set(p.user_id, cur);
      });

      const callCountByUser = new Map<string, number>();
      (callsRes.data ?? []).forEach((c) => {
        if (c.caller_id) {
          callCountByUser.set(c.caller_id, (callCountByUser.get(c.caller_id) ?? 0) + 1);
        }
      });

      const topSpenders = Array.from(spenderMap.entries())
        .sort((a, b) => b[1].totalSpentInr - a[1].totalSpentInr)
        .slice(0, 5)
        .map(([uid, stats]) => {
          const prof = profileMap.get(uid);
          return {
            uid,
            name: prof?.name || `User ${uid.slice(0, 6)}`,
            city: prof?.city || "—",
            totalSpentInr: stats.totalSpentInr,
            coinsPurchased: stats.coinsPurchased,
            callsMade: callCountByUser.get(uid) ?? 0,
          };
        });

      const totalPayingUsers = spenderMap.size;
      const totalAllRevenue = (allPaymentsRes.data ?? []).reduce((acc, r) => acc + toNumber(r.amount_inr), 0);
      const arpu = totalPayingUsers > 0 ? Math.round(totalAllRevenue / totalPayingUsers) : 0;
      const platformCommission = Math.round(monthRevenue * 0.3);

      return {
        kpis: {
          todayRevenue,
          monthRevenue,
          mrrTrend: [
            { month: format(subMonths(now, 2), "MMM yyyy"), value: 0 },
            { month: format(subMonths(now, 1), "MMM yyyy"), value: 0 },
            { month: format(now, "MMM yyyy"), value: monthRevenue },
          ],
          arpu,
          platformCommission,
          topupConversionRate: totalPayingUsers > 0 ? Math.round((totalPayingUsers / Math.max(1, profilesRes.data?.length ?? 1)) * 100) : 0,
        },
        revenueByPackage,
        dailyRevenue: daily,
        revenueByCity,
        topSpenders,
        revenueAlerts: [],
      };
    } catch (error) {
      console.warn("getRevenueStats error:", error);
      return getMockRevenueData();
    }
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
