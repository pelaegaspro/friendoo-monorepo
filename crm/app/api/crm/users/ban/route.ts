import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

interface BanBody {
  uid: string;
  banned: boolean;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const { uid, banned } = await parseJsonBody<BanBody>(request);
    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: Boolean(banned),
        updated_at: new Date().toISOString(),
      })
      .eq("id", uid);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update ban status" }, { status: 500 });
  }
}
