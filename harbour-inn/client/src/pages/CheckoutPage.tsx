import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Users, CheckCircle, Sparkles, Lock } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const pricePerNight = 355;
  const nights = 4;
  const taxes = 142;
  const total = pricePerNight * nights + taxes;

  const handleCompleteBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-cta">
          Direct Reservation
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-primary">
          Confirm Your Suite
        </h1>
        <p className="mt-1 text-sm text-neutral-muted">
          Best rate guaranteed with complimentary coastal breakfast &amp; early check-in.
        </p>
      </header>

      {bookingConfirmed ? (
        <div className="rounded-3xl border border-neutral-border bg-white p-8 sm:p-12 text-center shadow-card max-w-2xl mx-auto animate-scale-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-4 shadow-inner">
            <CheckCircle className="h-9 w-9" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-cta">
            Reservation Confirmed
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-primary">
            We Look Forward to Welcoming You
          </h2>
          <p className="mt-2 text-sm text-neutral-muted">
            Booking reference <strong>#HI-98214</strong> for Waterfront Oceanview King Suite.
          </p>

          {!user && (
            <div className="mt-8 rounded-2xl border border-primary-200 bg-primary-50 p-6 text-left">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-cta shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    Verify email to save booking to your account
                  </h3>
                  <p className="mt-1 text-xs text-neutral-muted leading-relaxed">
                    Protect your reservation against unauthorized cancellations, review booking folios, and enjoy fast passwordless check-in.
                  </p>
                  <button
                    onClick={() => openAuthModal('signup', '/bookings')}
                    className="btn-cta h-10 px-5 text-xs mt-4"
                  >
                    Verify Email &amp; Save Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => navigate(user ? '/bookings' : '/')}
              className="btn-outline text-xs"
            >
              {user ? 'View in My Reservations →' : 'Return to Home'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-border bg-white p-6 sm:p-8 shadow-card">
              <h2 className="font-serif text-xl font-semibold text-primary mb-4">
                Guest Credentials
              </h2>

              {user ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-700" />
                    <div>
                      <p className="text-xs font-bold text-emerald-950">
                        Authenticated as {user.name}
                      </p>
                      <p className="text-xs text-emerald-800">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                    Member Rates Active
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-border bg-neutral-cream p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-neutral-text">Already have an account?</p>
                      <p className="text-xs text-neutral-muted">Sign in with email OTP for saved details.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="btn-outline h-9 px-3 text-xs"
                    >
                      Sign In
                    </button>
                  </div>

                  <form onSubmit={handleCompleteBooking} id="booking-form" className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
                        Guest Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Alex Rivers"
                        className="hotel-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
                        Email Address for Confirmation *
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="hotel-input w-full"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Room Summary Details */}
            <div className="rounded-2xl border border-neutral-border bg-white p-6 sm:p-8 shadow-card">
              <h2 className="font-serif text-xl font-semibold text-primary mb-3">
                Waterfront Oceanview King Suite
              </h2>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Panoramic marina views, private teak balcony, deep soaking tub, organic linen bedding, and complimentary coastal breakfast.
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-neutral-border pt-4 text-xs">
                <div>
                  <span className="block text-neutral-muted text-[11px]">Dates</span>
                  <strong className="flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-cta" /> Nov 12 – Nov 16
                  </strong>
                </div>
                <div>
                  <span className="block text-neutral-muted text-[11px]">Guests</span>
                  <strong className="flex items-center gap-1 mt-0.5">
                    <Users className="h-3.5 w-3.5 text-cta" /> 2 Adults
                  </strong>
                </div>
                <div>
                  <span className="block text-neutral-muted text-[11px]">Cancellation</span>
                  <strong className="text-emerald-700 mt-0.5 block">Flexible (48h prior)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <aside className="h-fit space-y-4">
            <div className="rounded-2xl border border-neutral-border bg-white p-6 shadow-card">
              <h3 className="font-serif text-lg font-semibold text-primary mb-4">
                Booking Summary
              </h3>

              <div className="space-y-3 text-xs text-neutral-text">
                <div className="flex justify-between">
                  <span>${pricePerNight} × {nights} nights</span>
                  <span className="font-semibold">${pricePerNight * nights}</span>
                </div>
                <div className="flex justify-between">
                  <span>Municipal hospitality tax</span>
                  <span className="font-semibold">${taxes}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Harbour Inn Direct Privilege</span>
                  <span className="font-semibold">Complimentary Wifi &amp; Parking</span>
                </div>

                <div className="border-t border-neutral-border pt-3 flex justify-between text-sm font-bold text-primary">
                  <span>Total Due</span>
                  <span className="font-serif text-2xl font-bold text-primary">${total}</span>
                </div>
              </div>

              <button
                type="submit"
                form={user ? undefined : 'booking-form'}
                onClick={user ? handleCompleteBooking : undefined}
                className="btn-cta w-full mt-6"
              >
                <Lock className="h-4 w-4" /> Complete Direct Booking
              </button>

              <p className="mt-3 text-center text-[11px] text-neutral-muted">
                🔒 Guaranteed 256-bit encrypted checkout
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
