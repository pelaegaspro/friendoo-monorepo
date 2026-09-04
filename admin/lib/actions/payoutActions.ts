"use server"

import { cookies } from "next/headers";
import { getSupabaseAdmin, getOperationalAdminActorId } from "@/lib/supabaseServer";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin/session";
import { revalidatePath } from "next/cache";
import {
  createCashfreePayoutTransfer,
  getCashfreePayoutTransfer,
} from "@/lib/cashfree/payouts";

async function hasAuthorizedAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Dispatches automated real money payout to host via Cashfree Payouts API.
 */
export async function approveAndDispatchCashfreePayout(hostId: string, payoutId: string) {
  try {
    if (!(await hasAuthorizedAdminSession())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    // 1. Fetch payout record and host profile
    const { data: payout, error: fetchError } = await supabase
      .from("host_payouts")
      .select(`
        id,
        host_id,
        amount_inr,
        amount_paise,
        status,
        payout_method_type,
        payout_details,
        hosts (
          profiles (
            display_name,
            phone
          )
        )
      `)
      .eq("id", payoutId)
      .single();

    if (fetchError || !payout) {
      return { success: false, error: "Payout request not found" };
    }

    if (payout.status !== "pending" && payout.status !== "processing") {
      return { success: false, error: `Cannot process payout in status '${payout.status}'` };
    }

    // 2. Transition state to 'processing' if still pending
    if (payout.status === "pending") {
      const { error: reviewError } = await supabase.rpc("admin_review_host_payout", {
        p_actor_id: actorId,
        p_payout_id: payoutId,
        p_decision: "approved",
        p_note: "Approved for Cashfree automated transfer",
      });

      if (reviewError) throw reviewError;
    }

    // 3. Extract beneficiary details
    const h = Array.isArray(payout.hosts) ? payout.hosts[0] : payout.hosts;
    const pr = Array.isArray(h?.profiles) ? h?.profiles[0] : h?.profiles;
    const displayName = (pr?.display_name as string) || "Friendoo Host";
    const phone = (pr?.phone as string) || "9999999999";
    const details = (payout.payout_details as Record<string, unknown>) ?? {};

    const transferMode = payout.payout_method_type === "bank_account" ? "banktransfer" : "upi";
    const vpa = (details.upi_id || details.upiId || details.vpa) as string | undefined;
    const bankAccountNumber = (details.account_number || details.accountNumber) as string | undefined;
    const ifsc = (details.ifsc || details.ifscCode) as string | undefined;

    const transferId = `cf_payout_${payoutId.replace(/-/g, "").slice(0, 30)}`;

    // 4. Call Cashfree Payouts API
    const transferResult = await createCashfreePayoutTransfer({
      transferId,
      amountInr: Number(payout.amount_inr),
      transferMode,
      beneficiary: {
        name: displayName,
        phone,
        vpa,
        bankAccountNumber,
        ifsc,
      },
      remarks: `Friendoo Host Payout #${payoutId.slice(0, 8)}`,
    });

    if (transferResult.status === "SUCCESS") {
      // Instant Success: finalize as paid
      const { error: completeError } = await supabase.rpc("record_host_payout_provider_result", {
        p_payout_id: payoutId,
        p_success: true,
        p_provider: "cashfree",
        p_provider_transfer_id: transferResult.transferId,
        p_provider_reference_id: transferResult.referenceId || null,
        p_failure_reason: null,
      });

      if (completeError) throw completeError;

      revalidatePath("/admin/payments/withdrawals");
      return {
        success: true,
        status: "paid",
        message: `Payout of ₹${payout.amount_inr} successfully transferred via Cashfree (Ref: ${transferResult.referenceId || transferResult.transferId})`,
      };
    } else if (transferResult.status === "PENDING") {
      // Pending with bank: keep in processing and record provider transfer IDs
      await supabase
        .from("host_payouts")
        .update({
          provider: "cashfree",
          provider_transfer_id: transferResult.transferId,
          provider_reference_id: transferResult.referenceId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payoutId);

      revalidatePath("/admin/payments/withdrawals");
      return {
        success: true,
        status: "processing",
        message: "Payout dispatched to Cashfree. Currently processing with host's bank network.",
      };
    } else {
      // Failed / Rejected by Cashfree: safely refund host's ledger balance
      const { error: failError } = await supabase.rpc("record_host_payout_provider_result", {
        p_payout_id: payoutId,
        p_success: false,
        p_provider: "cashfree",
        p_provider_transfer_id: transferResult.transferId,
        p_provider_reference_id: transferResult.referenceId || null,
        p_failure_reason: transferResult.message || "Transfer rejected by Cashfree",
      });

      if (failError) throw failError;

      revalidatePath("/admin/payments/withdrawals");
      return {
        success: false,
        error: transferResult.message || "Cashfree transfer failed and balance was restored.",
      };
    }
  } catch (error) {
    console.error("approveAndDispatchCashfreePayout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute Cashfree transfer",
    };
  }
}

/**
 * Re-queries Cashfree Payout status for an in-flight transfer.
 */
export async function syncCashfreePayoutStatus(payoutId: string) {
  try {
    if (!(await hasAuthorizedAdminSession())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = getSupabaseAdmin();
    const { data: payout, error: fetchError } = await supabase
      .from("host_payouts")
      .select("id, status, provider_transfer_id")
      .eq("id", payoutId)
      .single();

    if (fetchError || !payout) {
      return { success: false, error: "Payout record not found" };
    }

    if (!payout.provider_transfer_id) {
      return { success: false, error: "No Cashfree transfer ID associated with this payout" };
    }

    const result = await getCashfreePayoutTransfer(payout.provider_transfer_id);

    if (result.status === "SUCCESS") {
      await supabase.rpc("record_host_payout_provider_result", {
        p_payout_id: payoutId,
        p_success: true,
        p_provider: "cashfree",
        p_provider_transfer_id: result.transferId,
        p_provider_reference_id: result.referenceId || null,
        p_failure_reason: null,
      });

      revalidatePath("/admin/payments/withdrawals");
      return { success: true, message: "Cashfree transfer confirmed as PAID" };
    } else if (result.status === "FAILED") {
      await supabase.rpc("record_host_payout_provider_result", {
        p_payout_id: payoutId,
        p_success: false,
        p_provider: "cashfree",
        p_provider_transfer_id: result.transferId,
        p_provider_reference_id: result.referenceId || null,
        p_failure_reason: result.message || "Cashfree transfer failed",
      });

      revalidatePath("/admin/payments/withdrawals");
      return { success: true, message: "Cashfree transfer FAILED. Host balance refunded." };
    } else {
      return { success: true, message: "Transfer is still pending in Cashfree network" };
    }
  } catch (error) {
    console.error("syncCashfreePayoutStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync status with Cashfree",
    };
  }
}

/**
 * Approves a withdrawal manually (offline bank transfer or ledger-only settlement).
 */
export async function approveWithdrawal(
  hostId: string,
  payoutId: string,
  adminNote: string = "",
  referenceId: string = ""
) {
  try {
    if (!(await hasAuthorizedAdminSession())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    // 1. Move from pending -> processing via authoritative RPC
    const { error: reviewError } = await supabase.rpc("admin_review_host_payout", {
      p_actor_id: actorId,
      p_payout_id: payoutId,
      p_decision: "approved",
      p_note: adminNote || (referenceId ? `Manual transfer (UTR: ${referenceId})` : "Approved manually by administrator"),
    });

    if (reviewError) throw reviewError;

    // 2. Record completion so pending_payout_paise is decremented and marked paid
    const { error: completeError } = await supabase.rpc("record_host_payout_provider_result", {
      p_payout_id: payoutId,
      p_success: true,
      p_provider: "manual_admin",
      p_provider_transfer_id: referenceId.trim() || null,
      p_provider_reference_id: referenceId.trim() || null,
      p_failure_reason: null,
    });

    if (completeError) throw completeError;

    revalidatePath("/admin/payments/withdrawals");
    return { success: true };
  } catch (error) {
    console.error("Payout manual approval error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve payout",
    };
  }
}

export async function rejectWithdrawal(hostId: string, payoutId: string, reason: string) {
  try {
    if (!(await hasAuthorizedAdminSession())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    // Rejection via authoritative RPC cancels payout and refunds available_paise
    const { error: rejectError } = await supabase.rpc("admin_review_host_payout", {
      p_actor_id: actorId,
      p_payout_id: payoutId,
      p_decision: "rejected",
      p_note: reason || "Rejected by administrator",
    });

    if (rejectError) throw rejectError;

    revalidatePath("/admin/payments/withdrawals");
    return { success: true };
  } catch (error) {
    console.error("Payout rejection error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject payout",
    };
  }
}
