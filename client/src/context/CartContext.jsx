import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const STORAGE_KEY = 'hsv_cart'

/** Local cart: [{ menuItem (full object), qty }] keyed by _id. */
function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(loadLocal)
  const [syncing, setSyncing] = useState(false)
  const skipNextServerPush = useRef(false)

  // Persist locally on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // When logged in: pull the server cart once (server wins for merged state)
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setSyncing(true)
    api
      .get('/cart')
      .then((res) => {
        if (cancelled) return
        if (res.data.items?.length) {
          skipNextServerPush.current = true
          setItems(res.data.items)
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setSyncing(false))
    return () => {
      cancelled = true
    }
  }, [user?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push to server when logged in (best effort)
  useEffect(() => {
    if (!user) return
    if (skipNextServerPush.current) {
      skipNextServerPush.current = false
      return
    }
    const payload = items.map((i) => ({ menuItem: i.menuItem._id, qty: i.qty }))
    api.put('/cart', { items: payload }).catch(() => {})
  }, [items, user?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback((menuItem, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.menuItem._id === menuItem._id)
      if (idx === -1) return [...prev, { menuItem, qty }]
      const next = [...prev]
      next[idx] = { ...next[idx], qty: Math.min(50, next[idx].qty + qty) }
      return next
    })
  }, [])

  const setQty = useCallback((menuItemId, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.menuItem._id !== menuItemId)
        : prev.map((i) => (i.menuItem._id === menuItemId ? { ...i, qty: Math.min(50, qty) } : i)),
    )
  }, [])

  const removeItem = useCallback((menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItem._id !== menuItemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    if (user) api.delete('/cart').catch(() => {})
  }, [user])

  const qtyOf = useCallback(
    (menuItemId) => items.find((i) => i.menuItem._id === menuItemId)?.qty || 0,
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.menuItem.price * i.qty, 0),
    [items],
  )
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])

  const value = useMemo(
    () => ({ items, addItem, setQty, removeItem, clearCart, qtyOf, subtotal, count, syncing }),
    [items, addItem, setQty, removeItem, clearCart, qtyOf, subtotal, count, syncing],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
