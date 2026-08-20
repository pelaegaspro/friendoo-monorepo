import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } },
) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const ticketDoc = await adminDb.collection("supportTickets").doc(params.ticketId).get();
  if (!ticketDoc.exists) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const ticket = { id: ticketDoc.id, ...ticketDoc.data() };
  return NextResponse.json({ ticket });
}
