import React, { useEffect, useState } from 'react';
import { authApi, Booking } from '../api/auth';
import { Calendar, Users, MapPin, Download, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .getBookings()
      .then((res) => setBookings(res.bookings))
      .catch((err) => setError(err.message || 'Failed to fetch bookings.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-cta">
          Guest Portal
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-primary">
          Your Reservations
        </h1>
        <p className="mt-1 text-sm text-neutral-muted">
          Manage upcoming stays, review booking details, or modify coastal suites.
        </p>
      </header>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 w-full animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-border bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-neutral-muted mb-4" />
          <h2 className="font-serif text-2xl font-semibold text-primary">No reservations yet</h2>
          <p className="mt-2 text-sm text-neutral-muted max-w-sm mx-auto">
            Experience our waterfront suites with direct ocean breezes and handcrafted dining.
          </p>
          <Link to="/checkout" className="btn-cta mt-6 inline-flex">
            Book a Suite
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-neutral-border bg-white p-6 shadow-card transition-all hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-4">
                <div>
                  <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                    Ref: {booking.id}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-primary">
                    {booking.roomTitle}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-muted">
                    <MapPin className="h-3.5 w-3.5 text-cta" /> Harbour Inn Waterfront, Marina Wing
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-xs uppercase tracking-wider text-neutral-muted">Total Paid</span>
                  <span className="font-serif text-2xl font-bold text-primary">
                    ${booking.totalAmount}
                  </span>
                  <span className="inline-block mt-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {booking.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-text pt-2">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="block text-neutral-muted text-[11px]">Check-In</span>
                    <strong className="text-sm font-semibold">{booking.checkIn}</strong>
                  </div>
                  <div>
                    <span className="block text-neutral-muted text-[11px]">Check-Out</span>
                    <strong className="text-sm font-semibold">{booking.checkOut}</strong>
                  </div>
                  <div>
                    <span className="block text-neutral-muted text-[11px]">Guests</span>
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Users className="h-3.5 w-3.5 text-neutral-muted" /> {booking.guests}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="btn-outline h-9 px-3 text-xs">
                    <Download className="h-3.5 w-3.5" /> PDF Folio
                  </button>
                  {booking.canCancel && (
                    <button className="h-9 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition">
                      Modify / Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
