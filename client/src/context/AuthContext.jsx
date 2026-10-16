import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { setToken } from '../lib/api'
import {
  supabase,
  sendEmailOtp as supabaseSendEmailOtp,
  sendPhoneOtp as supabaseSendPhoneOtp,
  verifyEmailOtp as supabaseVerifyEmailOtp,
  verifyPhoneOtp as supabaseVerifyPhoneOtp,
  isSupabaseConfigured,
} from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  const applySession = useCallback(({ token, user }) => {
    localStorage.setItem('hsv_token', token)
    setToken(token)
    setUser(user)
  }, [])

  // Restore session on first load
  useEffect(() => {
    const token = localStorage.getItem('hsv_token')
    if (!token) {
      setBooting(false)
      return
    }
    setToken(token)
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('hsv_token')
        setToken(null)
      })
      .finally(() => setBooting(false))
  }, [])

  // Sync Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('hsv_token')
        setToken(null)
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * Request OTP via Email or Phone Number through Supabase Auth
   */
  const sendOtp = useCallback(async ({ email, phone }) => {
    if (email) {
      return await supabaseSendEmailOtp(email)
    }
    if (phone) {
      return await supabaseSendPhoneOtp(phone)
    }
    throw new Error('Please provide an email address or mobile number.')
  }, [])

  /**
   * Verify OTP code and sync user profile with hotel database
   */
  const verifyOtp = useCallback(
    async ({ email, phone, token, name, address }) => {
      let sbData
      if (email) {
        sbData = await supabaseVerifyEmailOtp(email, token)
      } else if (phone) {
        sbData = await supabaseVerifyPhoneOtp(phone, token)
      } else {
        throw new Error('Email or phone is required for verification.')
      }

      // Sync Supabase session with hotel server backend
      const res = await api.post('/auth/supabase-sync', {
        supabaseId: sbData?.user?.id,
        email: email || sbData?.user?.email,
        phone: phone || sbData?.user?.phone,
        name: name || sbData?.user?.user_metadata?.full_name || sbData?.user?.user_metadata?.name,
        address,
      })

      applySession(res.data)
      return res.data.user
    },
    [applySession],
  )

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password })
      applySession(res.data)
      return res.data.user
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      const res = await api.post('/auth/register', payload)
      applySession(res.data)
      return res.data.user
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    localStorage.removeItem('hsv_token')
    setToken(null)
    setUser(null)
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.warn('Supabase signOut error:', e)
    }
  }, [])

  const refresh = useCallback(async () => {
    const res = await api.get('/auth/me')
    setUser(res.data.user)
    return res.data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      sendOtp,
      verifyOtp,
      logout,
      refresh,
      setUser,
      isSupabaseConfigured,
      supabase,
    }),
    [user, booting, login, register, sendOtp, verifyOtp, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
