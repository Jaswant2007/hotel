import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authModal: {
    isOpen: boolean;
    mode: 'login' | 'signup';
    returnUrl?: string;
  };
  openAuthModal: (mode?: 'login' | 'signup', returnUrl?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
    returnUrl?: string;
  }>({
    isOpen: false,
    mode: 'login',
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
    } catch (err: any) {
      if (err.code === 'TOKEN_EXPIRED' || err.code === 'UNAUTHORIZED') {
        try {
          // Attempt silent session refresh via HttpOnly refresh cookie
          await authApi.refresh();
          const retryRes = await authApi.getMe();
          setUser(retryRes.user);
          return;
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      setUser(null);
    }
  }, []);

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login', returnUrl?: string) => {
    setAuthModal({ isOpen: true, mode, returnUrl });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        logout,
        logoutAll,
        refreshUser,
        authModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
