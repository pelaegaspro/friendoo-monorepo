import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { getOperationalAdminActorId, getSupabaseAdmin } from "@/lib/supabaseServer";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AddCoinsBody {
  uid: string;
  amount: number;
  reason?: string;
  idempotencyKey?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await parseJsonBody<AddCoinsBody>(request);
    const uid = body.uid;
    const amount = Math.max(0, Math.floor(toNumber(body.amount)));
    const reason = body.reason?.trim() || "CRM manual credit";
    const idempotencyKey = body.idempotencyKey?.trim();
    if (!uid || amount <= 0 || !idempotencyKey) {
      return NextResponse.json({ error: "uid, positive amount, and idempotencyKey are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: newBalance, error } = await supabase.rpc("admin_adjust_wallet", {
      p_actor_id: getOperationalAdminActorId(),
      p_user_id: uid,
      p_coin_delta: amount,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, balanceAfter: newBalance });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to add coins" }, { status: 500 });
  }
}
