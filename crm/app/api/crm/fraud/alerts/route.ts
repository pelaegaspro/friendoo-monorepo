import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";
import { sortAlerts } from "@/lib/fraudDetector";
import { FraudAlertRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const alertsSnap = await adminDb.collection("fraudAlerts").where("status", "==", "open").limit(100).get();
    const alerts = alertsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) } as FraudAlertRecord));
    return NextResponse.json({ alerts: sortAlerts(alerts) });
  } catch {
    const mockAlerts: FraudAlertRecord[] = [
      {
        id: "fl-01",
        severity: "urgent",
        userId: "usr_99182",
        type: "Velocity Topup Spike",
        description: "3 rapid wallet topups completed within 90 seconds (Total: ₹4,500).",
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        status: "open",
      },
      {
        id: "fl-02",
        severity: "high",
        userId: "usr_88210",
        type: "Geographic IP Mismatch",
        description: "Login location shifted from Mumbai to Singapore within 4 minutes.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: "open",
      },
      {
        id: "fl-03",
        severity: "medium",
        userId: "usr_33190",
        type: "Repeated Short Call Disconnects",
        description: "User disconnected 8 consecutive calls under 6 seconds with different hosts.",
        createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        status: "open",
      },
    ];
    return NextResponse.json({ alerts: mockAlerts });
  }
}
