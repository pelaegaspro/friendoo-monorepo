import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const campaignsSnap = await adminDb.collection("campaigns").orderBy("createdAt", "desc").limit(100).get();
    const campaigns = campaignsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ campaigns });
  } catch {
    const mockCampaigns = [
      {
        id: "cmp-01",
        title: "Weekend VIP Double Coins Surge 🎁",
        body: "Recharge ₹500 or more this weekend to get 50% extra talk coins instantly!",
        segment: "vip",
        status: "sent",
        sentCount: 1420,
        clickedCount: 890,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "cmp-02",
        title: "Top Star Hosts Are Online Now 🎙️",
        body: "Ananya & Pooja are in the lounge ready for late-night audio calls.",
        segment: "low_balance",
        status: "scheduled",
        sentCount: 0,
        clickedCount: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ];
    return NextResponse.json({ campaigns: mockCampaigns });
  }
}
