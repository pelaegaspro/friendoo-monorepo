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
  const ticketRef = adminDb.collection("supportTickets").doc(body.ticketId);
  const refundTxId = `refund_ticket_${body.ticketId}`;
  const txRef = adminDb.collection("coinTransactions").doc(refundTxId);

  let alreadyRefunded = false;

  await adminDb.runTransaction(async (transaction) => {
    const [userDoc, ticketDoc, existingTxDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(ticketRef),
      transaction.get(txRef),
    ]);

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    if (!ticketDoc.exists) {
      throw new Error("Ticket not found");
    }

    // Idempotency check: ticket already refunded or transaction already recorded
    const ticketData = ticketDoc.data() as Record<string, unknown>;
    if (existingTxDoc.exists || ticketData.status === "resolved" || (ticketData.refundAmount && Number(ticketData.refundAmount) > 0)) {
      alreadyRefunded = true;
      return;
    }

    const relatedCallId = typeof ticketData.callId === "string" ? ticketData.callId : undefined;
    const before = toNumber(userDoc.data()?.coinBalance);
    const after = before + coinsAmount;

    transaction.update(userRef, { coinBalance: after, updatedAt: FieldValue.serverTimestamp() });
    transaction.set(txRef, {
      idempotencyKey: `refund:ticket:${body.ticketId}`,
      userId: body.userId,
      type: "refund",
      amountCoins: coinsAmount,
      balanceBefore: before,
      balanceAfter: after,
      amountInr: 0,
      status: "success",
      callId: relatedCallId || null,
      createdAt: FieldValue.serverTimestamp(),
      reason: `Support refund for ticket ${body.ticketId}`,
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

  if (alreadyRefunded) {
    return NextResponse.json({ ok: true, status: "already_refunded", message: "Refund was already credited previously" });
  }

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
