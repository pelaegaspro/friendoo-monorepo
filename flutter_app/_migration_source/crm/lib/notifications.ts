import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";
import { chunkArray } from "@/lib/utils";

export async function sendMulticast(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (!uniqueTokens.length) {
    return { target: 0, delivered: 0 };
  }

  const chunks = chunkArray(uniqueTokens, 500);
  let delivered = 0;

  for (const tokenChunk of chunks) {
    const response = await adminMessaging.sendEachForMulticast({
      tokens: tokenChunk,
      notification: { title, body },
      data: {
        click_action: "FRIENDOO_CRM",
        ...data,
      },
    });
    delivered += response.successCount;
  }

  return { target: uniqueTokens.length, delivered };
}

export async function sendPushToUser(
  uid: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const userDoc = await adminDb.collection("users").doc(uid).get();
  const tokens = Array.isArray(userDoc.data()?.fcmTokens)
    ? (userDoc.data()?.fcmTokens as string[])
    : [];
  return sendMulticast(tokens, title, body, data);
}

export async function createInAppNotification(
  uid: string,
  payload: Record<string, unknown>,
) {
  await adminDb.collection("notifications").doc(uid).collection("items").add({
    read: false,
    createdAt: new Date(),
    ...payload,
  });
}
