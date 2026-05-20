import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';

/**
 * requestWithdrawal — callable Cloud Function
 *
 * Allows a host to request a withdrawal of their available earnings.
 * It checks if they have sufficient balance and creates a pending withdrawal request.
 */
export const requestWithdrawal = onCall(
  { region: 'asia-south1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required.');
    }

    const uid = request.auth.uid;
    const { amount, upiId } = request.data as { amount?: number; upiId?: string };

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Amount must be a positive number.');
    }

    if (!upiId || typeof upiId !== 'string' || upiId.trim() === '') {
      throw new HttpsError('invalid-argument', 'UPI ID is required.');
    }

    const db = getDb();
    
    return db.runTransaction(async (transaction) => {
      // 1. Fetch host profile
      const hostRef = db.collection('hosts').doc(uid);
      const hostDoc = await transaction.get(hostRef);
      
      if (!hostDoc.exists) {
        throw new HttpsError('not-found', 'Host profile not found.');
      }
      
      const hostData = hostDoc.data()!;
      
      const availableForWithdrawal: number = typeof hostData.availableForWithdrawal === 'number' 
        ? hostData.availableForWithdrawal 
        : 0;
        
      const pendingWithdrawal: number = typeof hostData.pendingWithdrawal === 'number'
        ? hostData.pendingWithdrawal
        : 0;

      // 2. Validate sufficient balance
      if (availableForWithdrawal < amount) {
        throw new HttpsError('failed-precondition', 'Insufficient available balance for withdrawal.');
      }

      // 3. Update host balances
      const newAvailable = availableForWithdrawal - amount;
      const newPending = pendingWithdrawal + amount;

      transaction.update(hostRef, {
        availableForWithdrawal: newAvailable,
        pendingWithdrawal: newPending,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Create payout history record (pending state)
      const payoutRef = hostRef.collection('payoutHistory').doc();
      const payoutData = {
        id: payoutRef.id,
        hostId: uid,
        amount: amount,
        upiId: upiId,
        status: 'pending',
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: null
      };
      
      transaction.set(payoutRef, payoutData);

      return { 
        success: true, 
        message: 'Withdrawal request submitted successfully.',
        newAvailableForWithdrawal: newAvailable,
        newPendingWithdrawal: newPending
      };
    });
  }
);

import * as crypto from 'crypto';
import axios from 'axios';

/**
 * approveWithdrawal — callable Cloud Function
 *
 * Designed to be called by an Admin (e.g., from CRM).
 * Processes a pending payout through the Cashfree Payouts API.
 */
export const approveWithdrawal = onCall(
  { region: 'asia-south1', secrets: ['CASHFREE_PAYOUTS_CLIENT_ID', 'CASHFREE_PAYOUTS_PUBLIC_KEY'] },
  async (request) => {
    // 1. Ensure caller is authenticated and is an admin
    if (!request.auth || !request.auth.token.admin) {
      throw new HttpsError('permission-denied', 'Only admins can approve withdrawals.');
    }

    const { hostId, payoutId } = request.data as { hostId?: string; payoutId?: string };

    if (!hostId || !payoutId) {
      throw new HttpsError('invalid-argument', 'hostId and payoutId are required.');
    }

    const db = getDb();
    const hostRef = db.collection('hosts').doc(hostId);
    const payoutRef = hostRef.collection('payoutHistory').doc(payoutId);

    // Fetch payout details
    const payoutDoc = await payoutRef.get();
    if (!payoutDoc.exists) {
      throw new HttpsError('not-found', 'Payout record not found.');
    }

    const payoutData = payoutDoc.data()!;
    if (payoutData.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Payout is already ${payoutData.status}.`);
    }

    const amount = payoutData.amount;
    const upiId = payoutData.upiId;

    if (!amount || !upiId) {
      throw new HttpsError('internal', 'Invalid payout data.');
    }

    // 2. Prepare Cashfree API call
    const clientId = process.env.CASHFREE_PAYOUTS_CLIENT_ID;
    const publicKeyPem = process.env.CASHFREE_PAYOUTS_PUBLIC_KEY;

    if (!clientId || !publicKeyPem) {
      throw new HttpsError('internal', 'Cashfree Payouts credentials not configured.');
    }

    const isProd = process.env.CASHFREE_ENV === 'production';
    const baseUrl = isProd ? 'https://api.cashfree.com/payout' : 'https://sandbox.cashfree.com/payout';

    // Generate Signature
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = `${clientId}.${timestamp}`;
    const publicKeyFormatted = publicKeyPem.replace(/\\n/g, '\n');
    let signature = '';
    try {
      const buffer = Buffer.from(payload, 'utf8');
      const encrypted = crypto.publicEncrypt(publicKeyFormatted, buffer);
      signature = encrypted.toString('base64');
    } catch (error) {
      console.error('Error generating RSA signature:', error);
      throw new HttpsError('internal', 'Failed to generate Cashfree signature.');
    }

    const headers = {
      'x-client-id': clientId,
      'x-cf-signature': signature,
      'x-api-version': '2024-01-01',
      'Content-Type': 'application/json'
    };

    const transferId = `payout_${payoutId}_${Date.now()}`;

    const requestBody = {
      transfer_id: transferId,
      transfer_amount: amount,
      transfer_currency: 'INR',
      transfer_mode: 'upi',
      beneficiary_details: {
        beneficiary_instrument_details: {
          vpa: upiId
        }
      }
    };

    // 3. Make the API Call
    try {
      const response = await axios.post(`${baseUrl}/transfers`, requestBody, { headers });
      
      const cfData = response.data;

      // 4. Update Firestore on success
      await db.runTransaction(async (transaction) => {
        const hostSnapshot = await transaction.get(hostRef);
        if (!hostSnapshot.exists) return;

        const currentHostData = hostSnapshot.data()!;
        const pendingWithdrawal = currentHostData.pendingWithdrawal || 0;
        
        // Decrement pending amount, money has left the platform
        const newPending = Math.max(0, pendingWithdrawal - amount);

        transaction.update(hostRef, {
          pendingWithdrawal: newPending,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        transaction.update(payoutRef, {
          status: 'processing', // or 'success' depending on Cashfree async status
          cashfreeTransferId: transferId,
          cashfreeReferenceId: cfData.cf_transfer_id || null,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return { success: true, message: 'Transfer initiated successfully.', transferId };

    } catch (error: any) {
      console.error('Cashfree Payout Error:', error.response?.data || error.message);
      throw new HttpsError('internal', 'Failed to process payout with Cashfree.');
    }
  }
);
