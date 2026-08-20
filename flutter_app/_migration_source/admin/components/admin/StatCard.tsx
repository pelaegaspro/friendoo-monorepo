interface StatCardProps {
  label: string
  value: string
  helper?: string
}

export default function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#2b2b2b] bg-[#222222] p-5">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-zinc-500">{helper}</p> : null}
    </div>
  )
}
