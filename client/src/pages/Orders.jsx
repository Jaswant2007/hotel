import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../lib/api'
import { useCart } from '../context/CartContext'
import Spinner from '../components/Spinner'
import { VegBadge } from '../components/MenuItemCard'

const STATUS_STYLE = {
  placed: 'bg-stone-100 text-stone-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-amber-100 text-amber-800',
  out_for_delivery: 'bg-violet-100 text-violet-700',
  delivered: 'bg-leaf-100 text-leaf-800',
}
const STATUS_TEXT = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
}

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [reordering, setReordering] = useState('')
  const { addItem, clearCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data.orders))
      .catch((e) => setError(e.message))
  }, [])

  const reorder = async (order) => {
    setReordering(order._id)
    setError('')
    try {
      // Refresh the menu so we reorder only available items at current prices
      const { data } = await api.get('/menu')
      const byId = new Map(data.items.map((i) => [i._id, i]))
      clearCart()
      let added = 0
      for (const line of order.items) {
        const fresh = byId.get(line.menuItem)
        if (fresh) {
          addItem(fresh, line.qty)
          added++
        }
      }
      if (!added) throw new Error('These items are no longer available. Please check the menu.')
      navigate('/cart')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setReordering('')
    }
  }

  if (!orders && !error) return <Spinner label="Loading your orders…" full />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">My Orders</h1>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {orders && orders.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <span className="text-4xl">🧾</span>
          <p className="mt-3 font-display text-xl font-bold text-ink">No orders yet</p>
          <p className="text-sm text-stone-500">Your order history will appear here.</p>
          <Link to="/menu" className="btn-primary mt-5">Order your first meal</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`chip ${STATUS_STYLE[o.status] || 'bg-stone-100'}`}>
                      {o.statusText || STATUS_TEXT[o.status]}
                    </span>
                    <span className="chip bg-stone-100 text-stone-600 uppercase">{o.paymentMethod}</span>
                    <span className={`chip ${o.paymentStatus === 'paid' ? 'bg-leaf-100 text-leaf-800' : 'bg-amber-100 text-amber-800'}`}>
                      {o.paymentStatus === 'paid' ? 'Paid' : o.paymentMethod === 'cod' ? 'Pay on delivery' : 'Payment pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-400">
                    #{String(o._id).slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleString('en-IN')}
                    {o.isPickup ? ' · Pickup' : ' · Delivery'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-extrabold text-brand-700">₹{o.total}</p>
                  <p className="text-[11px] text-stone-400">{o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              <p className="mt-3 text-sm text-stone-600">
                {o.items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/orders/${o._id}`} className="btn-dark text-xs px-4 py-2">
                  Track order
                </Link>
                <button
                  onClick={() => reorder(o)}
                  disabled={reordering === o._id}
                  className="btn-outline text-xs px-4 py-2"
                >
                  {reordering === o._id ? 'Adding…' : '↻ Reorder'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
