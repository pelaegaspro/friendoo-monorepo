"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import SectionCard from "@/components/admin/SectionCard";
import LoadingBlock from "@/components/admin/LoadingBlock";
import { adminFetch } from "@/lib/admin/client";
import { CheckCircle2, AlertCircle, Lock, ShieldCheck, Zap } from "lucide-react";

interface PayoutSettingsState {
  environment: "sandbox" | "production";
  minWithdrawalInr: number;
  hostSalaryRate: number;
  autoPayoutEnabled: boolean;
  defaultTransferMode: "upi" | "banktransfer";
  payoutClientId: string;
  payoutClientSecret: string;
  pgAppId: string;
  pgSecretKey: string;
  isConfigured: boolean;
}

const defaultState: PayoutSettingsState = {
  environment: "sandbox",
  minWithdrawalInr: 100,
  hostSalaryRate: 3,
  autoPayoutEnabled: false,
  defaultTransferMode: "upi",
  payoutClientId: "",
  payoutClientSecret: "",
  pgAppId: "",
  pgSecretKey: "",
  isConfigured: false,
};

export default function PayoutSettingsPage() {
  const [settings, setSettings] = useState<PayoutSettingsState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<Partial<PayoutSettingsState>>("/api/admin/settings/payouts");
      setSettings((prev) => ({
        ...prev,
        ...data,
        payoutClientSecret: "", // Never echo secret
        pgSecretKey: "",
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load payout settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/settings/payouts", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      toast.success("Payout & Cashfree configuration saved!");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <form onSubmit={save} className="space-y-6">
          <SectionCard
            title="Payout Configuration"
            description="Global settings for host salaries and automated Cashfree payouts."
          >
            <div className="grid gap-6 py-4">
              {/* Status Header */}
              <div className="flex items-center justify-between rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4 text-sm">
                <div className="flex items-center gap-3">
                  {settings.isConfigured ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                      <ShieldCheck size={20} />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <AlertCircle size={20} />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-zinc-200">
                      Cashfree Integration:{" "}
                      <span className={settings.isConfigured ? "text-green-400" : "text-amber-400"}>
                        {settings.isConfigured ? "Configured & Active" : "Requires Credentials"}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      Mode: <span className="uppercase font-mono text-purple-300">{settings.environment}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
                    <Zap size={12} />
                    Auto-Disbursals
                  </span>
                </div>
              </div>

              {/* Host Salary & Thresholds */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Host Salary Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={settings.hostSalaryRate}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, hostSalaryRate: Number(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-[#343434] bg-[#111111] py-2 pl-7 pr-16 text-sm text-zinc-200 outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">/ minute</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Minimum Withdrawal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={settings.minWithdrawalInr}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, minWithdrawalInr: Number(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-[#343434] bg-[#111111] py-2 pl-7 pr-4 text-sm text-zinc-200 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Mode & Environment */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Default Transfer Mode
                  </label>
                  <select
                    value={settings.defaultTransferMode}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaultTransferMode: e.target.value as "upi" | "banktransfer",
                      }))
                    }
                    className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
                  >
                    <option value="upi">UPI (Instant VPA Transfer)</option>
                    <option value="banktransfer">Bank Transfer (IMPS / NEFT)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Cashfree Environment
                  </label>
                  <select
                    value={settings.environment}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        environment: e.target.value as "sandbox" | "production",
                      }))
                    }
                    className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
                  >
                    <option value="sandbox">Sandbox (Test Transfers)</option>
                    <option value="production">Production (Real Bank Movement)</option>
                  </select>
                </div>
              </div>

              {/* Cashfree Credentials */}
              <div className="border-t border-[#222222] pt-6 space-y-4">
                <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Lock size={16} className="text-purple-400" />
                  Cashfree Payouts API Credentials
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Payout Client ID / App ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CF103131..."
                      value={settings.payoutClientId}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, payoutClientId: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Payout Client Secret
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing"
                      value={settings.payoutClientSecret}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, payoutClientSecret: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  Credentials can be obtained from your{" "}
                  <a
                    href="https://merchant.cashfree.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    Cashfree Merchant Dashboard
                  </a>{" "}
                  under Payouts → Developers → API Keys.
                </p>
              </div>

              {/* Webhook URLs */}
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4 text-xs space-y-2">
                <p className="font-semibold text-zinc-300">Registered Webhook Endpoints</p>
                <div className="space-y-1 font-mono text-zinc-400">
                  <div>
                    <span className="text-purple-300">Payout Webhook:</span>{" "}
                    <code>https://gjbhsogarwqkkftzijhf.supabase.co/functions/v1/cashfree-payout-webhook</code>
                  </div>
                  <div>
                    <span className="text-purple-300">Payment In Webhook:</span>{" "}
                    <code>https://gjbhsogarwqkkftzijhf.supabase.co/functions/v1/cashfree-webhook</code>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-purple-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Payout Settings"}
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          </SectionCard>
        </form>
      )}
    </div>
  );
}
