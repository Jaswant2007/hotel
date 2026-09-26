import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const linkCls = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-semibold transition ${
    isActive ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-brand-50 hover:text-brand-700'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const doLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  const nav = (
    <>
      <NavLink to="/" className={linkCls} onClick={() => setOpen(false)} end>
        Home
      </NavLink>
      <NavLink to="/menu" className={linkCls} onClick={() => setOpen(false)}>
        Menu
      </NavLink>
      {user && (
        <NavLink to="/orders" className={linkCls} onClick={() => setOpen(false)}>
          My Orders
        </NavLink>
      )}
      {user?.role === 'staff' && (
        <NavLink to="/staff" className={linkCls} onClick={() => setOpen(false)}>
          Kitchen
        </NavLink>
      )}
      {user ? (
        <>
          <NavLink to="/profile" className={linkCls} onClick={() => setOpen(false)}>
            Profile
          </NavLink>
          <button onClick={doLogout} className="rounded-full px-3 py-1.5 text-sm font-semibold text-stone-500 hover:bg-stone-100">
            Logout
          </button>
        </>
      ) : (
        <NavLink to="/login" className={linkCls} onClick={() => setOpen(false)}>
          Login
        </NavLink>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-display text-lg font-extrabold text-white">
            SV
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold text-ink">Hotel Sri Vari</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
              South Indian · Chennai
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">{nav}</nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/cart')}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white hover:border-brand-300"
            aria-label="Open cart"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-700">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-700">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          {nav}
        </nav>
      )}
    </header>
  )
}
