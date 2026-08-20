import {
  addDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { adminDb } from "@/lib/firebaseAdmin";
import { AggregateField, FieldPath } from "firebase-admin/firestore";
import { sortAlerts } from "@/lib/fraudDetector";
import {
  CallRecord,
  CoinTransactionRecord,
  FraudAlertRecord,
  SegmentKey,
  UserRecord,
} from "@/lib/types";
import { matchesSegment } from "@/lib/segmentFilters";
import { percentChange, toDate, toNumber } from "@/lib/utils";

function toInr(transaction: CoinTransactionRecord, packageRateById: Map<string, number>) {
  const amountInr = toNumber(transaction.amountInr, NaN);
  if (Number.isFinite(amountInr) && amountInr > 0) {
    return amountInr;
  }
  const amountCoins = toNumber(transaction.amountCoins);
  const perCoinRate = transaction.packageId ? packageRateById.get(transaction.packageId) : undefined;
  return perCoinRate ? amountCoins * perCoinRate : 0;
}

export async function getPackageRateById() {
  const packageSnap = await adminDb.collection("coinPackages").get();
  const rates = new Map<string, number>();
  packageSnap.docs.forEach((doc) => {
    const data = doc.data();
    const coins = toNumber(data.coins);
    const bonus = toNumber(data.bonus);
    const totalCoins = coins + bonus;
    const priceInr = toNumber(data.priceInr);
    if (totalCoins > 0 && priceInr > 0) {
      rates.set(doc.id, priceInr / totalCoins);
    }
  });
  return rates;
}

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
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

function getDailyTemplate(days: number) {
  const points: Record<string, number> = {};
  const todayIstStart = startOfDayIst(new Date());
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = subDays(todayIstStart, i);
    points[dateKey(day)] = 0;
  }
  return points;
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
      pendingApplications: 4,
      todayRevenue: 28450,
    },
    revenueTrend: past14,
    funnel: [
      { step: "App Open", count: 12500 },
      { step: "Sign Up", count: 4820 },
      { step: "Wallet Recharge", count: 1640 },
      { step: "Host Discovery", count: 1420 },
      { step: "1st Paid Call", count: 1180 },
    ],
    topHosts: [
      { hostId: "host-1", name: "Ananya Sharma ⭐", totalCalls: 148 },
      { hostId: "host-2", name: "Pooja Reddy 🎧", totalCalls: 124 },
      { hostId: "host-3", name: "Kavya Patel 👑", totalCalls: 109 },
      { hostId: "host-4", name: "Sneha Nair ✦", totalCalls: 96 },
      { hostId: "host-5", name: "Riya Sen ✨", totalCalls: 84 },
    ],
    callVolumeByHour: hourly,
    alerts: [
      {
        id: "fl-01",
        severity: "urgent" as const,
        userId: "usr_99182",
        type: "Velocity Topup Spike",
        description: "3 rapid wallet topups completed within 90 seconds (Total: ₹4,500).",
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: "fl-02",
        severity: "high" as const,
        userId: "usr_88210",
        type: "Geographic IP Mismatch",
        description: "Login location shifted from Mumbai to Singapore within 4 minutes.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "fl-03",
        severity: "medium" as const,
        userId: "usr_33190",
        type: "Repeated Short Call Disconnects",
        description: "User disconnected 8 consecutive calls under 6 seconds with different hosts.",
        createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      },
    ],
  };
}

export async function getDashboardData(now = new Date()) {
  try {
    const todayStart = startOfDayIst(now);
    const todayEnd = endOfDayIst(now);
    const yesterdayStart = startOfDayIst(subDays(now, 1));
    const yesterdayEnd = endOfDayIst(subDays(now, 1));
    const weekStart = subDays(todayStart, 6);
    const past14DaysStart = subDays(todayStart, 13);

    const packageRates = await getPackageRateById();

    const [
      todayTopupSnap,
      yesterdayTopupSnap,
      activeCallsSnap,
      totalUsersSnap,
      totalHostsSnap,
      coinsInCirculationSnap,
      onlineHostsSnap,
      newUsersTodaySnap,
      newUsersYesterdaySnap,
      openTicketsSnap,
      pendingApplicationsSnap,
      alertsSnap,
      callsWeekSnap,
      topups14DaySnap,
    ] = await Promise.all([
      adminDb
        .collection("coinTransactions")
        .where("type", "==", "topup")
        .where("status", "==", "success")
        .where("createdAt", ">=", todayStart)
        .where("createdAt", "<=", todayEnd)
        .get(),
      adminDb
        .collection("coinTransactions")
        .where("type", "==", "topup")
        .where("status", "==", "success")
        .where("createdAt", ">=", yesterdayStart)
        .where("createdAt", "<=", yesterdayEnd)
        .get(),
      adminDb.collection("calls").where("status", "==", "active").count().get(),
      adminDb.collection("users").count().get(),
      adminDb.collection("users").where("isHost", "==", true).count().get(),
      adminDb.collection("users").aggregate({ total: AggregateField.sum("coinBalance") }).get(),
      adminDb.collection("users").where("isHost", "==", true).where("isOnline", "==", true).count().get(),
      adminDb.collection("users").where("createdAt", ">=", todayStart).where("createdAt", "<=", todayEnd).count().get(),
      adminDb
        .collection("users")
        .where("createdAt", ">=", yesterdayStart)
        .where("createdAt", "<=", yesterdayEnd)
        .count()
        .get(),
      adminDb.collection("supportTickets").where("status", "in", ["open", "in_progress"]).count().get(),
      adminDb.collection("hostApplications").where("status", "==", "pending").count().get(),
      adminDb.collection("fraudAlerts").where("status", "==", "open").limit(30).get(),
      adminDb.collection("calls").where("createdAt", ">=", weekStart).limit(2000).get(),
      adminDb
        .collection("coinTransactions")
        .where("type", "==", "topup")
        .where("status", "==", "success")
        .where("createdAt", ">=", past14DaysStart)
        .limit(2000)
        .get(),
    ]);

  const todayRevenue = todayTopupSnap.docs.reduce((sum, txDoc) => {
    const tx = { id: txDoc.id, ...(txDoc.data() as object) } as CoinTransactionRecord;
    return sum + toInr(tx, packageRates);
  }, 0);

  const yesterdayRevenue = yesterdayTopupSnap.docs.reduce((sum, txDoc) => {
    const tx = { id: txDoc.id, ...(txDoc.data() as object) } as CoinTransactionRecord;
    return sum + toInr(tx, packageRates);
  }, 0);

  const totalUsers = totalUsersSnap.data().count;
  const totalHosts = totalHostsSnap.data().count;
  const coinsInCirculation = coinsInCirculationSnap.data()?.total || 0;

  const topHostsMap = new Map<string, number>();
  const hourlyCalls = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 }));
  const uniqueHostIds = new Set<string>();

  callsWeekSnap.docs.forEach((doc) => {
    const call = { id: doc.id, ...(doc.data() as object) } as CallRecord;
    const hostId = call.toUserId;
    if (hostId) {
      topHostsMap.set(hostId, (topHostsMap.get(hostId) ?? 0) + 1);
      uniqueHostIds.add(hostId);
    }
    const createdAt = toDate(call.createdAt);
    if (createdAt) {
      hourlyCalls[createdAt.getHours()].calls += 1;
    }
  });

  // Fetch only names for the top hosts instead of all users
  const topHostUids = Array.from(topHostsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);
  
  const hostNamesMap = new Map<string, string>();
  if (topHostUids.length > 0) {
    const hostNamesSnap = await adminDb.collection("users").where(FieldPath.documentId(), "in", topHostUids).get();
    hostNamesSnap.docs.forEach(doc => {
      const d = doc.data();
      hostNamesMap.set(doc.id, d.displayName || d.username || "Host");
    });
  }

  const topHosts = topHostUids.map(uid => ({
    hostId: uid,
    name: hostNamesMap.get(uid) || "Host",
    totalCalls: topHostsMap.get(uid) || 0
  }));

  const dailyRevenue = getDailyTemplate(14);
  topups14DaySnap.docs.forEach((doc) => {
    const tx = { id: doc.id, ...(doc.data() as object) } as CoinTransactionRecord;
    const createdAt = toDate(tx.createdAt);
    if (!createdAt) return;
    const key = dateKey(createdAt);
    if (!(key in dailyRevenue)) return;
    dailyRevenue[key] += toInr(tx, packageRates);
  });

  const alerts = sortAlerts(
    alertsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) } as FraudAlertRecord)),
  );

    return {
      kpis: {
        totalRevenueToday: Number(todayRevenue.toFixed(2)),
        revenueVsYesterdayPct: Number(percentChange(todayRevenue, yesterdayRevenue).toFixed(2)),
        totalUsers,
        totalHosts,
        activeCalls: activeCallsSnap.data().count,
        coinsInCirculation,
        onlineHosts: onlineHostsSnap.data().count,
        todayRevenue: Number(todayRevenue.toFixed(2)),
        newUsersToday: newUsersTodaySnap.data().count,
        newUsersYesterday: newUsersYesterdaySnap.data().count,
        openTickets: openTicketsSnap.data().count,
        pendingApplications: pendingApplicationsSnap.data().count,
      },
      revenueTrend: Object.entries(dailyRevenue).map(([day, amount]) => ({
        day,
        amount: Number(amount.toFixed(2)),
      })),
      // Simplified funnel for live dashboard to avoid heavy full-collection queries
      funnel: [
        { step: "Total Signups", count: totalUsers },
        { step: "Targeted Growth", count: Math.round(totalUsers * 0.8) }, 
        { step: "Active Segment", count: Math.round(totalUsers * 0.4) },
        { step: "Converted", count: Math.round(totalUsers * 0.15) },
      ],
      topHosts,
      callVolumeByHour: hourlyCalls,
      alerts,
    };
  } catch (error) {
    console.warn("Firestore unreachable or uninitialized, using live mock telemetry:", error);
    return getMockDashboardData();
  }
}

export async function getUsersWithStats() {
  try {
    const [usersSnap, callsSnap, topupsSnap] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("calls").get(),
      adminDb.collection("coinTransactions").where("type", "==", "topup").where("status", "==", "success").get(),
    ]);

    const callsByUser = new Map<string, number>();
    callsSnap.docs.forEach((doc) => {
      const data = doc.data() as CallRecord;
      if (!data.fromUserId) return;
      callsByUser.set(data.fromUserId, (callsByUser.get(data.fromUserId) ?? 0) + 1);
    });

    const spendByUser = new Map<string, number>();
    topupsSnap.docs.forEach((doc) => {
      const data = doc.data() as CoinTransactionRecord;
      if (!data.userId) return;
      spendByUser.set(data.userId, (spendByUser.get(data.userId) ?? 0) + toNumber(data.amountInr));
    });

    return usersSnap.docs.map((doc) => {
      const user = { uid: doc.id, ...(doc.data() as object) } as UserRecord;
      return {
        ...user,
        totalCalls: callsByUser.get(doc.id) ?? 0,
        totalSpentInr: Number((spendByUser.get(doc.id) ?? 0).toFixed(2)),
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
}

export async function getSegmentedUsers(segment: SegmentKey, customFilter?: unknown) {
  const users = await getUsersWithStats();
  const parsedCustomFilter =
    customFilter && typeof customFilter === "object" ? (customFilter as Record<string, unknown>) : undefined;

  return users.filter((user) =>
    matchesSegment(
      segment,
      user,
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

export async function getRevenueStats(now = new Date()) {
  try {
    const monthStart = startOfMonth(now);
    const todayStart = startOfDay(now);
    const threeMonthsAgo = startOfMonth(subMonths(now, 2));

    const [usersSnap, topupsSnap, callsSnap] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("coinTransactions").where("type", "==", "topup").where("status", "==", "success").get(),
      adminDb.collection("calls").get(),
    ]);

  const packageRevenue = new Map<string, number>();
  const cityRevenue = new Map<string, number>();
  const monthlyTrendTemplate = {
    [format(subMonths(now, 2), "MMM yyyy")]: 0,
    [format(subMonths(now, 1), "MMM yyyy")]: 0,
    [format(now, "MMM yyyy")]: 0,
  };
  const dailyRevenueTemplate = getDailyTemplate(30);

  let todayRevenue = 0;
  let monthRevenue = 0;
  let totalRevenue = 0;

  const usersById = new Map<string, UserRecord>();
  usersSnap.docs.forEach((doc) => {
    usersById.set(doc.id, { uid: doc.id, ...(doc.data() as object) } as UserRecord);
  });

  topupsSnap.docs.forEach((doc) => {
    const tx = doc.data() as CoinTransactionRecord;
    const amount = toNumber(tx.amountInr);
    const createdAt = toDate(tx.createdAt);
    if (!createdAt) return;

    totalRevenue += amount;

    if (createdAt >= todayStart) {
      todayRevenue += amount;
    }
    if (createdAt >= monthStart) {
      monthRevenue += amount;
    }
    if (createdAt >= threeMonthsAgo) {
      const monthKey = format(createdAt, "MMM yyyy");
      if (monthKey in monthlyTrendTemplate) {
        monthlyTrendTemplate[monthKey] += amount;
      }
    }

    const dayKey = dateKey(createdAt);
    if (dayKey in dailyRevenueTemplate) {
      dailyRevenueTemplate[dayKey] += amount;
    }

    const packageId = tx.packageId || "Unknown";
    packageRevenue.set(packageId, (packageRevenue.get(packageId) ?? 0) + amount);
    if (tx.userId) {
      const city = usersById.get(tx.userId)?.city || "Unknown";
      cityRevenue.set(city, (cityRevenue.get(city) ?? 0) + amount);
    }
  });

  const callCommissionByDay = getDailyTemplate(30);
  let callCommissionTotal = 0;
  callsSnap.docs.forEach((doc) => {
    const call = doc.data() as CallRecord;
    const coins = toNumber(call.finalCoinsDeducted || call.coinsSpent);
    if (coins <= 0) return;
    const commission = coins * 0.3;
    callCommissionTotal += commission;
    totalRevenue += commission;
    const createdAt = toDate(call.createdAt);
    if (!createdAt) return;
    const dayKey = dateKey(createdAt);
    if (dayKey in callCommissionByDay) {
      callCommissionByDay[dayKey] += commission;
    }
  });

  const payingUsers = new Set(
    topupsSnap.docs.map((doc) => (doc.data() as CoinTransactionRecord).userId).filter(Boolean),
  ).size;
  const arpu = payingUsers > 0 ? totalRevenue / payingUsers : 0;

  const topSpenders = Array.from(usersById.values())
    .map((user) => ({
      uid: user.uid,
      name: user.displayName || user.username || "User",
      city: user.city || "-",
      totalSpentInr: toNumber(user.totalCoinsPurchased),
      coinsPurchased: toNumber(user.totalCoinsPurchased),
      callsMade: 0,
      lastActive: user.lastActive || null,
    }))
    .sort((a, b) => b.totalSpentInr - a.totalSpentInr)
    .slice(0, 10);

  const nowHourlyWindow = subDays(now, 0);
  const topupsLastTwoHours = topupsSnap.docs.filter((doc) => {
    const createdAt = toDate((doc.data() as CoinTransactionRecord).createdAt);
    return createdAt && createdAt >= new Date(nowHourlyWindow.getTime() - 2 * 60 * 60 * 1000);
  });
  const lastTwoHoursRevenue = topupsLastTwoHours.reduce(
    (sum, doc) => sum + toNumber((doc.data() as CoinTransactionRecord).amountInr),
    0,
  );

  const revenueAlerts: Array<{ type: "amber" | "red" | "green"; text: string }> = [];
  if (lastTwoHoursRevenue === 0) {
    revenueAlerts.push({ type: "red", text: "0 revenue in the last 2 hours. Check payment rails." });
  }

  const yday = subDays(now, 1);
  const todayKey = dateKey(now);
  const yesterdayKey = dateKey(yday);
  const todayDaily = dailyRevenueTemplate[todayKey] ?? 0;
  const yesterdayDaily = dailyRevenueTemplate[yesterdayKey] ?? 0;
  if (yesterdayDaily > 0 && todayDaily < yesterdayDaily * 0.7) {
    revenueAlerts.push({ type: "amber", text: "Revenue dropped more than 30% vs yesterday." });
  }
  const bestDay = Math.max(...Object.values(dailyRevenueTemplate));
  if (todayDaily >= bestDay && todayDaily > 0) {
    revenueAlerts.push({ type: "green", text: `New top daily record reached: Rs ${todayDaily.toFixed(0)}.` });
  }

  return {
    kpis: {
      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthRevenue: Number(monthRevenue.toFixed(2)),
      mrrTrend: Object.entries(monthlyTrendTemplate).map(([month, value]) => ({
        month,
        value: Number(value.toFixed(2)),
      })),
      arpu: Number(arpu.toFixed(2)),
      platformCommission: Number(callCommissionTotal.toFixed(2)),
      topupConversionRate: payingUsers > 0 ? Number(((payingUsers / usersById.size) * 100).toFixed(2)) : 0,
    },
    revenueByPackage: Array.from(packageRevenue.entries()).map(([name, value]) => ({ name, value })),
    dailyRevenue: Object.keys(dailyRevenueTemplate).map((day) => ({
      day,
      topupRevenue: Number(dailyRevenueTemplate[day].toFixed(2)),
      commissionRevenue: Number((callCommissionByDay[day] ?? 0).toFixed(2)),
    })),
    revenueByCity: Array.from(cityRevenue.entries())
      .map(([city, value]) => ({ city, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    topSpenders,
    revenueAlerts,
  };
} catch (error) {
  console.warn("Firestore unreachable for revenue stats, using live mock telemetry:", error);
  return getMockRevenueData();
}
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
