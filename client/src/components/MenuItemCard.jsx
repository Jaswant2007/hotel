import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function VegBadge({ isVeg }) {
  return (
    <span
      className={`chip border ${isVeg ? 'border-leaf-600 text-leaf-700 bg-leaf-50' : 'border-red-600 text-red-700 bg-red-50'}`}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" />
        <circle cx="5" cy="5" r="2.6" fill="currentColor" />
      </svg>
      {isVeg ? 'VEG' : 'NON-VEG'}
    </span>
  )
}

export function QtyStepper({ qty, onInc, onDec, small = false }) {
  const pad = small ? 'h-7 w-7 text-sm' : 'h-8 w-8 text-base'
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50">
      <button onClick={onDec} className={`${pad} grid place-items-center rounded-full font-bold text-brand-700 hover:bg-brand-100`} aria-label="Decrease quantity">
        −
      </button>
      <span className={`${small ? 'w-5' : 'w-6'} text-center text-sm font-bold text-brand-800`}>{qty}</span>
      <button onClick={onInc} className={`${pad} grid place-items-center rounded-full font-bold text-brand-700 hover:bg-brand-100`} aria-label="Increase quantity">
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

  const add = () => {
    if (!user) {
      navigate('/login', { state: { from: '/menu' } })
      return
    }
    addItem(item, 1)
  }

  return (
    <article className="card group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={item.image || '/images/dishes/meals.jpg'}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute left-2 top-2">
          <VegBadge isVeg={item.isVeg} />
        </div>
        {item.isPopular && (
          <span className="chip absolute right-2 top-2 bg-amber-400 text-amber-950">★ Popular</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-snug text-ink">{item.name}</h3>
          <span className="whitespace-nowrap font-display text-lg font-extrabold text-brand-700">
            ₹{item.price}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-500">{item.description}</p>

        <div className="mt-3 flex items-center justify-between">
          {qty === 0 ? (
            <button onClick={add} className="btn-primary w-full">
              Add to Cart
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <QtyStepper qty={qty} onDec={() => setQty(item._id, qty - 1)} onInc={() => setQty(item._id, qty + 1)} />
              <button onClick={() => navigate('/cart')} className="btn-dark text-xs">
                View Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
