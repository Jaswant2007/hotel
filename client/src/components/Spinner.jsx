export default function Spinner({ label = 'Loading…', full = false }) {
  const body = (
    <div className="flex flex-col items-center gap-3 text-stone-500">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
  if (full) return <div className="flex min-h-[40vh] items-center justify-center">{body}</div>
  return body
}
