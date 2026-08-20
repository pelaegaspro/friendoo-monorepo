import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

interface CreateCampaignBody {
  name: string;
  type: "push" | "inapp" | "both";
  segment: string;
  customFilter?: Record<string, unknown>;
  title: string;
  body: string;
  scheduledAt?: string | null;
  createdBy?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const body = await parseJsonBody<CreateCampaignBody>(request);
  if (!body.name || !body.type || !body.segment || !body.title || !body.body) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const campaignRef = await adminDb.collection("campaigns").add({
    name: body.name,
    type: body.type,
    segment: body.segment,
    customFilter: body.customFilter || null,
    title: body.title,
    body: body.body,
    status: body.scheduledAt ? "scheduled" : "draft",
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    sentAt: null,
    targetCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: body.createdBy || "admin",
  });

  return NextResponse.json({ ok: true, campaignId: campaignRef.id });
}
