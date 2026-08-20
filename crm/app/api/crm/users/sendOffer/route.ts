import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendMulticast } from "@/lib/notifications";
import { OfferType } from "@/lib/types";
import { toNumber } from "@/lib/utils";

interface SendOfferBody {
  uids: string[];
  offerType: OfferType;
  coins?: number;
  title?: string;
  body?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const payload = await parseJsonBody<SendOfferBody>(request);
  const uids = Array.from(new Set(payload.uids ?? [])).filter(Boolean);
  if (!uids.length) {
    return NextResponse.json({ error: "uids are required." }, { status: 400 });
  }

  const offerType = payload.offerType;
  const offerTitle = payload.title || "Friendoo Offer";
  const offerBody = payload.body || "You have a new offer in Friendoo.";
  const allTokens: string[] = [];

  if (offerType === "free_coins") {
    const bonusCoins = Math.max(1, Math.floor(toNumber(payload.coins)));
    for (const uid of uids) {
      const userRef = adminDb.collection("users").doc(uid);
      const txRef = adminDb.collection("coinTransactions").doc();
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return;
        const before = toNumber(userDoc.data()?.coinBalance);
        const after = before + bonusCoins;
        transaction.update(userRef, { coinBalance: after, updatedAt: FieldValue.serverTimestamp() });
        transaction.set(txRef, {
          userId: uid,
          type: "bonus",
          amountCoins: bonusCoins,
          balanceBefore: before,
          balanceAfter: after,
          amountInr: 0,
          status: "success",
          reason: "CRM free coins offer",
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    }
  } else {
    for (const uid of uids) {
      await adminDb.collection("offers").add({
        userId: uid,
        offerType,
        title: offerTitle,
        body: offerBody,
        status: "active",
        createdAt: new Date(),
      });
    }
  }

  const usersSnap = await adminDb.getAll(...uids.map((uid) => adminDb.collection("users").doc(uid)));
  usersSnap.forEach((doc) => {
    const tokens = doc.data()?.fcmTokens;
    if (Array.isArray(tokens)) {
      allTokens.push(...tokens.filter((value: unknown) => typeof value === "string"));
    }
  });
  const push = await sendMulticast(allTokens, offerTitle, offerBody);

  return NextResponse.json({ ok: true, users: uids.length, push });
}
