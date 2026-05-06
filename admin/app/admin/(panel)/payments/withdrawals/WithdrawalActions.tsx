"use client";

import { useState } from "react";
import { approveWithdrawal, rejectWithdrawal } from "@/lib/actions/payoutActions";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function WithdrawalActions({ withdrawal }: { withdrawal: any }) {
  const [loading, setLoading] = useState(false);

  if (withdrawal.status !== "pending") return null;

  const handleApprove = async () => {
    if (!confirm(`Approve payout of ₹${withdrawal.amount} to verified UPI?`)) return;
    
    setLoading(true);
    try {
      const res = await approveWithdrawal(withdrawal.hostId, withdrawal.id);
      if (res.success) {
        toast.success("Payout processed successfully!");
      } else {
        toast.error(res.error || "Failed to process payout");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter reason for rejection:");
    if (reason === null) return;
    
    setLoading(true);
    try {
      const res = await rejectWithdrawal(withdrawal.hostId, withdrawal.id, reason || "Rejected by admin");
      if (res.success) {
        toast.success("Request rejected");
      } else {
        toast.error(res.error || "Failed to reject request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-500 transition hover:bg-green-500/20 disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
      >
        <XCircle size={14} />
        Reject
      </button>
    </div>
  );
}
