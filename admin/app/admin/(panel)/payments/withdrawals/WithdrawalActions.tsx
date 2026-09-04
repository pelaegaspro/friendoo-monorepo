"use client";

import { useState } from "react";
import {
  approveAndDispatchCashfreePayout,
  approveWithdrawal,
  rejectWithdrawal,
  syncCashfreePayoutStatus,
} from "@/lib/actions/payoutActions";
import { toast } from "react-hot-toast";
import { Zap, CheckCircle, XCircle, RefreshCw, Loader2, Check } from "lucide-react";
import type { WithdrawalRecord } from "@/lib/admin/types";

export function WithdrawalActions({ withdrawal }: { withdrawal: WithdrawalRecord }) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  // Cashfree Automated Payout Dispatch
  const handleCashfreePayout = async () => {
    if (
      !confirm(
        `Initiate automated Cashfree payout of ₹${withdrawal.amount} to UPI/Bank (${withdrawal.upiId})?`
      )
    ) {
      return;
    }

    setLoading(true);
    setActionType("cashfree");
    try {
      const res = await approveAndDispatchCashfreePayout(withdrawal.hostId, withdrawal.id);
      if (res.success) {
        toast.success(res.message || "Payout dispatched via Cashfree!");
      } else {
        toast.error(res.error || "Failed to dispatch Cashfree transfer");
      }
    } catch {
      toast.error("An unexpected error occurred during Cashfree dispatch");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Manual Offline Settlement
  const handleManualSettle = async () => {
    const utr = prompt(
      `Mark withdrawal of ₹${withdrawal.amount} as paid manually.\n\nEnter Bank UTR / Transaction Reference ID (optional):`,
      ""
    try {
      const res = await approveWithdrawal(
        withdrawal.hostId,
        withdrawal.id,
        utr.trim() ? `Manual transfer (UTR: ${utr.trim()})` : "Marked paid manually by admin",
        utr.trim()
      );
      if (res.success) {
        toast.error(res.error || "Failed to settle payout");
      }
    } catch {
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Sync Cashfree Status
  const handleSyncStatus = async () => {
    setLoading(true);
    setActionType("sync");
    try {
      const res = await syncCashfreePayoutStatus(withdrawal.id);
      if (res.success) {
        toast.success(res.message || "Status synced with Cashfree");
      } else {
        toast.error(res.error || "Failed to sync status");
      }
    } catch {
      toast.error("Error communicating with Cashfree");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Reject Withdrawal
  const handleReject = async () => {
    const reason = prompt("Enter reason for rejection:");
    if (reason === null) return;

    setLoading(true);
    setActionType("reject");
    try {
      const res = await rejectWithdrawal(
        withdrawal.hostId,
        withdrawal.id,
        reason || "Rejected by admin"
      );
      if (res.success) {
        toast.success("Withdrawal rejected and balance restored");
      } else {
        toast.error(res.error || "Failed to reject request");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  if (withdrawal.status === "processing") {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleSyncStatus}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50"
          title="Re-query Cashfree for updated bank transfer status"
        >
          {loading && actionType === "sync" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Sync Cashfree
        </button>
      </div>
    );
  }

  if (withdrawal.status === "paid" || withdrawal.status === "completed") {
    return (
      <div className="flex items-center justify-end gap-1.5 text-xs text-green-400 font-medium">
        <Check size={14} />
        <span>Settled</span>
      </div>
    );
  }

  if (withdrawal.status !== "pending") {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Automated Cashfree Payout */}
      <button
        onClick={handleCashfreePayout}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg bg-purple-500/20 px-2.5 py-1.5 text-xs font-bold text-purple-300 transition hover:bg-purple-500/30 disabled:opacity-50"
        title="Execute direct transfer via Cashfree Payouts API"
      >
        {loading && actionType === "cashfree" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Zap size={13} className="text-purple-400" />
        )}
        Pay via Cashfree
      </button>

      {/* Manual Settlement */}
      <button
        onClick={handleManualSettle}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-500 transition hover:bg-green-500/20 disabled:opacity-50"
        title="Mark as paid manually without gateway transfer"
      >
        {loading && actionType === "manual" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <CheckCircle size={13} />
        )}
        Manual
      </button>

      {/* Reject */}
      <button
        onClick={handleReject}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
        title="Reject and refund host balance"
      >
        {loading && actionType === "reject" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <XCircle size={13} />
        )}
      </button>
    </div>
  );
}
