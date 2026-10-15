import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const from = location.state?.from || '/'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(form.email.trim(), form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md flex-col justify-center px-4 sm:px-6 py-12">
      <div className="doppel-shell p-2">
        <div className="doppel-core p-7 sm:p-8">
          <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-[0.2em] px-3 py-1">
            Guest Account
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">Welcome back 👋</h1>
          <p className="mt-1 text-xs text-stone-500">Sign in to order your favourite South Indian dishes.</p>

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">{error}</p>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              className="btn-island w-full mt-2"
              disabled={busy}
            >
              <span>{busy ? 'Verifying…' : 'Sign in to order'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">→</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-500 border-t border-stone-100 pt-4">
            New here?{' '}
            <Link to="/register" className="font-bold text-brand-700 hover:underline">
              Create an account
            </Link>
            <span className="mx-2 text-stone-300">·</span>
            <Link to="/menu" className="font-bold text-brand-700 hover:underline">
              Browse menu
            </Link>
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-3.5 text-xs text-stone-600">
            <p className="font-bold text-stone-800">Demo Staff Login</p>
            <p className="mt-1 font-mono text-[11px] text-stone-600">staff@hotelsrivar.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
