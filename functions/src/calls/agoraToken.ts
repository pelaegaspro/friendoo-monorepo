import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getDb, admin } from "../firebaseAdmin";
import { RtcTokenBuilder, RtcRole } from "agora-token";

/**
 * getAgoraToken — called by the Flutter app before joining a call.
 *
 * Request:  { callId: string }
 *   callId = Firestore document ID in the "calls" collection.
 *
 * Response: { token: string, appId: string, channel: string }
 */
export const getAgoraToken = onCall(
  { region: "asia-south1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to join a call."
      );
    }

    const data = request.data as { callId?: string };
    const { callId } = data;

    if (!callId) {
      throw new HttpsError("invalid-argument", "callId is required.");
    }

    const uid = request.auth.uid;
    const db = getDb();
    const callRef = db.collection("calls").doc(callId);
    const callSnap = await callRef.get();

    if (!callSnap.exists) {
      throw new HttpsError("not-found", "Call not found.");
    }

    const callData = callSnap.data()!;

    // Validate caller is a participant (support both field name conventions)
    const callerId = callData["callerId"] || callData["fromUserId"];
    const receiverId = callData["receiverId"] || callData["toUserId"];
    if (callerId !== uid && receiverId !== uid) {
      throw new HttpsError(
        "permission-denied",
        "You are not a participant of this call."
      );
    }

    // Accept "active" or "ringing" status
    const validStatuses = ["ringing", "active"];
    if (!validStatuses.includes(callData["status"])) {
      throw new HttpsError(
        "failed-precondition",
        `Call status "${callData["status"]}" is not valid for joining.`
      );
    }

    // Read Agora credentials from environment
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new HttpsError(
        "internal",
        "Agora credentials are not configured on the server."
      );
    }

    const channelName = callId;
    const uidForToken = 0; // wildcard
    const role = RtcRole.PUBLISHER;
    const expirationSeconds = 3600;
    const now = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = now + expirationSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uidForToken,
      role,
      expirationSeconds,
      privilegeExpiredTs
    );

    // Log token generation
    await db.collection("call_logs").add({
      callerUid: uid,
      callId,
      channelName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date((now + expirationSeconds) * 1000),
    });

    return {
      token,
      appId,
      channel: channelName,
    };
  }
);
