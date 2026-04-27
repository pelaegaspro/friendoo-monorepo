import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { escalateSeverity, normalizeSeverity } from "@/lib/fraudDetector";
import { adminDb } from "@/lib/firebaseAdmin";
import { createInAppNotification } from "@/lib/notifications";
import { toNumber } from "@/lib/utils";

interface FraudActionBody {
  alertId: string;
  action: "dismiss" | "warn_user" | "auto_refund" | "ban_user" | "escalate";
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const { alertId, action } = await parseJsonBody<FraudActionBody>(request);
  if (!alertId || !action) {
    return NextResponse.json({ error: "alertId and action are required." }, { status: 400 });
  }

  const alertRef = adminDb.collection("fraudAlerts").doc(alertId);
  const alertDoc = await alertRef.get();
  if (!alertDoc.exists) {
    return NextResponse.json({ error: "Alert not found." }, { status: 404 });
  }
  const alert = alertDoc.data() as Record<string, unknown>;

  if (action === "dismiss") {
    await alertRef.update({
      status: "dismissed",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: "crm_admin",
    });
  } else if (action === "escalate") {
    await alertRef.update({
      severity: escalateSeverity(normalizeSeverity(alert.severity)),
      status: "reviewed",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: "crm_admin",
    });
  } else if (action === "ban_user") {
    const userId = String(alert.userId || "");
    if (userId) {
      await adminDb.collection("users").doc(userId).set({ isBanned: true }, { merge: true });
    }
    await alertRef.update({
      status: "reviewed",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: "crm_admin",
    });
  } else if (action === "warn_user") {
    const userId = String(alert.userId || "");
    if (userId) {
      await createInAppNotification(userId, {
        type: "risk_warning",
        message: "Your account activity has been flagged. Please follow community guidelines.",
      });
    }
    await alertRef.update({
      status: "reviewed",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: "crm_admin",
    });
  } else if (action === "auto_refund") {
    const userId = String(alert.userId || "");
    const coins = Math.max(1, Math.floor(toNumber(alert.amount)));
    if (userId) {
      const userRef = adminDb.collection("users").doc(userId);
      const txRef = adminDb.collection("coinTransactions").doc();
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return;
        const before = toNumber(userDoc.data()?.coinBalance);
        const after = before + coins;
        transaction.update(userRef, { coinBalance: after, updatedAt: FieldValue.serverTimestamp() });
        transaction.set(txRef, {
          userId,
          type: "refund",
          amountCoins: coins,
          balanceBefore: before,
          balanceAfter: after,
          amountInr: 0,
          status: "success",
          reason: "Fraud alert auto refund",
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    }
    await alertRef.update({
      status: "reviewed",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: "crm_admin",
    });
  }

  return NextResponse.json({ ok: true });
}
