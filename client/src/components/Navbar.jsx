import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const linkCls = ({ isActive }) =>
  `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-fluid ${
    isActive
      ? 'bg-brand-600 text-white shadow-sm'
      : 'text-stone-700 hover:bg-stone-100/80 hover:text-brand-700'
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

  const navLinks = (
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
          <button
            onClick={doLogout}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
          >
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
    <div className="sticky top-4 z-40 px-4">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between rounded-full border border-stone-200/80 bg-white/85 px-4 shadow-[0_10px_35px_-10px_rgba(24,20,18,0.12)] backdrop-blur-xl transition-all duration-300">
        <Link to="/" className="flex items-center gap-2.5 pl-1.5" onClick={() => setOpen(false)}>
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm ring-2 ring-brand-100">
            <span className="font-display text-base font-extrabold italic tracking-tight">SV</span>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold tracking-tight text-ink">Hotel Sri Vari</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.24em] text-brand-700">
              Mylapore · Chennai
            </span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex bg-stone-100/70 p-1 rounded-full border border-stone-200/50">
          {navLinks}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 pr-1">
          <button
            onClick={() => navigate('/cart')}
            className="relative flex h-10 items-center gap-2 rounded-full border border-stone-200/80 bg-white px-3.5 text-stone-800 shadow-sm transition-all duration-300 hover:border-brand-300 hover:bg-brand-50/50 active:scale-95 group"
            aria-label="Open cart"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:scale-110 text-stone-700"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="text-xs font-bold text-stone-700 hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white shadow-pop">
                {count}
              </span>
            )}
          </button>

          {/* Mobile hamburger button with morph animation */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-stone-200/80 bg-white text-stone-700 shadow-sm hover:bg-stone-50 md:hidden active:scale-95 transition"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {open && (
        <div className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-3xl border border-stone-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl md:hidden animate-fade-up">
          <nav className="flex flex-col gap-1.5">
            {navLinks}
          </nav>
        </div>
      )}
    </div>
  )
}
