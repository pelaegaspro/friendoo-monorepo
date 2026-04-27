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
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utc + istOffset);
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

export async function getDashboardData(now = new Date()) {
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
    usersSnap,
    onlineHostsSnap,
    newUsersTodaySnap,
    newUsersYesterdaySnap,
    openTicketsSnap,
    pendingApplicationsSnap,
    alertsSnap,
    callsWeekSnap,
    callsAllSnap,
    topupsAllSnap,
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
    adminDb.collection("calls").where("status", "==", "active").get(),
    adminDb.collection("users").get(),
    adminDb.collection("users").where("isHost", "==", true).where("isOnline", "==", true).get(),
    adminDb.collection("users").where("createdAt", ">=", todayStart).where("createdAt", "<=", todayEnd).get(),
    adminDb
      .collection("users")
      .where("createdAt", ">=", yesterdayStart)
      .where("createdAt", "<=", yesterdayEnd)
      .get(),
    adminDb.collection("supportTickets").where("status", "in", ["open", "in_progress"]).get(),
    adminDb.collection("hostApplications").where("status", "==", "pending").get(),
    adminDb.collection("fraudAlerts").where("status", "==", "open").limit(30).get(),
    adminDb.collection("calls").where("createdAt", ">=", weekStart).get(),
    adminDb.collection("calls").get(),
    adminDb.collection("coinTransactions").where("type", "==", "topup").where("status", "==", "success").get(),
    adminDb
      .collection("coinTransactions")
      .where("type", "==", "topup")
      .where("status", "==", "success")
      .where("createdAt", ">=", past14DaysStart)
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

  let coinsInCirculation = 0;
  let totalHosts = 0;
  const usersById = new Map<string, UserRecord>();
  usersSnap.docs.forEach((doc) => {
    const user = { uid: doc.id, ...(doc.data() as object) } as UserRecord;
    usersById.set(doc.id, user);
    coinsInCirculation += toNumber(user.coinBalance);
    if (user.isHost) totalHosts += 1;
  });

  const topHostsMap = new Map<string, number>();
  const hourlyCalls = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 }));
  callsWeekSnap.docs.forEach((doc) => {
    const call = { id: doc.id, ...(doc.data() as object) } as CallRecord;
    const hostId = call.toUserId;
    if (hostId) {
      topHostsMap.set(hostId, (topHostsMap.get(hostId) ?? 0) + 1);
    }
    const createdAt = toDate(call.createdAt);
    if (createdAt) {
      hourlyCalls[createdAt.getHours()].calls += 1;
    }
  });

  const topHosts = Array.from(topHostsMap.entries())
    .map(([uid, totalCalls]) => {
      const host = usersById.get(uid);
      return {
        hostId: uid,
        name: host?.displayName || host?.username || "Host",
        totalCalls,
      };
    })
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 5);

  const callsByUser = new Map<string, number>();
  callsAllSnap.docs.forEach((doc) => {
    const call = doc.data() as CallRecord;
    if (call.fromUserId) {
      callsByUser.set(call.fromUserId, (callsByUser.get(call.fromUserId) ?? 0) + 1);
    }
  });

  const topupsByUser = new Map<string, number>();
  topupsAllSnap.docs.forEach((doc) => {
    const tx = doc.data() as CoinTransactionRecord;
    if (tx.userId) {
      topupsByUser.set(tx.userId, (topupsByUser.get(tx.userId) ?? 0) + 1);
    }
  });

  const totalSignups = usersById.size;
  const onboardingCount = Array.from(usersById.values()).filter((user) => Boolean(user.onboardingComplete))
    .length;
  const firstTopupCount = topupsByUser.size;
  const firstCallCount = Array.from(callsByUser.values()).filter((count) => count >= 1).length;
  const secondCallCount = Array.from(callsByUser.values()).filter((count) => count >= 2).length;

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
      totalUsers: usersById.size,
      totalHosts,
      activeCalls: activeCallsSnap.size,
      coinsInCirculation,
      onlineHosts: onlineHostsSnap.size,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      newUsersToday: newUsersTodaySnap.size,
      newUsersYesterday: newUsersYesterdaySnap.size,
      openTickets: openTicketsSnap.size,
      pendingApplications: pendingApplicationsSnap.size,
    },
    revenueTrend: Object.entries(dailyRevenue).map(([day, amount]) => ({
      day,
      amount: Number(amount.toFixed(2)),
    })),
    funnel: [
      { step: "Total Signups", count: totalSignups },
      { step: "Completed Onboarding", count: onboardingCount },
      { step: "Made First Top-up", count: firstTopupCount },
      { step: "Made First Call", count: firstCallCount },
      { step: "Made Second Call", count: secondCallCount },
    ],
    topHosts,
    callVolumeByHour: hourlyCalls,
    alerts,
  };
}

export async function getUsersWithStats() {
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

export async function getRevenueStats(now = new Date()) {
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
