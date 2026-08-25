import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AddCoinsBody {
  uid: string;
  amount: number;
  reason?: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await parseJsonBody<AddCoinsBody>(request);
    const uid = body.uid;
    const amount = Math.max(0, Math.floor(toNumber(body.amount)));
    if (!uid || amount <= 0) {
      return NextResponse.json({ error: "uid and positive amount are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, coin_balance")
      .eq("user_id", uid)
      .maybeSingle();

    const before = toNumber(wallet?.coin_balance, 0);
    const after = before + amount;

    await supabase.from("wallets").upsert({
      user_id: uid,
      coin_balance: after,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("wallet_transactions").insert({
      user_id: uid,
      type: "bonus",
      coin_amount: amount,
      balance_after: after,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, balanceAfter: after });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to add coins" }, { status: 500 });
  }
}
