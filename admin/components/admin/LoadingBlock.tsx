export default function LoadingBlock({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-2xl border border-[#2b2b2b] bg-[#202020]"
        />
      ))}
    </div>
  )
}
