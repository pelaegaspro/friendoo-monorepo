import { listWithdrawals } from "@/lib/admin/data";
import SectionCard from "@/components/admin/SectionCard";
import { formatDateTime } from "@/lib/admin/format";
import { WithdrawalActions } from "./WithdrawalActions";

export default async function WithdrawalsPage() {
  const withdrawals = await listWithdrawals();

  return (
    <div className="space-y-6">
      <SectionCard
        title="Withdrawal Requests"
        description="Review and process host payout requests via UPI."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#222222] text-zinc-500">
                <th className="pb-4 pt-2 font-medium">Host</th>
                <th className="pb-4 pt-2 font-medium">Amount</th>
                <th className="pb-4 pt-2 font-medium">UPI ID</th>
                <th className="pb-4 pt-2 font-medium">Status</th>
                <th className="pb-4 pt-2 font-medium">Requested At</th>
                <th className="pb-4 pt-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {withdrawals.map((item) => (
                <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium text-zinc-200">{item.hostName}</td>
                  <td className="py-4 text-zinc-300 font-bold">₹{item.amount}</td>
                  <td className="py-4 text-zinc-400 font-mono text-xs">{item.upiId}</td>
                  <td className="py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : item.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : item.status === "approved"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 text-zinc-500">
                    {item.requestedAt ? formatDateTime(item.requestedAt) : "N/A"}
                  </td>
                  <td className="py-4 text-right">
                    <WithdrawalActions withdrawal={item} />
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No withdrawal requests found.
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
export const dynamic = "force-dynamic";
