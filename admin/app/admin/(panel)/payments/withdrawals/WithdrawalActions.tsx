"use client";

import { useState } from "react";
import {
  approveAndDispatchCashfreePayout,
  approveWithdrawal,
  rejectWithdrawal,
  syncCashfreePayoutStatus,
} from "@/lib/actions/payoutActions";
import { toast } from "react-hot-toast";
import {
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Check,
  QrCode,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import type { WithdrawalRecord } from "@/lib/admin/types";

export function WithdrawalActions({ withdrawal }: { withdrawal: WithdrawalRecord }) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hostName = withdrawal.hostName || "Host";
  const upiId = withdrawal.upiId || "";
  const amount = withdrawal.amount || 0;

  // Standard UPI URI format supported by all Indian UPI apps (PhonePe, GPay, Paytm, BHIM)
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    hostName
  )}&am=${amount}&cu=INR&tn=Friendoo%20Host%20Payout`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiUrl
  )}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Submit UPI / Manual Settlement
  const handleConfirmManualSettle = async () => {
    setLoading(true);
    setActionType("manual");
    try {
      const cleanUtr = utrNumber.trim();
      const note = cleanUtr
        ? `Direct UPI payout settled (UTR: ${cleanUtr})`
        : "Manual settlement confirmed by admin";

      const res = await approveWithdrawal(
        withdrawal.hostId,
        withdrawal.id,
        note,
        cleanUtr
      );

      if (res.success) {
        toast.success(`Withdrawal of ₹${amount} marked as paid!`);
        setIsUpiModalOpen(false);
        setUtrNumber("");
      } else {
        toast.error(res.error || "Failed to settle payout");
      }
    } catch {
      toast.error("An unexpected error occurred during manual settlement");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Automated Cashfree Payout
  const handleCashfreePayout = async () => {
    if (
      !confirm(
        `Initiate automated Cashfree payout of ₹${amount} to UPI/Bank (${upiId})?\n\n(Note: Requires active Cashfree business credentials)`
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
    const reason = prompt("Enter reason for rejection (refunds host balance):");
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
        toast.success("Withdrawal rejected and host balance restored");
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
          Sync Status
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
    <>
      <div className="flex items-center justify-end gap-2">
        {/* Primary Option: UPI Direct Pay / QR / UTR Settle (0% fee, No business needed) */}
        <button
          onClick={() => setIsUpiModalOpen(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
          title="Pay directly via UPI QR or Deeplink and enter UTR"
        >
          <QrCode size={14} className="text-emerald-400" />
          UPI Pay & Settle
        </button>

        {/* Automated Cashfree Payout */}
        <button
          onClick={handleCashfreePayout}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300 transition hover:bg-purple-500/30 disabled:opacity-50"
          title="Dispatch automated transfer via Cashfree API"
        >
          {loading && actionType === "cashfree" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Zap size={13} className="text-purple-400" />
          )}
          Cashfree Payout
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

      {/* UPI QR & Direct Pay Settlement Modal */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111a] p-6 shadow-2xl text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode size={18} className="text-emerald-400" />
                  UPI Payout Settlement
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  0% fee • Works with PhonePe, GPay, Paytm, BHIM
                </p>
              </div>
              <button
                onClick={() => setIsUpiModalOpen(false)}
                className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Host & Amount Info */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <span className="text-xs text-white/60">Payout Amount</span>
                <span className="text-lg font-black text-emerald-400">₹{amount}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="truncate mr-2">
                  <div className="text-[11px] text-white/50">Beneficiary UPI ID</div>
                  <div className="text-sm font-mono font-bold text-white truncate">
                    {upiId || "No UPI ID specified"}
                  </div>
                </div>
                {upiId && (
                  <button
                    onClick={() => copyToClipboard(upiId, "UPI ID")}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
                  >
                    {copiedField === "UPI ID" ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </button>
                )}
              </div>
            </div>

            {/* QR Code & Deeplink */}
            {upiId && (
              <div className="mt-4 flex flex-col items-center rounded-xl bg-white/5 p-4 border border-white/5">
                <div className="relative rounded-lg bg-white p-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payout QR"
                    width={180}
                    height={180}
                    className="h-44 w-44 rounded"
                  />
                </div>
                <p className="mt-2 text-[11px] text-white/50 text-center">
                  Scan with any UPI app on your phone to transfer ₹{amount} instantly
                </p>

                <a
                  href={upiUrl}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                >
                  <ExternalLink size={13} />
                  Launch UPI App Directly
                </a>
              </div>
            )}

            {/* UTR Input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Bank UTR / Transaction Reference ID
              </label>
              <input
                type="text"
                placeholder="e.g. 423984729183 (12-digit UPI reference)"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-white/40">
                Found in your UPI app payment receipt after transfer
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmManualSettle}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading && actionType === "manual" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
