import { endOfDay, startOfDay, subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { toDate, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const weekStart = startOfDay(subDays(new Date(), 6));
  const [hostsSnap, callsSnap, earningsSnap, pendingAppsSnap, ticketsSnap] = await Promise.all([
    adminDb.collection("users").where("isHost", "==", true).get(),
    adminDb.collection("calls").where("createdAt", ">=", weekStart).get(),
    adminDb.collection("coinTransactions").where("type", "==", "hostearning").get(),
    adminDb.collection("hostApplications").where("status", "==", "pending").get(),
    adminDb.collection("supportTickets").where("type", "==", "host_complaint").get(),
  ]);

  const callsByHost = new Map<string, number>();
  const durationByHost = new Map<string, number>();
  callsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const hostId = data.toUserId as string | undefined;
    if (!hostId) return;
    callsByHost.set(hostId, (callsByHost.get(hostId) ?? 0) + 1);
    durationByHost.set(hostId, (durationByHost.get(hostId) ?? 0) + toNumber(data.finalDurationSeconds));
  });

  const earningsByHost = new Map<string, number>();
  earningsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const hostId = data.userId as string | undefined;
    if (!hostId) return;
    const createdAt = toDate(data.createdAt);
    if (!createdAt) return;
    if (createdAt < weekStart || createdAt > endOfDay(new Date())) return;
    earningsByHost.set(hostId, (earningsByHost.get(hostId) ?? 0) + toNumber(data.amountCoins));
  });

  const complaintsByHost = new Map<string, number>();
  ticketsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const hostId = data.hostId as string | undefined;
    if (!hostId) return;
    complaintsByHost.set(hostId, (complaintsByHost.get(hostId) ?? 0) + 1);
  });

  const hosts = hostsSnap.docs
    .map((doc) => {
      const user = doc.data();
      const totalCalls = callsByHost.get(doc.id) ?? 0;
      const avgDuration =
        totalCalls > 0 ? Math.round((durationByHost.get(doc.id) ?? 0) / totalCalls) : 0;
      return {
        uid: doc.id,
        name: user.displayName || user.username || "Host",
        photoURL: user.photoURL || "",
        city: user.city || "-",
        ratePerMinute: toNumber(user.ratePerMinute),
        totalCalls,
        earningsCoins: earningsByHost.get(doc.id) ?? 0,
        avgCallDurationSec: avgDuration,
        complaintsCount: complaintsByHost.get(doc.id) ?? 0,
        status: user.hostStatus || "active",
        isOnline: Boolean(user.isOnline),
      };
    })
    .sort((a, b) => b.earningsCoins - a.earningsCoins);

  const pendingApplications = pendingAppsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ hosts, pendingApplications });
}
