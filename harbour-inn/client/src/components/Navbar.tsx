import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, Shield, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, logoutAll, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'HI';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-border bg-neutral-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Hotel Logo */}
        <Link to="/" className="flex flex-col group">
          <span className="font-serif text-2xl font-bold tracking-tight text-primary group-hover:text-primary-800 transition-colors">
            HARBOUR INN
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-muted -mt-1 font-medium">
            Coastal Sanctuary
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-text">
          <Link to="/" className="hover:text-primary transition-colors">
            Overview
          </Link>
          <Link to="/bookings" className="hover:text-primary transition-colors">
            My Reservations
          </Link>
          <Link to="/checkout" className="hover:text-primary transition-colors">
            Direct Booking
          </Link>
        </nav>

        {/* Right CTA / Account Menu */}
        <div className="flex items-center gap-4">
          {!user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="btn-outline h-11 px-4 text-xs uppercase tracking-wider font-bold"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="btn-cta h-11 px-5 text-xs uppercase tracking-wider font-bold"
              >
                Reserve Suite
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-neutral-border bg-white p-1.5 pr-3 shadow-sm hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-focusRing transition"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User account menu"
              >
                {/* Avatar with Initials */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-neutral-cream">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <span className="block font-bold text-neutral-text leading-tight">{user.name}</span>
                  <span className="block text-[11px] text-neutral-muted truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-muted" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-border bg-white py-2 shadow-modal animate-scale-up">
                  <div className="border-b border-neutral-border px-4 py-2.5">
                    <p className="text-xs font-bold text-neutral-text">{user.name}</p>
                    <p className="text-xs text-neutral-muted truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Verified Guest Account
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-neutral-text hover:bg-neutral-paper hover:text-primary transition"
                    >
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-neutral-text hover:bg-neutral-paper hover:text-primary transition"
                    >
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Profile &amp; Device Sessions</span>
                    </Link>
                  </div>

                  <div className="border-t border-neutral-border pt-1">
                    <button
                      onClick={async () => {
                        setDropdownOpen(false);
                        await logout();
                        navigate('/');
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-medium text-neutral-text hover:bg-neutral-paper hover:text-red-700 transition"
                    >
                      <LogOut className="h-4 w-4 text-neutral-muted" />
                      <span>Log Out</span>
                    </button>
                    <button
                      onClick={async () => {
                        setDropdownOpen(false);
                        await logoutAll();
                        navigate('/');
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-[11px] text-neutral-muted hover:bg-neutral-paper hover:text-red-700 transition"
                    >
                      <span className="pl-7">Log out of all devices</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
