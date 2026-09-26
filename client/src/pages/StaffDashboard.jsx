import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../lib/api'
import Spinner from '../components/Spinner'

const TABS = [
  { id: '', label: 'All' },
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
]

const NEXT = {
  placed: { to: 'confirmed', label: '✓ Confirm' },
  confirmed: { to: 'preparing', label: '🍳 Start preparing' },
  preparing: { to: 'out_for_delivery', label: '🛵 Mark out for delivery' },
  out_for_delivery: { to: 'delivered', label: '🎉 Mark delivered' },
}

const CHIP = {
  placed: 'bg-stone-100 text-stone-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-800',
  out_for_delivery: 'bg-violet-100 text-violet-700',
  delivered: 'bg-leaf-100 text-leaf-800',
}

/** Kitchen / staff view: live order queue with one-click status advancement. */
export default function StaffDashboard() {
  const [tab, setTab] = useState('')
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api.get('/orders', { params: { scope: 'staff', ...(tab && { status: tab }) } })
      setOrders(res.data.orders)
      setError('')
    } catch (e) {
      setError(errMsg(e))
    }
  }, [tab])

  useEffect(() => {
    load()
    const t = setInterval(load, 6000) // live queue
    return () => clearInterval(t)
  }, [load])

  const advance = async (order) => {
    const next = NEXT[order.status]
    if (!next) return
    setUpdating(order._id)
    try {
      await api.patch(`/orders/${order._id}/status`, { status: next.to })
      await load()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setUpdating('')
    }
  }

  if (!orders && !error) return <Spinner label="Loading kitchen queue…" full />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Kitchen Queue</h1>
          <p className="text-sm text-stone-500">Staff view · auto-refreshes every 6 seconds</p>
        </div>
        <button onClick={load} className="btn-outline text-xs">⟳ Refresh</button>
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === t.id ? 'bg-ink text-white' : 'border border-stone-200 bg-white text-stone-600 hover:border-brand-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {orders && orders.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
          No orders in this lane right now 🍃
        </p>
      )}

      <ul className="mt-5 space-y-4">
        {(orders || []).map((o) => (
          <li key={o._id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${CHIP[o.status]}`}>{(o.status || '').replace(/_/g, ' ')}</span>
                  <span className="chip bg-stone-100 text-stone-600 uppercase">{o.paymentMethod}</span>
                  {o.paymentMethod === 'razorpay' && (
                    <span className={`chip ${o.paymentStatus === 'paid' ? 'bg-leaf-100 text-leaf-800' : 'bg-red-100 text-red-700'}`}>
                      {o.paymentStatus}
                    </span>
                  )}
                  {o.isPickup && <span className="chip bg-sky-100 text-sky-700">PICKUP</span>}
                  {o.isFirstOrderDiscount && <span className="chip bg-amber-100 text-amber-800">10% FIRST ORDER</span>}
                </div>
                <p className="mt-2 font-display text-lg font-extrabold text-ink">
                  #{String(o._id).slice(-8).toUpperCase()}
                  <span className="ml-2 font-display text-lg text-brand-700">₹{o.total}</span>
                </p>
                <p className="text-xs text-stone-400">
                  {new Date(o.createdAt).toLocaleTimeString('en-IN')} · {o.user?.name} · {o.user?.phone}
                </p>
                {!o.isPickup && o.deliveryAddress && (
                  <p className="mt-1 text-xs text-stone-500">
                    📍 {o.deliveryAddress.line1}, {o.deliveryAddress.area || ''} {o.deliveryAddress.city} — {o.deliveryAddress.pincode}
                  </p>
                )}
              </div>

              {NEXT[o.status] && (
                <button
                  onClick={() => advance(o)}
                  disabled={updating === o._id}
                  className="btn-green shrink-0 px-5 py-2.5"
                >
                  {updating === o._id ? 'Updating…' : NEXT[o.status].label}
                </button>
              )}
            </div>

            <ul className="mt-3 divide-y divide-stone-100 rounded-xl bg-stone-50 px-4 py-2 text-sm">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between py-1.5 text-stone-700">
                  <span>{it.name} × {it.qty}</span>
                  <span className="font-semibold">₹{it.price * it.qty}</span>
                </li>
              ))}
            </ul>
            {o.customerNote && (
              <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs font-semibold text-amber-900">📝 {o.customerNote}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
