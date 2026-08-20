import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { createInAppNotification, sendPushToUser } from "@/lib/notifications";

interface MessageBody {
  uid: string;
  message: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<MessageBody>(request);
  if (!body.uid || !body.message?.trim()) {
    return NextResponse.json({ error: "uid and message are required." }, { status: 400 });
  }

  const text = body.message.trim();
  const push = await sendPushToUser(body.uid, "Friendoo", text.slice(0, 120));
  await createInAppNotification(body.uid, {
    type: "admin_message",
    message: text,
  });

  return NextResponse.json({ ok: true, push });
}
