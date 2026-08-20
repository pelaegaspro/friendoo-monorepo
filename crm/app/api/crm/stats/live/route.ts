import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { getDashboardData } from "@/lib/crmData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const payload = await getDashboardData();
  return NextResponse.json({
    ...payload,
    totalUsers: payload.kpis.totalUsers,
    totalHosts: payload.kpis.totalHosts,
    activeCalls: payload.kpis.activeCalls,
    onlineHosts: payload.kpis.onlineHosts,
    todayRevenue: payload.kpis.todayRevenue,
    openTickets: payload.kpis.openTickets,
    pendingApplications: payload.kpis.pendingApplications,
    coinsInCirculation: payload.kpis.coinsInCirculation,
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
