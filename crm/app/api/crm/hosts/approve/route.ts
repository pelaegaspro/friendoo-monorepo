import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

interface ApproveBody {
  applicationId: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const { applicationId } = await parseJsonBody<ApproveBody>(request);
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
  }

  const applicationRef = adminDb.collection("hostApplications").doc(applicationId);
  const applicationDoc = await applicationRef.get();
  if (!applicationDoc.exists) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const application = applicationDoc.data() as Record<string, unknown>;
  const phone = String(application.phone || "");
  let uid = String(application.userId || "");

  if (!uid) {
    const createdUser = await adminAuth.createUser({
      phoneNumber: phone || undefined,
      displayName: String(application.name || "Friendoo Host"),
      disabled: false,
    });
    uid = createdUser.uid;
  }

  await adminDb.collection("users").doc(uid).set(
    {
      displayName: application.name || "Friendoo Host",
      phone,
      city: application.city || null,
      languages: application.languages || [],
      photos: application.photos || [],
      isHost: true,
      hostStatus: "approved",
      onboardingComplete: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await applicationRef.update({
    userId: uid,
    status: "approved",
    reviewedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, uid });
}
