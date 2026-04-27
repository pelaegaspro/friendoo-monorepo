import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/app/api/crm/_utils";
import { getSegmentedUsers } from "@/lib/crmData";
import { SegmentKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const allowedSegments = new Set<SegmentKey>([
  "all",
  "new_user",
  "low_balance",
  "vip",
  "inactive",
  "first_call",
  "at_risk",
  "custom",
]);

export async function GET(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  const segmentQuery = request.nextUrl.searchParams.get("segment") ?? "all";
  const segment = allowedSegments.has(segmentQuery as SegmentKey)
    ? (segmentQuery as SegmentKey)
    : "all";
  const customFilterRaw = request.nextUrl.searchParams.get("customFilter");
  let customFilter: unknown = undefined;
  if (customFilterRaw) {
    try {
      customFilter = JSON.parse(customFilterRaw);
    } catch {
      return NextResponse.json({ error: "Invalid customFilter JSON." }, { status: 400 });
    }
  }

  const users = await getSegmentedUsers(segment, customFilter);
  return NextResponse.json({ users, count: users.length });
}
