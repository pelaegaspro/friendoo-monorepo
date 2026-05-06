"use server"

import { getDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";
import crypto from 'crypto';

const CASHFREE_PAYOUT_URL = "https://payout-api.cashfree.com/payout/v1";

// Same key as Kotlin app for end-to-end encryption
const CRYPTO_KEY = Buffer.from("FRIENDOO_SECURE_KEY_2026_WALLET");
const CRYPTO_IV = Buffer.from("FRIENDOO_IV_2026");

function decrypt(encryptedText: string): string | null {
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', CRYPTO_KEY, CRYPTO_IV);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
}

/**
 * Approves a withdrawal and initiates a real Cashfree Payout.
 */
export async function approveWithdrawal(hostId: string, payoutId: string, adminNote: string = "") {
  const db = getDb();
  const payoutRef = db.collection('hosts').doc(hostId).collection('payoutHistory').doc(payoutId);
  
  try {
    const [payoutSnap, hostSnap] = await Promise.all([
        payoutRef.get(),
        db.collection('hosts').doc(hostId).get()
    ]);

    if (!payoutSnap.exists) throw new Error("Payout request not found");
    if (!hostSnap.exists) throw new Error("Host not found");

    const payoutData = payoutSnap.data()!;
    const hostData = hostSnap.data()!;
    
    if (payoutData.status !== 'pending') throw new Error("Only pending requests can be approved");

    const encryptedUpi = hostData.upiEncrypted;
    if (!encryptedUpi) throw new Error("Host has no verified UPI ID");

    const upiId = decrypt(encryptedUpi);
    if (!upiId) throw new Error("Failed to decrypt UPI ID");

    const amount = payoutData.amount; // In INR

    // 1. Update status to approved
    await payoutRef.update({
      status: 'approved',
      adminNote,
      updatedAt: adminFieldValue.serverTimestamp()
    });

    // 2. Cashfree Payouts Integration
    const clientId = process.env.CASHFREE_APP_ID;
    const clientSecret = process.env.CASHFREE_SECRET_KEY;

    if (!clientId || !clientSecret) throw new Error("Cashfree credentials not configured");

    // Direct Transfer (UPI)
    const transferResponse = await fetch(`${CASHFREE_PAYOUT_URL}/directTransfer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': clientId,
            'X-Client-Secret': clientSecret
        },
        body: JSON.stringify({
            transferId: payoutId, // Use our document ID as transferId for idempotency
            amount: amount.toFixed(2),
            transferMode: "upi",
            vpa: upiId,
            remarks: "Friendoo Host Payout"
        })
    });

    const cashfreeResult = await transferResponse.json();

    if (cashfreeResult.status === "ERROR") {
        throw new Error(cashfreeResult.message || "Cashfree transfer failed");
    }

    // 3. Update status to completed on success
    await db.runTransaction(async (transaction) => {
      transaction.update(payoutRef, {
        status: 'completed',
        processedAt: adminFieldValue.serverTimestamp(),
        cashfreeReferenceId: cashfreeResult.data?.referenceId || null,
        updatedAt: adminFieldValue.serverTimestamp()
      });

      transaction.update(db.collection('hosts').doc(hostId), {
        walletBalance: adminFieldValue.increment(-amount),
        updatedAt: adminFieldValue.serverTimestamp()
      });

      const txRef = db.collection('transactions').doc();
      transaction.set(txRef, {
        hostId,
        type: 'payout',
        amount,
        hostAlias: hostData.alias || "Unknown Host",
        cashfreeReferenceId: cashfreeResult.data?.referenceId || null,
        timestamp: adminFieldValue.serverTimestamp()
      });
    });

    revalidatePath("/admin/payments/withdrawals");
    return { success: true };
    
  } catch (error: any) {
    console.error("Payout error:", error);
    await payoutRef.update({
      status: 'rejected',
      failureReason: error.message,
      updatedAt: adminFieldValue.serverTimestamp()
    });
    revalidatePath("/admin/payments/withdrawals");
    return { success: false, error: error.message };
  }
}

export async function rejectWithdrawal(hostId: string, payoutId: string, reason: string) {
  const db = getDb();
  const payoutRef = db.collection('hosts').doc(hostId).collection('payoutHistory').doc(payoutId);
  
  try {
    await payoutRef.update({
        status: 'rejected',
        adminNote: reason,
        processedAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp()
    });

    revalidatePath("/admin/payments/withdrawals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
