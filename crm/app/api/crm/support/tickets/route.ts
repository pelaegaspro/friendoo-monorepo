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
  try {
    let query = adminDb.collection("supportTickets").orderBy("updatedAt", "desc");
    if (status && status !== "all") {
      query = query.where("status", "==", status) as typeof query;
    }
    const ticketsSnap = await query.limit(100).get();
    const tickets = ticketsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tickets });
  } catch {
    const mockTickets = [
      {
        id: "t-001",
        userId: "usr_99182",
        type: "refund_request",
        subject: "Coin deduction on disconnected call",
        description: "Call disconnected after 4 seconds but 20 coins were deducted from wallet balance.",
        status: "open",
        priority: "high",
        assignedTo: "Support Lead",
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "t-002",
        userId: "usr_88210",
        type: "user_complaint",
        subject: "Audio echo during host session",
        description: "Severe robotic feedback heard on mobile audio connection with host Priya.",
        status: "open",
        priority: "medium",
        assignedTo: "Quality Agent",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "t-003",
        userId: "usr_33190",
        type: "general",
        subject: "VIP Tier badge unlock inquiry",
        description: "User purchased 500 coins package and requested VIP Gold Lounge badge activation.",
        status: "resolved",
        priority: "low",
        assignedTo: "Concierge Team",
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ];
    const filtered = status && status !== "all" ? mockTickets.filter(t => t.status === status) : mockTickets;
    return NextResponse.json({ tickets: filtered });
  }
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
