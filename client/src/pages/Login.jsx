import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'
import { formatAuthError } from '../lib/supabase'
import OtpInput from '../components/OtpInput'

export default function Login() {
  const { login, sendOtp, verifyOtp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Tabs: 'otp' | 'password'
  const [tab, setTab] = useState('otp')
  // Step: 1 = Enter Email, 2 = Enter OTP Code
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [passwordForm, setPasswordForm] = useState({ email: '', password: '' })

  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const from = location.state?.from || '/'

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendTimer <= 0) return
    const timer = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendTimer])

  // Step 1: Send Email OTP via Supabase Auth
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    setInfoMsg('')

    const cleanEmail = email.trim()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address (e.g., name@gmail.com).')
      return
    }

    setBusy(true)
    try {
      await sendOtp({ email: cleanEmail })
      setInfoMsg(`A 6-digit verification code has been dispatched to ${cleanEmail}`)
      setStep(2)
      setOtpCode('')
      setResendTimer(45)
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  // Step 2: Verify Email OTP with Supabase
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    setError('')

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    setBusy(true)
    try {
      await verifyOtp({ email: email.trim(), token: otpCode })
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  // Password / Staff Login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(passwordForm.email.trim(), passwordForm.password)
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
          <div className="flex items-center justify-between">
            <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-semibold">
              Guest Account
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              ● Supabase Email OTP Active
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">Welcome back 👋</h1>
          <p className="mt-1 text-xs text-stone-500">
            Sign in to order hot South Indian food from Hotel Sri Vari.
          </p>

          {/* Tab Selector */}
          <div className="mt-5 flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('otp')
                setError('')
              }}
              className={`flex-1 rounded-lg py-2 transition-all ${
                tab === 'otp'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ✉️ Email OTP Sign-in
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('password')
                setError('')
              }}
              className={`flex-1 rounded-lg py-2 transition-all ${
                tab === 'password'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              🔑 Staff / Password
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {error}
            </p>
          )}

          {infoMsg && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-800 border border-green-200">
              {infoMsg}
            </p>
          )}

          {/* TAB 1: EMAIL OTP (PRIMARY) */}
          {tab === 'otp' && (
            <div className="mt-6">
              {step === 1 ? (
                /* Step 1: Enter Email */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="label" htmlFor="email">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <p className="mt-1.5 text-[11px] text-stone-500">
                      We'll send a single-use 6-digit verification code to your email inbox. No password needed.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn-island w-full mt-2"
                    disabled={busy || !isSupabaseConfigured}
                  >
                    <span>{busy ? 'Sending OTP…' : 'Send 6-Digit Email Code'}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      →
                    </span>
                  </button>
                </form>
              ) : (
                /* Step 2: Enter 6-digit OTP Code */
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-3.5 text-center">
                    <p className="text-xs font-semibold text-brand-950">
                      Check your email inbox
                    </p>
                    <p className="text-[11px] text-brand-800 mt-0.5">
                      We sent a 6-digit verification code to <strong className="font-bold">{email}</strong>
                    </p>
                  </div>

                  <OtpInput
                    length={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={busy}
                  />

                  <button
                    type="submit"
                    className="btn-island w-full"
                    disabled={busy || otpCode.length !== 6}
                  >
                    <span>{busy ? 'Verifying OTP…' : 'Verify Code & Sign In'}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      ✓
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setOtpCode('')
                        setError('')
                      }}
                      className="font-medium text-stone-500 hover:text-stone-800"
                    >
                      ← Change email
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || busy}
                      onClick={handleSendOtp}
                      className={`font-semibold ${
                        resendTimer > 0
                          ? 'text-stone-400 cursor-not-allowed'
                          : 'text-brand-700 hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: STAFF / PASSWORD */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="staffEmail">
                  Email address
                </label>
                <input
                  id="staffEmail"
                  type="email"
                  required
                  className="input"
                  placeholder="staff@hotelsrivar.com"
                  value={passwordForm.email}
                  onChange={(e) => setPasswordForm({ ...passwordForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="staffPassword">
                  Password
                </label>
                <input
                  id="staffPassword"
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                />
              </div>
              <button className="btn-island w-full mt-2" disabled={busy}>
                <span>{busy ? 'Verifying…' : 'Sign in with Password'}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  →
                </span>
              </button>

              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-3.5 text-xs text-stone-600">
                <p className="font-bold text-stone-800">Demo Staff Login</p>
                <p className="mt-1 font-mono text-[11px] text-stone-600">
                  staff@hotelsrivar.com / staff123
                </p>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-stone-500 border-t border-stone-100 pt-4">
            New customer?{' '}
            <Link to="/register" className="font-bold text-brand-700 hover:underline">
              Create an account
            </Link>
            <span className="mx-2 text-stone-300">·</span>
            <Link to="/menu" className="font-bold text-brand-700 hover:underline">
              Browse menu
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
