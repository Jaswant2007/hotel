import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    line1: '',
    area: '',
    city: 'Chennai',
    pincode: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        address: {
          line1: form.line1.trim(),
          area: form.area.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
        },
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-12">
      <div className="doppel-shell p-2">
        <div className="doppel-core p-7 sm:p-9">
          <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-[0.2em] px-3 py-1">
            New Guest Privilege
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">Create account</h1>
          <p className="mt-1 text-xs text-stone-500">
            Enjoy an automatic <strong className="text-brand-700">10% discount</strong> on your first order.
          </p>

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">{error}</p>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" required className="input" placeholder="Arun Kumar" value={form.name} onChange={set('name')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="email">Email address</label>
                <input id="email" type="email" required className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label" htmlFor="phone">Mobile number</label>
                <input id="phone" required inputMode="numeric" maxLength={10} className="input" placeholder="98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" required minLength={6} className="input" placeholder="min 6 characters" value={form.password} onChange={set('password')} />
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Default delivery address
              </p>
              <div className="space-y-3">
                <input required className="input" placeholder="Door no, street (e.g. 12 Temple Street)" value={form.line1} onChange={set('line1')} />
                <div className="grid grid-cols-3 gap-3">
                  <input className="input col-span-2" placeholder="Area (e.g. Mylapore)" value={form.area} onChange={set('area')} />
                  <input required className="input" inputMode="numeric" maxLength={6} placeholder="Pincode" value={form.pincode} onChange={set('pincode')} />
                </div>
                <input className="input" placeholder="City" value={form.city} onChange={set('city')} />
              </div>
            </div>

            <button className="btn-island w-full mt-2" disabled={busy}>
              <span>{busy ? 'Creating your account…' : 'Create Account & Claim 10% Off'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">→</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-500 border-t border-stone-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-700 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
