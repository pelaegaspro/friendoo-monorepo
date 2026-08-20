import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getDb } from '../firebaseAdmin';

/**
 * Push-notify host when a new ringing call is created.
 */
export const notifyHostIncomingCall = onDocumentCreated(
  { document: 'calls/{callId}', region: 'asia-south1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const state = (data.state as string) || (data.status as string);
    if (state !== 'ringing') return;

    const hostId =
      (typeof data.hostId === 'string' && data.hostId) ||
      (typeof data.receiverId === 'string' && data.receiverId) ||
      (typeof data.toUserId === 'string' && data.toUserId);
    if (!hostId) return;

    const db = getDb();
    const hostSnap = await db.collection('users').doc(hostId).get();
    const rawTokens = hostSnap.data()?.fcmTokens;
    const tokens = Array.isArray(rawTokens)
      ? rawTokens.filter((t): t is string => typeof t === 'string' && t.length > 0)
      : [];
    if (tokens.length === 0) return;

    const callId = event.params.callId as string;
    const callerAlias =
      (typeof data.fromDisplayName === 'string' && data.fromDisplayName) || 'Someone';
    const ratePerMinute = String(data.ratePerMinute ?? 5);
    const callType = (typeof data.callType === 'string' && data.callType) || 'audio';

    await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'Incoming Friendoo call',
        body: `${callerAlias} wants to talk`,
      },
      data: {
        type: 'incoming_call',
        callId,
        callerAlias,
        ratePerMinute,
        callType,
      },
      android: {
        priority: 'high',
      },
    });
  }
);
