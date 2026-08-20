import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

interface CreateTicketBody {
  userId: string;
  hostId?: string;
  type: "user_complaint" | "host_complaint" | "refund_request" | "general";
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  flaggedUserId?: string;
}

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const status = request.nextUrl.searchParams.get("status");
  let query = adminDb.collection("supportTickets").orderBy("updatedAt", "desc");
  if (status && status !== "all") {
    query = query.where("status", "==", status) as typeof query;
  }
  const ticketsSnap = await query.limit(100).get();
  const tickets = ticketsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<CreateTicketBody>(request);
  if (!body.userId || !body.subject?.trim()) {
    return NextResponse.json({ error: "userId and subject are required." }, { status: 400 });
  }

  const ticketRef = await adminDb.collection("supportTickets").add({
    userId: body.userId,
    hostId: body.hostId || null,
    type: body.type,
    subject: body.subject,
    description: body.description || "",
    status: "open",
    priority: body.priority || "medium",
    assignedTo: body.assignedTo || "",
    flaggedUserId: body.flaggedUserId || null,
    messages: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
  });

  return NextResponse.json({ ok: true, ticketId: ticketRef.id });
}
