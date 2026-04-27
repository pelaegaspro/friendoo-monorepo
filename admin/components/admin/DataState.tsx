interface DataStateProps {
  title: string
  body: string
}

export default function DataState({ title, body }: DataStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[#343434] bg-[#141414] px-6 py-12 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-400">{body}</p>
    </div>
  )
}
