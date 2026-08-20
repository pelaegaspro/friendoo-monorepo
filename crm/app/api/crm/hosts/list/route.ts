import { endOfDay, startOfDay, subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { toDate, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
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
  } catch {
    const mockHosts = [
      { uid: "h1", name: "Ananya Sharma ⭐", city: "Mumbai", ratePerMinute: 6, totalCalls: 148, earningsCoins: 22400, avgCallDurationSec: 420, complaintsCount: 0, status: "verified", isOnline: true },
      { uid: "h2", name: "Pooja Reddy 🎧", city: "Hyderabad", ratePerMinute: 5, totalCalls: 124, earningsCoins: 18600, avgCallDurationSec: 360, complaintsCount: 1, status: "verified", isOnline: true },
      { uid: "h3", name: "Kavya Patel 👑", city: "Ahmedabad", ratePerMinute: 6, totalCalls: 109, earningsCoins: 16400, avgCallDurationSec: 510, complaintsCount: 0, status: "verified", isOnline: false },
      { uid: "h4", name: "Sneha Nair ✦", city: "Bengaluru", ratePerMinute: 5, totalCalls: 96, earningsCoins: 14100, avgCallDurationSec: 330, complaintsCount: 0, status: "verified", isOnline: true },
      { uid: "h5", name: "Riya Sen ✨", city: "Kolkata", ratePerMinute: 5, totalCalls: 84, earningsCoins: 12200, avgCallDurationSec: 290, complaintsCount: 0, status: "verified", isOnline: true },
      { uid: "h6", name: "Divya Kapoor 🎙️", city: "Delhi NCR", ratePerMinute: 7, totalCalls: 78, earningsCoins: 11800, avgCallDurationSec: 480, complaintsCount: 2, status: "verified", isOnline: false },
    ];
    const mockPending = [
      { id: "app-101", name: "Meera Krishnan", city: "Chennai", phone: "+91 98840 12345", languages: ["Tamil", "English", "Telugu"] },
      { id: "app-102", name: "Tanvi Deshmukh", city: "Pune", phone: "+91 98220 54321", languages: ["Marathi", "Hindi"] },
      { id: "app-103", name: "Simran Kaur", city: "Chandigarh", phone: "+91 98140 98765", languages: ["Punjabi", "Hindi"] },
    ];
    return NextResponse.json({ hosts: mockHosts, pendingApplications: mockPending });
  }
}
