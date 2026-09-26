import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api, { errMsg } from '../lib/api'
import Spinner from '../components/Spinner'
import OrderStatusTracker from '../components/OrderStatusTracker'

const ACTIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery']

export default function OrderTracking() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const justPlaced = params.get('placed') === '1'
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.order)
    } catch (e) {
      setError(errMsg(e))
    }
  }, [id])

  // Poll every 8s while the order is still being prepared/delivered
  useEffect(() => {
    load()
    const poll = setInterval(() => {
      load()
      setNow(Date.now())
    }, 8000)
    return () => clearInterval(poll)
  }, [load])

  if (error && !order) return <div className="p-8"><p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p></div>
  if (!order) return <Spinner label="Loading your order…" full />

  const etaMs = new Date(order.estimatedAt).getTime()
  const remaining = Math.max(0, etaMs - now)
  const mins = Math.ceil(remaining / 60000)
  const isActive = ACTIVE_STATUSES.includes(order.status)
  const late = isActive && remaining === 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {justPlaced && (
        <div className="mb-6 animate-fade-up rounded-3xl border border-leaf-200 bg-leaf-50 p-5 text-leaf-900">
          <h2 className="font-display text-2xl font-extrabold">🎉 Order confirmed!</h2>
          <p className="mt-1 text-sm text-leaf-800">
            Thanks — the kitchen has been notified. A confirmation will also be sent to your
            email/SMS (notification hook is enabled on the server).
          </p>
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Order</p>
            <h1 className="font-display text-2xl font-extrabold text-ink">#{String(order._id).slice(-8).toUpperCase()}</h1>
            <p className="text-xs text-stone-400">Placed {new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold text-brand-700">₹{order.total}</p>
            <span className={`chip ${order.paymentStatus === 'paid' ? 'bg-leaf-100 text-leaf-800' : 'bg-amber-100 text-amber-800'}`}>
              {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentStatus === 'paid' ? 'Paid online' : 'Payment pending'}
            </span>
          </div>
        </div>

        {/* ETA banner */}
        <div className={`mt-5 rounded-2xl p-4 text-center ${isActive ? (late ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800') : 'bg-stone-100 text-stone-600'}`}>
          {order.status === 'delivered' ? (
            <p className="font-semibold">✅ Delivered — enjoy your meal! Feedback: +91 98400 12345</p>
          ) : late ? (
            <p className="font-semibold">⏳ Running a little late — thanks for your patience!</p>
          ) : (
            <p className="font-semibold">
              Estimated {order.isPickup ? 'ready for pickup' : 'delivery'} in{' '}
              <span className="font-display text-lg font-extrabold">{mins} min</span>{' '}
              (by {new Date(order.estimatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
            </p>
          )}
          <p className="mt-1 text-xs opacity-70">This page refreshes automatically every few seconds.</p>
        </div>

        {/* Status steps */}
        <div className="mt-7 overflow-x-auto pb-2">
          <OrderStatusTracker status={order.status} isPickup={order.isPickup} />
        </div>

        {/* Timeline detail */}
        <ul className="mt-4 space-y-1.5 rounded-2xl bg-stone-50 p-4 text-xs text-stone-600">
          {(order.statusHistory || []).map((h, i) => (
            <li key={i} className="flex justify-between">
              <span className="font-semibold capitalize">{(h.status || '').replace(/_/g, ' ')}</span>
              <span>{new Date(h.at).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Items */}
      <div className="card mt-5 p-6">
        <h2 className="font-display text-xl font-extrabold text-ink">Items</h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <img src={it.image || '/images/dishes/meals.jpg'} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{it.name}</p>
                <p className="text-xs text-stone-500">₹{it.price} × {it.qty}</p>
              </div>
              <span className="font-bold text-ink">₹{it.price * it.qty}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-1.5 border-t border-dashed border-stone-300 pt-4 text-sm">
          <div className="flex justify-between text-stone-600"><dt>Subtotal</dt><dd>₹{order.subtotal}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-leaf-700"><dt>Discount {order.isFirstOrderDiscount ? '(first order 10%)' : ''}</dt><dd>− ₹{order.discount}</dd></div>
          )}
          <div className="flex justify-between text-stone-600"><dt>Delivery fee</dt><dd>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</dd></div>
          <div className="flex justify-between pt-1 font-display text-lg font-extrabold text-ink"><dt>Total</dt><dd>₹{order.total}</dd></div>
        </dl>
      </div>

      {/* Address / pickup */}
      {!order.isPickup && order.deliveryAddress && (
        <div className="card mt-5 p-6">
          <h2 className="font-display text-xl font-extrabold text-ink">Delivery address</h2>
          <p className="mt-2 text-sm text-stone-600">
            {order.deliveryAddress.line1}
            {order.deliveryAddress.area ? `, ${order.deliveryAddress.area}` : ''}, {order.deliveryAddress.city} —{' '}
            <strong>{order.deliveryAddress.pincode}</strong>
            {order.deliveryAddress.phone && <> · 📞 {order.deliveryAddress.phone}</>}
          </p>
        </div>
      )}
      {order.isPickup && (
        <div className="card mt-5 p-6">
          <h2 className="font-display text-xl font-extrabold text-ink">Pickup</h2>
          <p className="mt-2 text-sm text-stone-600">
            Collect from Hotel Sri Vari, 12 Temple Street, Mylapore, Chennai 600004. Show your
            order number at the counter.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/orders" className="btn-outline">← All orders</Link>
        <Link to="/menu" className="btn-primary">Order something else</Link>
      </div>
    </div>
  )
}
