import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { OtpInput } from './OtpInput';
import { X, Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AuthModal: React.FC = () => {
  const { authModal, closeAuthModal, setUser } = useAuth();
  const navigate = useNavigate();

  // Mode: signup | login
  const [mode, setMode] = useState<'signup' | 'login'>(authModal.mode);
  const [step, setStep] = useState<'INPUT' | 'VERIFY' | 'SUCCESS'>('INPUT');

  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');

  // Status & Timing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Sync mode with trigger
  useEffect(() => {
    setMode(authModal.mode);
    setStep('INPUT');
    setError(null);
    setCode('');
  }, [authModal.isOpen, authModal.mode]);

  // 30-Second Cooldown Timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!authModal.isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && !consent) {
      setError({ message: 'Please accept the privacy policy & guest terms to continue.' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestOtp({
        email: email.trim(),
        purpose: mode,
        name: mode === 'signup' ? name.trim() : undefined,
        phone: mode === 'signup' && phone ? phone.trim() : undefined,
        consent,
      });

      setMaskedEmail(res.emailMasked);
      setCooldown(res.cooldownSeconds || 30);
      setStep('VERIFY');
    } catch (err: any) {
      setError({
        message: err.message || 'Could not send verification code. Please check your email.',
        field: err.field,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (candidateCode?: string) => {
    const codeToSubmit = candidateCode || code;
    if (codeToSubmit.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      const res = await authApi.verifyOtp({
        email: email.trim(),
        code: codeToSubmit,
        purpose: mode,
      });

      setUser(res.user);
      setStep('SUCCESS');

      setTimeout(() => {
        closeAuthModal();
        if (authModal.returnUrl) {
          navigate(authModal.returnUrl);
        }
      }, 1400);
    } catch (err: any) {
      setError({ message: err.message || 'Invalid or expired code. Please try again.' });
      setCode(''); // reset for convenience
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.resendOtp({
        email: email.trim(),
        purpose: mode,
      });
      setCooldown(res.cooldownSeconds || 30);
    } catch (err: any) {
      setError({ message: err.message || 'Failed to resend code.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-primary-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-neutral-card p-6 sm:p-8 shadow-modal border border-neutral-border animate-scale-up">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-neutral-muted hover:bg-neutral-paper hover:text-neutral-text transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* STEP 1: Email & Details Entry */}
        {step === 'INPUT' && (
          <div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Passwordless Sign In
              </span>
              <h2 id="auth-modal-title" className="mt-3 font-serif text-3xl font-semibold text-primary">
                {mode === 'signup' ? 'Create Guest Account' : 'Welcome to Harbour Inn'}
              </h2>
              <p className="mt-2 text-sm text-neutral-muted">
                {mode === 'signup'
                  ? 'Sign up to manage reservations and enjoy privileged member rates.'
                  : 'Enter your email address to receive a secure single-use access code.'}
              </p>
            </div>

            {/* Error Banner with aria-live for accessibility */}
            <div aria-live="assertive">
              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{error.message}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="hotel-input w-full"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="hotel-input w-full pl-10"
                  />
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-neutral-muted pointer-events-none" />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="auth-phone" className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
                      Phone Number <span className="font-normal text-neutral-muted">(Optional for SMS arrival updates)</span>
                    </label>
                    <input
                      id="auth-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="hotel-input w-full"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="auth-consent"
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-neutral-border text-cta focus:ring-focusRing"
                    />
                    <label htmlFor="auth-consent" className="text-xs text-neutral-muted leading-relaxed cursor-pointer">
                      I agree to the Harbour Inn <a href="#terms" className="text-primary underline">Guest Terms of Service</a> and acknowledge the <a href="#privacy" className="text-primary underline">Privacy Policy</a> (GDPR-compliant).
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-cta w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Dispatching Code…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Verification Code <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Switch between Signup and Login */}
            <div className="mt-6 border-t border-neutral-border pt-4 text-center">
              {mode === 'signup' ? (
                <p className="text-xs text-neutral-muted">
                  Already a guest at Harbour Inn?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    Log in here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-neutral-muted">
                  First time booking with us?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Verify 6-Digit Code */}
        {step === 'VERIFY' && (
          <div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Step 2: Enter Code
              </span>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-primary">
                Verify Your Inbox
              </h2>
              <p className="mt-2 text-sm text-neutral-muted">
                We sent a single-use 6-digit access code to{' '}
                <strong className="text-neutral-text font-mono">{maskedEmail || email}</strong>.
              </p>
            </div>

            {/* Error Banner */}
            <div aria-live="assertive">
              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{error.message}</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted text-center mb-3">
                Enter 6-Digit Security Code
              </label>
              <OtpInput
                value={code}
                onChange={(val) => {
                  setCode(val);
                  if (error) setError(null);
                }}
                onComplete={(completedCode) => handleVerifyOtp(completedCode)}
                disabled={loading}
                hasError={Boolean(error)}
              />
            </div>

            <button
              onClick={() => handleVerifyOtp()}
              disabled={code.length !== 6 || loading}
              className="btn-cta w-full mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Code…
                </span>
              ) : (
                'Verify & Access Account'
              )}
            </button>

            {/* Cooldown Timer & Resend Button */}
            <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-neutral-muted border-t border-neutral-border pt-4">
              {cooldown > 0 ? (
                <p>
                  Resend code available in{' '}
                  <strong className="text-cta font-mono font-bold tabular-nums">{cooldown}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" /> Resend verification code
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep('INPUT');
                  setCode('');
                  setError(null);
                }}
                className="text-neutral-muted hover:text-neutral-text underline mt-1"
              >
                Entered the wrong email? Change address
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Animation */}
        {step === 'SUCCESS' && (
          <div className="py-8 text-center animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-primary">
              Authenticated Successfully
            </h2>
            <p className="mt-1.5 text-sm text-neutral-muted">
              Welcome back to Harbour Inn. Redirecting your session…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
