import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Waves, Coffee, Sparkles, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-primary-900 px-6 py-20 sm:px-12 sm:py-28 text-center overflow-hidden shadow-2xl border border-primary-800">
          {/* Subtle atmospheric glow */}
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-700/40 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-cta/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-800/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-200 border border-primary-700">
              <Sparkles className="h-3.5 w-3.5 text-cta" /> Boutique Coastal Haven · Est. 1928
            </span>

            <h1 className="mt-6 font-serif text-4xl sm:text-6xl font-semibold text-neutral-cream tracking-tight leading-tight">
              Where Maritime Heritage Meets Modern Tranquility
            </h1>

            <p className="mt-5 text-base sm:text-lg text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
              Direct waterfront suites perched above the marina. Reserve directly for privileged amenities, flexible cancellations, and instant passwordless access.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/checkout')}
                className="btn-cta w-full sm:w-auto h-12 px-8 text-sm uppercase tracking-wider font-bold"
              >
                Reserve Your Stay <ArrowRight className="h-4 w-4" />
              </button>

              {!user && (
                <button
                  onClick={() => openAuthModal('login')}
                  className="btn-outline w-full sm:w-auto h-12 px-7 bg-transparent border-primary-700 text-neutral-cream hover:bg-primary-800 text-sm font-bold"
                >
                  <KeyRound className="h-4 w-4" /> Guest Email-OTP Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture & Direct Booking Features */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-neutral-border">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-cta">
            Direct Booking Privileges
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-primary">
            Passwordless Security for Effortless Travel
          </h2>
          <p className="mt-2 text-sm text-neutral-muted">
            No forgotten passwords. No credential stuffing risks. Every booking is secured with cryptographically generated, single-use email verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-border bg-white p-7 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary mb-5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-primary">
              Cryptographic Email-OTP
            </h3>
            <p className="mt-2 text-sm text-neutral-muted leading-relaxed">
              6-digit HMAC-SHA256 hashed codes delivered directly to your inbox. 10-minute expiry with 5-attempt anti-brute-force locking.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-border bg-white p-7 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary mb-5">
              <Waves className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-primary">
              Rotating Refresh Tokens
            </h3>
            <p className="mt-2 text-sm text-neutral-muted leading-relaxed">
              HttpOnly Secure cookies with automated token-family reuse detection. If token theft is suspected, all sessions are immediately revoked.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-border bg-white p-7 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary mb-5">
              <Coffee className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-primary">
              Full Session Transparency
            </h3>
            <p className="mt-2 text-sm text-neutral-muted leading-relaxed">
              Review every active device logged into your reservations, revoke single devices remotely, or log out of all devices with one click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
