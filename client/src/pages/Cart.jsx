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

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-4xl">🛒</div>
        <h1 className="mt-5 font-display text-3xl font-extrabold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-stone-500">Add some hot idlis or a biryani to get started.</p>
        <Link to="/menu" className="btn-primary mt-6 px-8 py-3">Browse menu</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">
        Your cart <span className="text-stone-400">({count} item{count > 1 ? 's' : ''})</span>
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map(({ menuItem, qty }) => (
            <div key={menuItem._id} className="card flex items-center gap-4 p-3 sm:p-4">
              <img
                src={menuItem.image || '/images/dishes/meals.jpg'}
                alt={menuItem.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-bold text-ink">{menuItem.name}</h3>
                    <p className="text-sm font-semibold text-brand-700">₹{menuItem.price} each</p>
                  </div>
                  <p className="whitespace-nowrap font-display text-lg font-extrabold text-ink">
                    ₹{menuItem.price * qty}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <QtyStepper qty={qty} onDec={() => setQty(menuItem._id, qty - 1)} onInc={() => setQty(menuItem._id, qty + 1)} />
                  <button onClick={() => removeItem(menuItem._id)} className="text-xs font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <h2 className="font-display text-xl font-extrabold text-ink">Bill details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">₹{subtotal}</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>Discount</dt>
                <dd className="font-semibold text-leaf-700">
                  {user?.isFirstOrder ? 'Applied at checkout (10%)' : '—'}
                </dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>Delivery fee</dt>
                <dd className="font-semibold text-ink">Calculated at checkout</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-dashed border-stone-300 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700">Subtotal</span>
                <span className="font-display text-2xl font-extrabold text-brand-700">₹{subtotal}</span>
              </div>
            </div>

            {user?.isFirstOrder && (
              <p className="mt-3 rounded-xl bg-leaf-50 p-3 text-xs font-semibold text-leaf-800">
                🎁 You’re eligible for 10% off your first order — it will be applied automatically.
              </p>
            )}
            {toFree > 0 && subtotal < freeOver && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                Add ₹{toFree} more for free delivery (above ₹{freeOver}).
              </p>
            )}

            <button onClick={() => navigate('/checkout')} className="btn-primary mt-4 w-full py-3 text-base">
              Proceed to Checkout →
            </button>
            <Link to="/menu" className="mt-2 block text-center text-sm font-semibold text-stone-500 hover:text-brand-600">
              + Add more items
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
