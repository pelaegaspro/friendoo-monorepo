import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } },
) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const doc = await adminDb.collection("crmConfig").doc(params.docId).get();
  return NextResponse.json({
    id: params.docId,
    exists: doc.exists,
    data: doc.exists ? doc.data() : null,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { docId: string } },
) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<Record<string, unknown>>(request);
  await adminDb.collection("crmConfig").doc(params.docId).set(
    {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
