import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

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

  const applySession = useCallback(({ token, user }) => {
    localStorage.setItem('hsv_token', token)
    setToken(token)
    setUser(user)
  }, [])

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

  const logout = useCallback(() => {
    localStorage.removeItem('hsv_token')
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const res = await api.get('/auth/me')
    setUser(res.data.user)
    return res.data.user
  }, [])

  const value = useMemo(
    () => ({ user, booting, login, register, logout, refresh, setUser }),
    [user, booting, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
