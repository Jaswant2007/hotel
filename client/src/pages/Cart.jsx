import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { QtyStepper } from '../components/MenuItemCard'

export default function Cart() {
  const { items, setQty, removeItem, subtotal, count } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const freeOver = 500
  const toFree = Math.max(0, freeOver - subtotal)

  const nonNightItems = items.filter((i) => i.menuItem?.category && i.menuItem?.category !== 'dinner')
  const hasRestrictedItems = nonNightItems.length > 0

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="doppel-shell p-2">
          <div className="doppel-core p-10 flex flex-col items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-4xl shadow-inner">🛒</div>
            <h1 className="mt-5 font-display text-3xl font-extrabold text-ink">Your cart is empty</h1>
            <p className="mt-2 text-sm text-stone-500">Explore hot Night Tiffins or view morning &amp; afternoon specialities.</p>
            <Link to="/menu" className="btn-island mt-6">
              <span>Browse Full Menu</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">↗</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-[0.2em] px-3 py-1">
          Review &amp; Checkout
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-ink">
          Your Cart <span className="text-stone-400 font-light text-2xl">({count} item{count > 1 ? 's' : ''})</span>
        </h1>
      </header>

      {hasRestrictedItems && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-950 text-sm">Notice: Night Slot Orders Only</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Hotel Sri Vari currently accepts orders for <strong>Night Tiffin</strong> items only. Please remove morning or afternoon items to proceed.
              </p>
            </div>
          </div>
          <button
            onClick={() => nonNightItems.forEach((i) => removeItem(i.menuItem._id))}
            className="shrink-0 rounded-full bg-amber-800 text-white px-4 py-2 text-xs font-bold hover:bg-amber-900 transition shadow-sm"
          >
            Remove Non-Night Items
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items List */}
        <div className="space-y-4">
          {items.map(({ menuItem, qty }) => (
            <div key={menuItem._id} className="doppel-shell p-1.5 sm:p-2">
              <div className="doppel-core flex items-center gap-4 p-4">
                <img
                  src={menuItem.image || '/images/dishes/meals.jpg'}
                  alt={menuItem.name}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold text-ink">{menuItem.name}</h3>
                      <p className="text-xs font-semibold text-brand-700 tabular-nums">₹{menuItem.price} each</p>
                    </div>
                    <p className="whitespace-nowrap font-display text-lg font-extrabold text-ink tabular-nums">
                      ₹{menuItem.price * qty}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
                    <QtyStepper qty={qty} onDec={() => setQty(menuItem._id, qty - 1)} onInc={() => setQty(menuItem._id, qty + 1)} small />
                    <button onClick={() => removeItem(menuItem._id)} className="text-xs font-semibold text-stone-400 hover:text-red-600 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="doppel-shell p-2">
            <div className="doppel-core p-6">
              <h2 className="font-display text-xl font-extrabold text-ink tracking-tight">Order Summary</h2>
              <dl className="mt-5 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-ink tabular-nums">₹{subtotal}</dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>First Order Privilege</dt>
                  <dd className="font-semibold text-leaf-700">
                    {user?.isFirstOrder ? '10% off at checkout' : '—'}
                  </dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Delivery</dt>
                  <dd className="font-semibold text-stone-500">Calculated at checkout</dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-dashed border-stone-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-sm">Estimated Total</span>
                  <span className="font-display text-2xl font-extrabold text-brand-700 tabular-nums">₹{subtotal}</span>
                </div>
              </div>

              {user?.isFirstOrder && (
                <div className="mt-4 rounded-xl bg-leaf-50/80 p-3 text-xs font-semibold text-leaf-800 border border-leaf-200/60">
                  🎁 Welcome Gift: 10% discount applies automatically during checkout.
                </div>
              )}
              {toFree > 0 && subtotal < freeOver && (
                <div className="mt-3 rounded-xl bg-amber-50/80 p-3 text-xs font-semibold text-amber-900 border border-amber-200/60">
                  Add <strong className="tabular-nums">₹{toFree}</strong> more for complimentary delivery.
                </div>
              )}

              <button
                disabled={hasRestrictedItems}
                onClick={() => navigate('/checkout')}
                className={`btn-island w-full mt-6 ${
                  hasRestrictedItems ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''
                }`}
              >
                <span>{hasRestrictedItems ? 'Night Items Only Can Be Ordered' : 'Proceed to Checkout'}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">→</span>
              </button>

              <Link to="/menu" className="mt-3 block text-center text-xs font-bold text-stone-500 hover:text-brand-600 transition-colors">
                + Add more items
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
