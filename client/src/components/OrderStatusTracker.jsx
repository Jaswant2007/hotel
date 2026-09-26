const STEPS = [
  { id: 'placed', label: 'Placed', emoji: '📝' },
  { id: 'confirmed', label: 'Confirmed', emoji: '✅' },
  { id: 'preparing', label: 'Preparing', emoji: '🍳' },
  { id: 'out_for_delivery', label: 'Out for Delivery', emoji: '🛵' },
  { id: 'delivered', label: 'Delivered', emoji: '🎉' },
]

export default function OrderStatusTracker({ status, isPickup }) {
  const idx = STEPS.findIndex((s) => s.id === status)
  const steps = isPickup ? STEPS.filter((s) => s.id !== 'out_for_delivery') : STEPS
  const cur = isPickup && status === 'out_for_delivery' ? steps.length - 1 : Math.max(0, idx)

  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i <= cur
        const active = i === cur
        return (
          <li key={s.id} className={`flex-1 ${i === 0 ? 'items-start text-left' : i === steps.length - 1 ? 'items-end text-right' : 'items-center text-center'} flex flex-col`}>
            <div className="flex w-full items-center">
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${
                  done ? 'bg-brand-600 text-white shadow-pop' : 'border-2 border-stone-200 bg-white text-stone-400'
                } ${active ? 'ring-4 ring-brand-100 animate-pulse-soft' : ''}`}
              >
                {done ? s.emoji : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-1 flex-1 ${i < cur ? 'bg-brand-500' : 'bg-stone-200'}`} />
              )}
            </div>
            <span className={`mt-2 max-w-[86px] text-[11px] font-bold leading-tight sm:text-xs ${done ? 'text-brand-700' : 'text-stone-400'}`}>
              {s.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export { STEPS }
