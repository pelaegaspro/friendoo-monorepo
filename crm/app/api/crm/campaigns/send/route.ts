import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { getSegmentedUsers } from "@/lib/crmData";
import { adminDb } from "@/lib/firebaseAdmin";
import { createInAppNotification, sendMulticast } from "@/lib/notifications";
import { SegmentKey } from "@/lib/types";

interface SendCampaignBody {
  campaignId: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const { campaignId } = await parseJsonBody<SendCampaignBody>(request);
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required." }, { status: 400 });
  }

  const campaignRef = adminDb.collection("campaigns").doc(campaignId);
  const campaignDoc = await campaignRef.get();
  if (!campaignDoc.exists) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  const campaign = campaignDoc.data() as Record<string, unknown>;
  const segment = (campaign.segment as SegmentKey) || "all";
  const customFilter = campaign.customFilter;
  const users = await getSegmentedUsers(segment, customFilter);
  const title = String(campaign.title || "Friendoo");
  const body = String(campaign.body || "New update from Friendoo.");
  const type = String(campaign.type || "both");

  const tokens: string[] = [];
  const userIds: string[] = [];
  users.forEach((user) => {
    userIds.push(user.uid);
    if (Array.isArray(user.fcmTokens)) {
      tokens.push(...user.fcmTokens.filter((token) => typeof token === "string"));
    }
  });

  let deliveredCount = 0;
  if (type === "push" || type === "both") {
    const push = await sendMulticast(tokens, title, body, {
      type: "campaign",
      campaignId,
    });
    deliveredCount = push.delivered;
  }

  if (type === "inapp" || type === "both") {
    await Promise.all(
      userIds.map((uid) =>
        createInAppNotification(uid, {
          type: "campaign",
          campaignId,
          title,
          message: body,
          read: false,
        }),
      ),
    );
  }

  await campaignRef.set(
    {
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      targetCount: userIds.length,
      deliveredCount,
      openedCount: campaign.openedCount || 0,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({
    ok: true,
    campaignId,
    targetCount: userIds.length,
    deliveredCount,
  });
}
