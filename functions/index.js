const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

/**
 * Report Creation Logic: 
 * 1. Calculate Priority & SLA.
 * 2. Send Auto-Reply from Admin to start thread.
 * 3. Trigger 24/7 Auto-Protection (Freeze, Alerts).
 */
exports.onReportCreated = functions.firestore
  .document("reports/{reportId}")
  .onCreate(async (snapshot, context) => {
    const report = snapshot.data();
    const reportId = context.params.reportId;
    const hostId = report.reportedId;
    const userId = report.reporterId;

    // 1. START CONVERSATION THREAD: Instant Auto-Reply
    await db.collection(`reports/${reportId}/messages`).add({
      text: "We've received your report and restricted the host's account while we investigate. We'll update you here within 24 hours.",
      senderType: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveredAt: null,
      readAt: null
    });

    // 2. CONTEXTUAL DATA & FAKE REPORT REJECTION
    const [hDoc, uDoc] = await Promise.all([
        db.collection("hosts").doc(hostId).get(),
        db.collection("users").doc(userId).get()
    ]);
    const userData = uDoc.data();
    const hData = hDoc.data();
    const previousReports = hData?.reportCount || 0;

    if ((userData?.totalSpent || 0) < 10 && !report.evidenceUrl) {
        return snapshot.ref.update({ status: "auto_rejected", adminNotes: "Low credibility." });
    }

    // 3. AUTO-PROTECTION (Freeze/Offline)
    if (report.reason === "Off-Platform Fraud" && report.evidenceUrl) {
        await db.collection("hosts").doc(hostId).update({
            payoutFrozen: true,
            callStatus: "offline",
            isOnline: false,
            freezeReason: "fraud_report_auto",
            freezeTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    // 4. PRIORITY & SLA CALCULATION
    const priority = calculatePriority(report, previousReports);
    const deadline = admin.firestore.Timestamp.fromMillis(Date.now() + (getSLAHours(priority) * 60 * 60 * 1000));

    await snapshot.ref.update({
        priority: priority,
        slaDeadline: deadline,
        slaBreach: false,
        reportType: report.reason // For thread UI
    });

    // 5. EMERGENCY ALERTS
    if (priority === "critical") {
        await sendAdminAlert(`🚨 CRITICAL: Fraud report for ${report.reportedAlias}. 2hr SLA.`);
    }

    return null;
});

function calculatePriority(report, prevReports) {
    let score = 0;
    if (report.evidenceUrl) score += 40;
    const amount = report.amountLost || 0;
    if (amount > 500) score += 40;
    if (report.reason === "Off-Platform Fraud") score += 20;
    if (prevReports >= 2) score += 20;
    if (score >= 80) return "critical";
    if (score >= 50) return "high";
    return "medium";
}

function getSLAHours(p) {
    const map = { critical: 2, high: 12, medium: 24, low: 72 };
    return map[p] || 72;
}

async function sendAdminAlert(msg) {
    console.log("ADMIN ALERT:", msg);
}

/**
 * CASHFREE INTEGRATION:
 * 1. createCashfreeOrder: Generates a payment session for the app.
 * 2. rechargeWallet: Verifies payment and adds coins.
 */
exports.createCashfreeOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User only');

    const amount = data.amount;
    const userId = context.auth.uid;
    const orderId = `order_${userId.slice(0, 5)}_${Date.now()}`;

    try {
        const response = await axios.post(
            'https://sandbox.cashfree.com/pg/orders', // sandbox for testing
            {
                order_id: orderId,
                order_amount: amount,
                order_currency: 'INR',
                customer_details: {
                    customer_id: userId,
                    customer_email: 'user@friendoo.app',
                    customer_phone: '9999999999'
                }
            },
            {
                headers: {
                    'x-api-version': '2023-08-01',
                    'x-client-id': functions.config().cashfree.app_id,
                    'x-client-secret': functions.config().cashfree.secret_key
                }
            }
        );

        return {
            orderId: response.data.order_id,
            paymentSessionId: response.data.payment_session_id
        };
    } catch (error) {
        console.error('Cashfree Order Error:', error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Failed to create payment session');
    }
});

exports.rechargeWallet = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User only');

    const { paymentId, userId } = data; // paymentId is the Cashfree OrderId

    try {
        // 1. Verify with Cashfree
        const response = await axios.get(
            `https://sandbox.cashfree.com/pg/orders/${paymentId}`,
            {
                headers: {
                    'x-api-version': '2023-08-01',
                    'x-client-id': functions.config().cashfree.app_id,
                    'x-client-secret': functions.config().cashfree.secret_key
                }
            }
        );

        if (response.data.order_status === 'PAID') {
            const amount = response.data.order_amount;
            const coins = Math.floor(amount); // 1 INR = 1 Coin for now

            const userRef = db.collection('users').doc(userId);
            await db.runTransaction(async (t) => {
                t.update(userRef, {
                    walletBalance: admin.firestore.FieldValue.increment(coins)
                });

                const txRef = db.collection('transactions').doc();
                t.set(txRef, {
                    userId,
                    type: 'recharge',
                    amount: coins,
                    paymentId: paymentId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            return { success: true, coinsAdded: coins };
        }

        return { success: false, message: 'Payment not successful' };
    } catch (error) {
        console.error('Verification Error:', error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Failed to verify payment');
    }
});

/**
 * WEEKLY AUTO-PAYOUT: Runs every Monday at 10 AM.
 * Processes all 'pending' withdrawal requests using Cashfree.
 */
exports.weeklyAutoPayout = functions.pubsub.schedule('0 10 * * 1')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const snapshots = await db.collection("withdrawalRequests")
        .where("status", "==", "pending")
        .get();

    if (snapshots.empty) return console.log("No pending withdrawals.");

    const clientId = functions.config().cashfree.app_id;
    const clientSecret = functions.config().cashfree.secret_key;

    for (const doc of snapshots.docs) {
        const data = doc.data();
        try {
            const response = await axios.post(
                'https://payout-api.cashfree.com/payout/v1/directTransfer',
                {
                    transferId: doc.id,
                    amount: data.amount.toFixed(2),
                    transferMode: "upi",
                    vpa: data.upiId,
                    remarks: "Friendoo Weekly Payout"
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Client-Id': clientId,
                        'X-Client-Secret': clientSecret
                    }
                }
            );

            if (response.data.status === "SUCCESS") {
                await doc.ref.update({
                    status: "completed",
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    cashfreeReferenceId: response.data.data.referenceId
                });
            }
        } catch (e) {
            console.error(`Failed to payout for ${doc.id}:`, e.message);
        }
    }
    return null;
});

/**
 * RESOLUTION LOGIC: 
 * Marks report as resolved and updates thread status.
 */
exports.resolveReport = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin only');
    const { reportId, status, replyText } = data; // status: "resolved" | "rejected"
    
    return db.runTransaction(async (transaction) => {
        const reportRef = db.collection("reports").doc(reportId);
        transaction.update(reportRef, { status: status, resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
        
        if (replyText) {
            const msgRef = db.collection(`reports/${reportId}/messages`).doc();
            transaction.set(msgRef, {
                text: replyText,
                senderType: "admin",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                deliveredAt: null,
                readAt: null
            });
        }
        return { success: true };
    });
});
