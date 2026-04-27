import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const campaignsSnap = await adminDb.collection("campaigns").orderBy("createdAt", "desc").limit(100).get();
  const campaigns = campaignsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ campaigns });
}
