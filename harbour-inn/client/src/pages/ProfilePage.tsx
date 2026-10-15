import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, SessionRecord } from '../api/auth';
import { Shield, Smartphone, Laptop, Trash2, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, logoutAll } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  // Load active sessions
  useEffect(() => {
    authApi
      .getSessions()
      .then((res) => setSessions(res.sessions))
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      await authApi.updateMe({ name, phone });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSessionMsg('Device session revoked.');
      setTimeout(() => setSessionMsg(null), 3000);
    } catch {
      alert('Could not revoke session.');
    }
  };

  const handleExportData = () => {
    window.open('/api/v1/me/export', '_blank');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your Harbour Inn account? This will cancel future reservations and purge all data.'
    );
    if (!confirmed) return;

    try {
      await authApi.deleteAccount();
      alert('Your account has been completely erased.');
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <header>
        <span className="text-xs font-bold uppercase tracking-widest text-cta">
          Account &amp; Security
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-primary">
          Guest Profile &amp; Devices
        </h1>
        <p className="mt-1 text-sm text-neutral-muted">
          Manage your contact credentials, active sessions, and privacy settings.
        </p>
      </header>

      {/* 1. Contact Information Card */}
      <div className="rounded-2xl border border-neutral-border bg-white p-6 sm:p-8 shadow-card">
        <h2 className="font-serif text-2xl font-semibold text-primary mb-4">
          Contact Details
        </h2>

        {profileSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Profile changes saved successfully.
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-muted mb-1.5">
              Email Address (Verified)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="hotel-input w-full bg-neutral-100 text-neutral-muted cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-neutral-muted">
              Used for single-use OTP authentication. Contact concierge to transfer email.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
              Full Guest Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="hotel-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-text mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="hotel-input w-full"
            />
          </div>

          <button type="submit" disabled={savingProfile} className="btn-cta">
            {savingProfile ? 'Saving Changes…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* 2. Active Devices & Sessions Card */}
      <div className="rounded-2xl border border-neutral-border bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-5 mb-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-primary flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Active Device Sessions
            </h2>
            <p className="mt-1 text-xs text-neutral-muted">
              Devices authenticated via rotating refresh tokens. Revoke unrecognized devices.
            </p>
          </div>
          <button
            onClick={async () => {
              await logoutAll();
              navigate('/');
            }}
            className="btn-outline text-xs text-red-700 hover:bg-red-50 border-red-200"
          >
            Log Out All Devices
          </button>
        </div>

        {sessionMsg && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            {sessionMsg}
          </div>
        )}

        {loadingSessions ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-neutral-muted">No external active sessions found.</p>
        ) : (
          <div className="divide-y divide-neutral-border">
            {sessions.map((sess) => {
              const isMobile = /mobile|iphone|android/i.test(sess.user_agent);
              return (
                <div key={sess.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                      {isMobile ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-text truncate max-w-xs sm:max-w-md">
                        {sess.user_agent}
                      </p>
                      <p className="text-[11px] text-neutral-muted mt-0.5">
                        IP: <code className="font-mono">{sess.ip}</code> · Signed in:{' '}
                        {new Date(sess.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="p-2 text-neutral-muted hover:text-red-600 rounded-lg transition"
                    title="Revoke session"
                    aria-label="Revoke this device session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. GDPR Privacy & Data Rights Card */}
      <div className="rounded-2xl border border-neutral-border bg-white p-6 sm:p-8 shadow-card">
        <h2 className="font-serif text-2xl font-semibold text-primary mb-2">
          Privacy &amp; Data Rights (GDPR)
        </h2>
        <p className="text-xs text-neutral-muted mb-6">
          Harbour Inn respects your privacy. You have the right to export your booking records or erase your account.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button onClick={handleExportData} className="btn-outline text-xs">
            <Download className="h-4 w-4" /> Export Personal Data (JSON)
          </button>
          <button
            onClick={handleDeleteAccount}
            className="btn-outline text-xs text-red-700 border-red-300 hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4" /> Erase Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
};
