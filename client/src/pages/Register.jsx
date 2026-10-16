import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'
import { formatAuthError } from '../lib/supabase'
import OtpInput from '../components/OtpInput'

export default function Register() {
  const { register, sendOtp, verifyOtp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()

  // Mode: 'otp' (default) | 'password'
  const [useOtpMode, setUseOtpMode] = useState(true)
  // Step: 1 = Details form, 2 = Enter OTP Code
  const [step, setStep] = useState(1)

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

  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const timer = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendTimer])

  // Step 1: Submit details & dispatch Email OTP
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic validations
    if (!form.name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit mobile number for order delivery.')
      return
    }
    if (!form.line1.trim() || !form.pincode.trim()) {
      setError('Please enter your street address and 6-digit pincode.')
      return
    }

    // If Email OTP Mode with Supabase
    if (useOtpMode && isSupabaseConfigured) {
      setBusy(true)
      try {
        await sendOtp({ email: form.email.trim() })
        setStep(2)
        setOtpCode('')
        setResendTimer(45)
      } catch (err) {
        setError(formatAuthError(err))
      } finally {
        setBusy(false)
      }
      return
    }

    // Fallback: Password registration
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

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

  // Step 2: Verify Email OTP with Supabase
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    setError('')

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code received in your email.')
      return
    }

    setBusy(true)
    try {
      await verifyOtp({
        email: form.email.trim(),
        token: otpCode,
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: {
          line1: form.line1.trim(),
          area: form.area.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
        },
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-12">
      <div className="doppel-shell p-2">
        <div className="doppel-core p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-semibold">
              New Guest Privilege
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              ● Supabase Email OTP Active
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">Create account</h1>
          <p className="mt-1 text-xs text-stone-500">
            Enjoy an automatic <strong className="text-brand-700 font-bold">10% discount</strong> on your first order.
          </p>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {error}
            </p>
          )}

          {step === 1 ? (
            /* STEP 1: Registration Details Form */
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    required
                    className="input"
                    placeholder="Arun Kumar"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label" htmlFor="email">
                    Email address (OTP will be sent here)
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>

                <div className={useOtpMode ? 'sm:col-span-2' : ''}>
                  <label className="label" htmlFor="phone">
                    Mobile contact number (for delivery)
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center justify-center px-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-xs text-stone-600">
                      +91
                    </span>
                    <input
                      id="phone"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      className="input flex-1"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={set('phone')}
                    />
                  </div>
                </div>

                {!useOtpMode && (
                  <div>
                    <label className="label" htmlFor="password">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      className="input"
                      placeholder="min 6 characters"
                      value={form.password}
                      onChange={set('password')}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Default delivery address
                </p>
                <div className="space-y-3">
                  <input
                    required
                    className="input"
                    placeholder="Door no, street (e.g. 12 Temple Street)"
                    value={form.line1}
                    onChange={set('line1')}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      className="input col-span-2"
                      placeholder="Area (e.g. Mylapore)"
                      value={form.area}
                      onChange={set('area')}
                    />
                    <input
                      required
                      className="input"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Pincode"
                      value={form.pincode}
                      onChange={set('pincode')}
                    />
                  </div>
                  <input
                    className="input"
                    placeholder="City"
                    value={form.city}
                    onChange={set('city')}
                  />
                </div>
              </div>

              <button className="btn-island w-full mt-2" disabled={busy}>
                <span>
                  {busy
                    ? 'Dispatching OTP…'
                    : useOtpMode
                    ? 'Send 6-Digit Email Code & Claim 10% Off'
                    : 'Create Account & Claim 10% Off'}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  →
                </span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setUseOtpMode(!useOtpMode)}
                  className="text-xs text-stone-500 hover:text-stone-800 underline"
                >
                  {useOtpMode ? 'Or set a password instead' : 'Switch back to passwordless Email OTP'}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Verify Email OTP */
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 text-center">
                <p className="text-xs font-semibold text-brand-950">
                  Check your email inbox
                </p>
                <p className="text-[11px] text-brand-800 mt-0.5">
                  We sent a 6-digit verification code to <strong className="font-bold">{form.email}</strong>
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
                <span>{busy ? 'Verifying & Creating Account…' : 'Verify Code & Claim 10% Off'}</span>
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
                  ← Edit details
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || busy}
                  onClick={handleSubmit}
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

          <p className="mt-6 text-center text-xs text-stone-500 border-t border-stone-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
