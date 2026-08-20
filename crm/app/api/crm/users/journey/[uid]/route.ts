import { compareDesc } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { toDate, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } },
) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const uid = params.uid;
  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [callsSnap, topupsSnap] = await Promise.all([
    adminDb.collection("calls").where("fromUserId", "==", uid).orderBy("createdAt", "desc").limit(30).get(),
    adminDb
      .collection("coinTransactions")
      .where("userId", "==", uid)
      .where("type", "==", "topup")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get(),
  ]);

  const user = userDoc.data() as Record<string, unknown>;
  const timeline: Array<{ title: string; date: Date; detail?: string; level?: "ok" | "warn" }> = [];

  const createdAt = toDate(user.createdAt);
  if (createdAt) {
    timeline.push({ title: "Signed up", date: createdAt });
  }
  if (user.onboardingComplete && createdAt) {
    timeline.push({ title: "Completed onboarding", date: createdAt });
  }

  topupsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const date = toDate(data.createdAt);
    if (!date) return;
    const amount = toNumber(data.amountInr);
    const coins = toNumber(data.amountCoins);
    timeline.push({
      title: "Top-up completed",
      detail: `Rs ${amount.toFixed(0)} for ${coins} coins`,
      date,
      level: "ok",
    });
  });

  callsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const date = toDate(data.createdAt);
    if (!date) return;
    const seconds = toNumber(data.finalDurationSeconds);
    const coins = toNumber(data.finalCoinsDeducted || data.coinsSpent);
    timeline.push({
      title: "Call completed",
      detail: `${Math.max(1, Math.round(seconds / 60))} min, ${coins} coins`,
      date,
      level: seconds < 30 ? "warn" : "ok",
    });
  });

  const lastActive = toDate(user.lastActive);
  if (lastActive) {
    const daysInactive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysInactive >= 3) {
      timeline.push({
        title: `Inactive for ${daysInactive} day(s)`,
        date: new Date(),
        level: "warn",
      });
    }
  }

  timeline.sort((a, b) => compareDesc(a.date, b.date));

  return NextResponse.json({
    user: { uid: userDoc.id, ...user },
    timeline,
  });
}
