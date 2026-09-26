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
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="card p-7">
        <h1 className="font-display text-3xl font-extrabold text-ink">Create account</h1>
        <p className="mt-1 text-sm text-stone-500">
          New accounts get <strong className="text-brand-600">10% off the first order</strong> 🎉
        </p>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" required className="input" placeholder="Arun Kumar" value={form.name} onChange={set('name')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="email">Email</label>
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

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
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

          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Creating account…' : 'Create my account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
