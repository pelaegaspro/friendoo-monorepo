"use server"

import { getDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";
import crypto from 'crypto';

const RAZORPAYX_BASE_URL = "https://api.razorpay.com/v1";

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
 * Approves a withdrawal and initiates a real RazorpayX Payout.
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

    // 1. Update status to processing
    await payoutRef.update({
      status: 'approved',
      adminNote,
      updatedAt: adminFieldValue.serverTimestamp()
    });

    // 2. RazorpayX Integration
    const auth = Buffer.from(`${process.env.RAZORPAYX_KEY_ID}:${process.env.RAZORPAYX_KEY_SECRET}`).toString('base64');

    // A. Create/Find Contact
    const contactResponse = await fetch(`${RAZORPAYX_BASE_URL}/contacts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
            name: `Host ${hostId.slice(0, 8)}`,
            email: "support@friendoo.app",
            type: "vendor",
            reference_id: hostId
        })
    });
    const contact = await contactResponse.json();

    // B. Create Fund Account (UPI)
    const fundAccountResponse = await fetch(`${RAZORPAYX_BASE_URL}/fund_accounts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
            account_type: "vpa",
            contact_id: contact.id,
            vpa: { address: upiId }
        })
    });
    const fundAccount = await fundAccountResponse.json();

    // C. Create Payout
    const payoutResponse = await fetch(`${RAZORPAYX_BASE_URL}/payouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
            fund_account_id: fundAccount.id,
            amount: amount * 100, // Paise
            currency: "INR",
            mode: "UPI",
            purpose: "payout",
            queue_if_low_balance: true,
            reference_id: payoutId,
            narration: "Friendoo Host Payout"
        })
    });
    const razorpayPayout = await payoutResponse.json();
    if (razorpayPayout.error) throw new Error(razorpayPayout.error.description);

    // 3. Update status to completed on success
    await db.runTransaction(async (transaction) => {
      transaction.update(payoutRef, {
        status: 'completed',
        processedAt: adminFieldValue.serverTimestamp(),
        razorpayPayoutId: razorpayPayout.id,
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
        razorpayPayoutId: razorpayPayout.id,
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
