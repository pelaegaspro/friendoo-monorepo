import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { toNumber } from "@/lib/utils";

interface AddCoinsBody {
  uid: string;
  amount: number;
  reason?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<AddCoinsBody>(request);
  const uid = body.uid;
  const amount = Math.max(0, Math.floor(toNumber(body.amount)));
  if (!uid || amount <= 0) {
    return NextResponse.json({ error: "uid and positive amount are required." }, { status: 400 });
  }

  const userRef = adminDb.collection("users").doc(uid);
  const transactionRef = adminDb.collection("coinTransactions").doc();

  await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    const user = userDoc.data() as Record<string, unknown>;
    const before = toNumber(user.coinBalance);
    const after = before + amount;

    transaction.update(userRef, {
      coinBalance: after,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(transactionRef, {
      userId: uid,
      type: "bonus",
      amountCoins: amount,
      balanceBefore: before,
      balanceAfter: after,
      amountInr: 0,
      status: "success",
      reason: body.reason ?? "CRM add coins",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return NextResponse.json({ ok: true });
}
