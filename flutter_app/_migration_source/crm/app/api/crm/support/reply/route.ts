import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { createInAppNotification, sendPushToUser } from "@/lib/notifications";

interface SupportReplyBody {
  ticketId: string;
  message: string;
  sendPush?: boolean;
  sendInApp?: boolean;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<SupportReplyBody>(request);
  if (!body.ticketId || !body.message?.trim()) {
    return NextResponse.json({ error: "ticketId and message are required." }, { status: 400 });
  }

  const ticketRef = adminDb.collection("supportTickets").doc(body.ticketId);
  const ticketDoc = await ticketRef.get();
  if (!ticketDoc.exists) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  const ticket = ticketDoc.data() as Record<string, unknown>;
  const text = body.message.trim();

  await ticketRef.update({
    messages: FieldValue.arrayUnion({
      senderId: "admin",
      senderName: "Support Team",
      text,
      sentAt: new Date(),
      isAdmin: true,
    }),
    status: ticket.status === "open" ? "in_progress" : ticket.status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const userId = String(ticket.userId || "");
  if (userId && body.sendPush !== false) {
    await sendPushToUser(userId, "Friendoo Support", text.slice(0, 100), {
      type: "support_reply",
      ticketId: body.ticketId,
    });
  }
  if (userId && body.sendInApp !== false) {
    await createInAppNotification(userId, {
      type: "support_reply",
      title: "Support Team replied",
      message: text,
      ticketId: body.ticketId,
      read: false,
    });
  }

  return NextResponse.json({ ok: true });
}
