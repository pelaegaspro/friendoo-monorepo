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
