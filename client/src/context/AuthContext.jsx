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
    if (token) localStorage.setItem('hsv_token', token)
    if (user) localStorage.setItem('hsv_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  // Restore session on first load
  useEffect(() => {
    const token = localStorage.getItem('hsv_token')
    const storedUser = localStorage.getItem('hsv_user')

    if (!token) {
      setBooting(false)
      return
    }

    setToken(token)
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user)
        localStorage.setItem('hsv_user', JSON.stringify(res.data.user))
      })
      .catch(() => {
        // Fallback to locally stored user profile if backend API is not running (e.g. standalone preview)
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch {
            localStorage.removeItem('hsv_token')
            localStorage.removeItem('hsv_user')
            setToken(null)
            setUser(null)
          }
        } else {
          localStorage.removeItem('hsv_token')
          setToken(null)
          setUser(null)
        }
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
        localStorage.removeItem('hsv_user')
        setToken(null)
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * Request OTP via Email through Supabase Auth
   */
  const sendOtp = useCallback(async ({ email, phone }) => {
    if (email) {
      return await supabaseSendEmailOtp(email)
    }
    if (phone) {
      return await supabaseSendPhoneOtp(phone)
    }
    throw new Error('Please provide an email address.')
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
        throw new Error('Email is required for verification.')
      }

      let appUser = null
      let appToken = null

      // Attempt sync with hotel server backend
      try {
        const res = await api.post('/auth/supabase-sync', {
          supabaseId: sbData?.user?.id,
          email: email || sbData?.user?.email,
          phone: phone || sbData?.user?.phone,
          name: name || sbData?.user?.user_metadata?.full_name || sbData?.user?.user_metadata?.name,
          address,
        })
        appUser = res.data.user
        appToken = res.data.token
      } catch (syncErr) {
        // If backend server is unreachable (e.g. static preview on Vercel), create seamless client session
        console.warn('Backend sync unavailable; operating in direct client mode:', syncErr)
        const cleanEmail = email || sbData?.user?.email || ''
        const cleanPhone = phone || sbData?.user?.phone || '9876543210'
        const displayName = name || cleanEmail.split('@')[0] || 'Guest User'

        appUser = {
          _id: sbData?.user?.id || 'sb_' + Date.now(),
          name: displayName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'customer',
          isFirstOrder: true,
          addresses: address?.line1
            ? [
                {
                  label: 'Home',
                  line1: address.line1,
                  area: address.area || '',
                  city: address.city || 'Chennai',
                  pincode: address.pincode || '600004',
                  isDefault: true,
                },
              ]
            : [],
        }
        appToken = sbData?.session?.access_token || 'sb_token_' + Date.now()
      }

      applySession({ token: appToken, user: appUser })
      return appUser
    },
    [applySession],
  )

  const login = useCallback(
    async (email, password) => {
      const cleanEmail = email.trim().toLowerCase()
      try {
        const res = await api.post('/auth/login', { email: cleanEmail, password })
        applySession(res.data)
        return res.data.user
      } catch (err) {
        // Safe fallback for demo staff login when running standalone on Vercel
        if (cleanEmail === 'staff@hotelsrivar.com' && password === 'staff123') {
          const demoStaff = {
            _id: 'staff_demo_1',
            name: 'Kitchen Staff',
            email: 'staff@hotelsrivar.com',
            role: 'staff',
            isFirstOrder: false,
          }
          applySession({ token: 'demo_staff_token', user: demoStaff })
          return demoStaff
        }
        throw err
      }
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
    localStorage.removeItem('hsv_user')
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
