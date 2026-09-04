import { listWithdrawals } from "@/lib/admin/data";
import SectionCard from "@/components/admin/SectionCard";
import { formatDateTime } from "@/lib/admin/format";
import { WithdrawalActions } from "./WithdrawalActions";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const withdrawals = await listWithdrawals();

  return (
    <div className="space-y-6">
      <SectionCard
        title="Host Withdrawal Requests"
        description="Review and disburse host earnings via automated Cashfree Payouts or manual settlement."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#222222] text-zinc-500">
                <th className="pb-4 pt-2 font-medium">Host</th>
                <th className="pb-4 pt-2 font-medium">Amount</th>
                <th className="pb-4 pt-2 font-medium">Transfer Target</th>
                <th className="pb-4 pt-2 font-medium">Status</th>
                <th className="pb-4 pt-2 font-medium">Disbursal Route</th>
                <th className="pb-4 pt-2 font-medium">Requested At</th>
                <th className="pb-4 pt-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {withdrawals.map((item) => (
                <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium text-zinc-200">{item.hostName}</td>
                  <td className="py-4 text-zinc-200 font-bold">₹{item.amount}</td>
                  <td className="py-4 text-zinc-400 font-mono text-xs">
                    {item.upiId}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "paid" || item.status === "completed"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : item.status === "processing"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"
                          : item.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : item.status === "approved"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.failureReason && (
                      <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={item.failureReason}>
                        {item.failureReason}
                      </p>
                    )}
                  </td>
                  <td className="py-4">
                    {item.provider === "cashfree" ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                          Cashfree Payouts
                        </span>
                        {item.cashfreeReferenceId && (
                          <p className="font-mono text-[10px] text-zinc-500 truncate max-w-[120px]" title={item.cashfreeReferenceId}>
                            Ref: {item.cashfreeReferenceId}
                          </p>
                        )}
                      </div>
                    ) : item.provider === "manual_admin" ? (
                      <span className="text-xs text-zinc-400">Manual Transfer</span>
                    ) : (
                      <span className="text-xs text-zinc-600">Pending Review</span>
                    )}
                  </td>
                  <td className="py-4 text-zinc-500 text-xs">
                    {item.requestedAt ? formatDateTime(item.requestedAt) : "N/A"}
                  </td>
                  <td className="py-4 text-right">
                    <WithdrawalActions withdrawal={item} />
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
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
