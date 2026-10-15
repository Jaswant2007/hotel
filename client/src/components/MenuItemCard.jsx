import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function VegBadge({ isVeg }) {
  return (
    <span
      className={`chip border backdrop-blur-md shadow-sm ${
        isVeg
          ? 'border-leaf-600/70 text-leaf-800 bg-leaf-50/90'
          : 'border-red-600/70 text-red-800 bg-red-50/90'
      }`}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="5" cy="5" r="2.2" fill="currentColor" />
      </svg>
      <span className="text-[10px] tracking-wider">{isVeg ? 'VEG' : 'NON-VEG'}</span>
    </span>
  )
}

export function QtyStepper({ qty, onInc, onDec, small = false }) {
  const pad = small ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-stone-200/80 bg-stone-100/90 p-0.5 shadow-inner">
      <button
        onClick={onDec}
        className={`${pad} grid place-items-center rounded-full font-bold text-stone-700 hover:bg-white active:scale-90 transition-all`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className={`${small ? 'w-5' : 'w-7'} text-center text-xs font-bold text-ink tabular-nums`}>
        {qty}
      </span>
      <button
        onClick={onInc}
        className={`${pad} grid place-items-center rounded-full font-bold text-brand-700 hover:bg-white active:scale-90 transition-all`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export default function MenuItemCard({ item }) {
  const { qtyOf, addItem, setQty } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qty = qtyOf(item._id)

  const isNightItem = item.category === 'dinner'

  const add = () => {
    if (!isNightItem) return
    if (!user) {
      navigate('/login', { state: { from: '/menu' } })
      return
    }
    addItem(item, 1)
  }

  const slotLabel =
    item.category === 'morning'
      ? 'Morning Tiffin'
      : item.category === 'afternoon'
      ? 'Afternoon Feast'
      : 'Night Tiffin'

  return (
    <article className="group relative flex flex-col rounded-[2rem] p-1.5 sm:p-2 bg-stone-200/60 border border-stone-300/50 shadow-card hover:shadow-doppel transition-all duration-500 ease-fluid hover:-translate-y-1">
      {/* Inner Machined Core */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
        {/* Dish Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          <img
            src={item.image || '/images/dishes/meals.jpg'}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-fluid group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
          <div className="absolute left-3 top-3">
            <VegBadge isVeg={item.isVeg} />
          </div>
          
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
            {item.isPopular && (
              <span className="chip bg-amber-400 text-amber-950 shadow-sm backdrop-blur-md">
                ★ Chef’s Special
              </span>
            )}
            {!isNightItem && (
              <span className="chip bg-stone-900/85 text-stone-200 border border-stone-700/60 shadow-sm backdrop-blur-md">
                🔒 {item.category === 'morning' ? 'Morning Slot' : 'Afternoon Slot'}
              </span>
            )}
            {isNightItem && (
              <span className="chip bg-emerald-600/90 text-white border border-emerald-400/40 shadow-sm backdrop-blur-md">
                🟢 Orderable Now
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-ink group-hover:text-brand-700 transition-colors">
                {item.name}
              </h3>
              <p className="text-[11px] font-semibold text-stone-400 tracking-wide uppercase mt-0.5">
                {slotLabel}
              </p>
            </div>
            <span className="shrink-0 font-display text-xl font-bold tracking-tight text-brand-700 tabular-nums">
              ₹{item.price}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-stone-500">
            {item.description}
          </p>

          {/* Action Row */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
            {!isNightItem ? (
              <div
                title="Only Night Tiffin items can be ordered currently. Morning & Afternoon items are for price & menu preview."
                className="w-full flex items-center justify-between rounded-full bg-stone-100/90 border border-stone-200/80 px-3.5 py-2 text-xs text-stone-500 shadow-inner"
              >
                <span className="flex items-center gap-1.5 font-medium text-stone-500">
                  <svg className="w-3.5 h-3.5 text-stone-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span className="text-[11px]">Orders Closed</span>
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  Night Slot Only
                </span>
              </div>
            ) : qty === 0 ? (
              <button
                onClick={add}
                className="w-full inline-flex items-center justify-between rounded-full bg-brand-600 pl-5 pr-2.5 py-2 text-xs font-bold text-white shadow-pop hover:bg-brand-700 active:scale-[0.98] transition-all duration-300 ease-fluid group/btn"
              >
                <span>Add to Cart</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </button>
            ) : (
              <div className="flex w-full items-center justify-between gap-2">
                <QtyStepper qty={qty} onDec={() => setQty(item._id, qty - 1)} onInc={() => setQty(item._id, qty + 1)} />
                <button
                  onClick={() => navigate('/cart')}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition shadow-sm"
                >
                  View Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
