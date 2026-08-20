import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

interface UpdateTicketBody {
  ticketId: string;
  status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  internalNotes?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<UpdateTicketBody>(request);
  if (!body.ticketId) {
    return NextResponse.json({ error: "ticketId is required." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (body.status) payload.status = body.status;
  if (body.priority) payload.priority = body.priority;
  if (typeof body.assignedTo === "string") payload.assignedTo = body.assignedTo;
  if (typeof body.internalNotes === "string") payload.internalNotes = body.internalNotes;
  if (body.status === "resolved" || body.status === "closed") {
    payload.resolvedAt = FieldValue.serverTimestamp();
  }

  await adminDb.collection("supportTickets").doc(body.ticketId).set(payload, { merge: true });
  return NextResponse.json({ ok: true });
}
