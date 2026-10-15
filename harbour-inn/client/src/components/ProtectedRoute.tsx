import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      openAuthModal('login', location.pathname);
    }
  }, [loading, user, location.pathname, openAuthModal]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary-200 border-t-primary" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-muted">
          Verifying guest session…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-serif text-3xl font-semibold text-primary">
          Authentication Required
        </h2>
        <p className="mt-2 text-sm text-neutral-muted max-w-sm">
          Please verify your email address to access guest reservations and account privileges.
        </p>
        <button
          onClick={() => openAuthModal('login', location.pathname)}
          className="btn-cta mt-6"
        >
          Sign In with Email OTP
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
