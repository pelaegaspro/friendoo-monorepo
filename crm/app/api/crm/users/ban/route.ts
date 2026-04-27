import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

interface BanBody {
  uid: string;
  banned: boolean;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const { uid, banned } = await parseJsonBody<BanBody>(request);
  if (!uid) {
    return NextResponse.json({ error: "uid is required." }, { status: 400 });
  }

  await adminDb.collection("users").doc(uid).set(
    {
      isBanned: Boolean(banned),
      updatedAt: new Date(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}
