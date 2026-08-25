"use server"

import { getSupabaseAdmin, getOperationalAdminActorId } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

/**
 * Approves a withdrawal and records the completed payout in Supabase.
 */
export async function approveWithdrawal(hostId: string, payoutId: string, adminNote: string = "") {
  try {
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    const { data: payout, error: pError } = await supabase
      .from('host_payouts')
      .select('*')
      .eq('id', payoutId)
      .maybeSingle();

    if (pError) throw pError;
    if (!payout) throw new Error("Payout request not found");
    if (payout.status !== 'pending') throw new Error("Only pending requests can be approved");

    const { error: updateError } = await supabase
      .from('host_payouts')
      .update({
        status: 'paid',
        review_note: adminNote,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    if (updateError) throw updateError;

    revalidatePath("/admin/payments/withdrawals");
    return { success: true };
  } catch (error: any) {
    console.error("Payout error:", error);
    return { success: false, error: error.message || 'Failed to approve payout' };
  }
}

export async function rejectWithdrawal(hostId: string, payoutId: string, reason: string) {
  try {
    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    const { error } = await supabase
      .from('host_payouts')
      .update({
        status: 'cancelled',
        failure_reason: reason,
        review_note: reason,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    if (error) throw error;

    revalidatePath("/admin/payments/withdrawals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reject payout' };
  }
}
