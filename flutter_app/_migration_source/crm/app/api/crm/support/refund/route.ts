import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { toNumber } from "@/lib/utils";

interface RefundBody {
  ticketId: string;
  userId: string;
  coinsAmount: number;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<RefundBody>(request);
  const coinsAmount = Math.max(1, Math.floor(toNumber(body.coinsAmount)));
  if (!body.ticketId || !body.userId || coinsAmount <= 0) {
    return NextResponse.json({ error: "ticketId, userId and coinsAmount are required." }, { status: 400 });
  }

  const userRef = adminDb.collection("users").doc(body.userId);
  const txRef = adminDb.collection("coinTransactions").doc();
  const ticketRef = adminDb.collection("supportTickets").doc(body.ticketId);
  const ticketDoc = await ticketRef.get();
  const ticketData = ticketDoc.exists ? (ticketDoc.data() as Record<string, unknown>) : {};
  const relatedCallId = typeof ticketData.callId === "string" ? ticketData.callId : undefined;

  await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const before = toNumber(userDoc.data()?.coinBalance);
    const after = before + coinsAmount;
    transaction.update(userRef, { coinBalance: after, updatedAt: FieldValue.serverTimestamp() });
    transaction.set(txRef, {
      userId: body.userId,
      type: "refund",
      amountCoins: coinsAmount,
      balanceBefore: before,
      balanceAfter: after,
      amountInr: 0,
      status: "success",
      callId: relatedCallId || null,
      createdAt: FieldValue.serverTimestamp(),
      reason: "Support refund",
    });
    transaction.update(ticketRef, {
      status: "resolved",
      refundAmount: coinsAmount,
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      messages: FieldValue.arrayUnion({
        senderId: "admin",
        senderName: "Friendoo Support",
        text: `Refund of ${coinsAmount} coins has been processed.`,
        sentAt: new Date(),
        isAdmin: true,
      }),
    });
  });

  const openAlerts = await adminDb
    .collection("fraudAlerts")
    .where("userId", "==", body.userId)
    .where("status", "==", "open")
    .get();
  await Promise.all(
    openAlerts.docs
      .filter((doc) => {
        const data = doc.data() as Record<string, unknown>;
        if (data.type !== "call_refund_needed") return false;
        if (!relatedCallId) return true;
        return data.relatedCallId === relatedCallId;
      })
      .map((doc) =>
        doc.ref.set(
          {
            status: "reviewed",
            reviewedAt: FieldValue.serverTimestamp(),
            reviewedBy: "crm_admin",
          },
          { merge: true },
        ),
      ),
  );

  return NextResponse.json({ ok: true });
}
