import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Spinner from '../components/Spinner'

const FREE_OVER = 500
const DEFAULT_FEE = 20

/**
 * Checkout: address / pickup → delivery fee → discount → payment (Razorpay or COD).
 * All money math is re-verified server-side; this is a preview for the user.
 */
export default function Checkout() {
  const { user, refresh } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [isPickup, setIsPickup] = useState(false)
  const [addressId, setAddressId] = useState('')
  const [newAddress, setNewAddress] = useState(null) // {line1,area,city,pincode,note}
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [demoPaying, setDemoPaying] = useState(false)

  const addresses = user?.addresses || []

  // Default selection
  useEffect(() => {
    if (addresses.length && !addressId && !newAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0]
      setAddressId(def._id)
    }
  }, [addresses, addressId, newAddress])

  // Empty cart → back to menu
  useEffect(() => {
    if (!items.length) navigate('/menu', { replace: true })
  }, [items.length, navigate])

  const selectedAddress = useMemo(() => {
    if (isPickup) return null
    if (newAddress) return { ...newAddress, phone: user?.phone }
    return addresses.find((a) => a._id === addressId) || null
  }, [isPickup, newAddress, addresses, addressId, user])

  // ----- Client-side estimate (server recomputes authoritatively) -----
  const discount = user?.isFirstOrder ? Math.round(subtotal * 0.1) : 0
  const deliveryFee = isPickup ? 0 : subtotal >= FREE_OVER ? 0 : DEFAULT_FEE
  const total = Math.max(0, subtotal - discount + deliveryFee)

  const validAddress = isPickup || (newAddress ? newAddress.line1 && /^[1-9][0-9]{5}$/.test(newAddress.pincode) : !!addressId)

  const placeOrder = async () => {
    setError('')
    if (!validAddress) {
      setError('Please select or enter a delivery address.')
      return
    }
    setBusy(true)
    try {
      // 1. Create order (server computes real totals)
      const payload = {
        items: items.map((i) => ({ menuItem: i.menuItem._id, qty: i.qty })),
        isPickup,
        paymentMethod,
        customerNote: note,
        ...(isPickup
          ? {}
          : newAddress
            ? { deliveryAddress: newAddress }
            : { addressId }),
      }
      const { data } = await api.post('/orders', payload)

      if (paymentMethod === 'cod') {
        await finish(data.order)
        return
      }

      // 2. Online payment
      if (data.payment?.demo) {
        // Demo mode (no Razorpay keys configured): simulate the checkout.
        setDemoPaying(true)
        const verify = await api.post('/payment/verify', {
          orderId: data.order._id,
          demo: true,
          razorpay_order_id: `demo_${Date.now()}`,
          razorpay_payment_id: `demo_pay_${Date.now()}`,
          razorpay_signature: 'demo',
        })
        setDemoPaying(false)
        await finish(verify.data.order)
        return
      }

      // Live Razorpay checkout
      await openRazorpay(data)
    } catch (err) {
      setBusy(false)
      setDemoPaying(false)
      setError(errMsg(err))
    }
  }

  const openRazorpay = (data) =>
    new Promise((resolve, reject) => {
      const { order, payment } = data
      const finishWith = async (response) => {
        try {
          const verify = await api.post('/payment/verify', {
            orderId: order._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          await finish(verify.data.order)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      const mount = () => {
        const rzp = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amount,
          currency: 'INR',
          name: 'Hotel Sri Vari',
          description: `Order #${String(order._id).slice(-6)}`,
          order_id: payment.razorpayOrderId,
          prefill: { name: user.name, email: user.email, contact: user.phone },
          theme: { color: '#ea580c' },
          handler: finishWith,
          modal: { ondismiss: () => { setBusy(false); setError('Payment cancelled. You can retry from your orders.') } },
        })
        rzp.on('payment.failed', (r) => { setBusy(false); setError(r.error?.description || 'Payment failed. Please try again.') })
        rzp.open()
      }
      if (window.Razorpay) return mount()
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = mount
      s.onerror = () => { setBusy(false); setError('Could not load Razorpay. Please try Cash on Delivery.') }
      document.body.appendChild(s)
    })

  const finish = async (order) => {
    clearCart()
    await refresh().catch(() => {}) // pick up isFirstOrder=false
    navigate(`/orders/${order._id}?placed=1`, { replace: true })
  }

  if (!items.length) return <Spinner label="Redirecting to menu…" full />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Checkout</h1>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Fulfilment */}
          <section className="card p-5">
            <h2 className="font-display text-xl font-extrabold text-ink">How would you like it?</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPickup(false)}
                className={`rounded-2xl border-2 p-4 text-left transition ${!isPickup ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-brand-200'}`}
              >
                <span className="text-xl">🛵</span>
                <p className="mt-1 font-bold text-ink">Delivery</p>
                <p className="text-xs text-stone-500">30–45 min · fee by pincode</p>
              </button>
              <button
                onClick={() => setIsPickup(true)}
                className={`rounded-2xl border-2 p-4 text-left transition ${isPickup ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-brand-200'}`}
              >
                <span className="text-xl">🏪</span>
                <p className="mt-1 font-bold text-ink">Pickup</p>
                <p className="text-xs text-stone-500">Ready in ~20 min · ₹0</p>
              </button>
            </div>
          </section>

          {/* Address */}
          {!isPickup && (
            <section className="card p-5">
              <h2 className="font-display text-xl font-extrabold text-ink">Delivery address</h2>

              {addresses.length > 0 && (
                <div className="mt-3 space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a._id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 transition ${
                        addressId === a._id && !newAddress ? 'border-brand-500 bg-brand-50' : 'border-stone-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addr"
                        checked={addressId === a._id && !newAddress}
                        onChange={() => { setAddressId(a._id); setNewAddress(null) }}
                        className="mt-1 accent-brand-600"
                      />
                      <span className="text-sm">
                        <span className="font-bold text-ink">{a.label}</span>
                        {a.isDefault && <span className="ml-2 text-[10px] font-bold uppercase text-leaf-700">Default</span>}
                        <br />
                        <span className="text-stone-600">{a.line1}{a.area ? `, ${a.area}` : ''}, {a.city} — {a.pincode}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-3 rounded-2xl border border-dashed border-stone-300 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-700">
                  <input
                    type="radio"
                    name="addr"
                    checked={!!newAddress}
                    onChange={() => setNewAddress({ line1: '', area: '', city: 'Chennai', pincode: '', note: '' })}
                    className="accent-brand-600"
                  />
                  Deliver to a new address
                </label>
                {newAddress && (
                  <div className="mt-3 space-y-2">
                    <input className="input" placeholder="Door no, street" value={newAddress.line1}
                      onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                    <div className="grid grid-cols-3 gap-2">
                      <input className="input col-span-2" placeholder="Area" value={newAddress.area}
                        onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })} />
                      <input className="input" inputMode="numeric" maxLength={6} placeholder="Pincode" value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                    </div>
                    <input className="input" placeholder="City" value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Payment method */}
          <section className="card p-5">
            <h2 className="font-display text-xl font-extrabold text-ink">Payment method</h2>
            <div className="mt-3 space-y-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${paymentMethod === 'razorpay' ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
                <input type="radio" name="pay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-brand-600" />
                <span className="text-sm">
                  <span className="font-bold text-ink">Pay Online</span> <span className="text-xs text-stone-500">(Razorpay — UPI, cards, wallets)</span>
                  <br />
                  <span className="text-xs text-stone-500">Secure checkout · instant confirmation</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
                <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-brand-600" />
                <span className="text-sm">
                  <span className="font-bold text-ink">Cash on Delivery</span>
                  <br />
                  <span className="text-xs text-stone-500">Pay when the food reaches you</span>
                </span>
              </label>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="note">Note for the kitchen (optional)</label>
              <input id="note" className="input" maxLength={300} placeholder="Less spicy, extra sambar…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <h2 className="font-display text-xl font-extrabold text-ink">Order summary</h2>

            <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm">
              {items.map(({ menuItem, qty }) => (
                <li key={menuItem._id} className="flex justify-between gap-2 text-stone-600">
                  <span className="truncate">{menuItem.name} × {qty}</span>
                  <span className="shrink-0 font-semibold text-ink">₹{menuItem.price * qty}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-dashed border-stone-300 pt-4 text-sm">
              <div className="flex justify-between text-stone-600">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">₹{subtotal}</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>
                  Discount
                  {user?.isFirstOrder && <span className="ml-1 rounded bg-leaf-100 px-1.5 py-0.5 text-[10px] font-bold text-leaf-800">FIRST ORDER 10%</span>}
                </dt>
                <dd className="font-semibold text-leaf-700">{discount ? `− ₹${discount}` : '—'}</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>Delivery fee {selectedAddress ? <span className="text-xs">({selectedAddress.pincode})</span> : ''}</dt>
                <dd className="font-semibold text-ink">
                  {deliveryFee === 0 ? (isPickup ? 'Pickup ₹0' : 'FREE') : `₹${deliveryFee}`}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
              <span className="font-semibold text-stone-700">Total</span>
              <span className="font-display text-3xl font-extrabold text-brand-700">₹{total}</span>
            </div>

            <button onClick={placeOrder} disabled={busy || !validAddress} className="btn-primary mt-4 w-full py-3 text-base">
              {busy ? (demoPaying ? 'Processing payment…' : 'Placing order…') : paymentMethod === 'cod' ? `Place Order · ₹${total}` : `Pay ₹${total}`}
            </button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-400">
              By placing this order you agree to our terms. Final amounts are calculated on our
              server. Need help? Call +91 98400 12345.
            </p>
          </div>

          <Link to="/cart" className="block text-center text-sm font-semibold text-stone-500 hover:text-brand-600">
            ← Back to cart
          </Link>
        </aside>
      </div>
    </div>
  )
}
