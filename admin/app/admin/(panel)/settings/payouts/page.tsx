import { SectionCard } from "@/components/admin/SectionCard";

export default function PayoutSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Payout Configuration"
        description="Global settings for host salaries and Cashfree payouts."
      >
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase">Host Salary Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full rounded-xl border border-[#343434] bg-[#111111] py-2 pl-7 pr-4 text-sm text-zinc-200 outline-none focus:border-purple-500"
                />
                <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">/ minute</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase">Minimum Withdrawal</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                <input
                  type="number"
                  defaultValue={100}
                  className="w-full rounded-xl border border-[#343434] bg-[#111111] py-2 pl-7 pr-4 text-sm text-zinc-200 outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#222222] pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-300">Cashfree Payouts Config</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase">Transfer Mode</label>
                <select className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500 appearance-none">
                  <option value="upi">UPI (Direct Transfer)</option>
                  <option value="banktransfer">Bank Transfer (IMPS/NEFT)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase">Environment</label>
                <select className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500 appearance-none">
                  <option value="TEST">TEST (Sandbox)</option>
                  <option value="PRODUCTION">PRODUCTION (Live)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button className="rounded-xl bg-purple-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-purple-400">
              Save Payout Settings
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
