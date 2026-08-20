import { getHostEarnings, listWithdrawals } from "@/lib/admin/data";
import SectionCard from "@/components/admin/SectionCard";
import { formatDateTime } from "@/lib/admin/format";
import { IndianRupee, Clock, Wallet, TrendingUp } from "lucide-react";

export default async function HostEarningsPage({ params }: { params: { hostId: string } }) {
  const earnings = await getHostEarnings(params.hostId);
  const allWithdrawals = await listWithdrawals();
  const hostWithdrawals = allWithdrawals.filter((w) => w.hostId === params.hostId);

  if (!earnings) {
    return <div className="p-8 text-center text-zinc-500">No earnings record found for this host.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Lifetime Earnings"
          value={`₹${earnings.lifetimeEarnings}`}
          icon={<TrendingUp size={20} />}
          color="text-green-500"
        />
        <StatCard
          title="Available Balance"
          value={`₹${earnings.availableForWithdrawal}`}
          icon={<Wallet size={20} />}
          color="text-blue-500"
        />
        <StatCard
          title="Pending Payouts"
          value={`₹${earnings.pendingWithdrawal}`}
          icon={<Clock size={20} />}
          color="text-yellow-500"
        />
        <StatCard
          title="Total Minutes"
          value={`${earnings.totalCallMinutes} min`}
          icon={<IndianRupee size={20} />}
          color="text-purple-500"
        />
      </div>

      <SectionCard
        title="Withdrawal History"
        description="History of all payout requests from this host."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#222222] text-zinc-500">
                <th className="pb-4 pt-2 font-medium">Amount</th>
                <th className="pb-4 pt-2 font-medium">UPI ID</th>
                <th className="pb-4 pt-2 font-medium">Status</th>
                <th className="pb-4 pt-2 font-medium">Date</th>
                <th className="pb-4 pt-2 font-medium">Payout ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {hostWithdrawals.map((item) => (
                <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-bold text-zinc-200">₹{item.amount}</td>
                  <td className="py-4 text-zinc-400 font-mono text-xs">{item.upiId}</td>
                  <td className="py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : item.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 text-zinc-500">
                    {item.requestedAt ? formatDateTime(item.requestedAt) : "N/A"}
                  </td>
                  <td className="py-4 text-zinc-500 font-mono text-xs">
                    {item.cashfreeReferenceId || "—"}
                  </td>
                </tr>
              ))}
              {hostWithdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                    No withdrawal history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className={`${color} opacity-80`}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold text-zinc-100">{value}</div>
    </div>
  );
}
