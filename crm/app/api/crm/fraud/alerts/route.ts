import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { sortAlerts } from "@/lib/fraudDetector";
import { FraudAlertRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const alertsSnap = await adminDb.collection("fraudAlerts").where("status", "==", "open").limit(100).get();
  const alerts = alertsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) } as FraudAlertRecord));

  return NextResponse.json({ alerts: sortAlerts(alerts) });
}
