import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { seedMenu } from '../lib/api'
import MenuItemCard from '../components/MenuItemCard'

const TABS = [
  {
    id: 'morning',
    label: 'Morning Tiffin',
    time: '6:30 AM – 11:00 AM',
    emoji: '🌄',
    subtitle: 'Idlis, Dosas & Filter Kaapi',
    canOrder: false,
    badgeText: 'Orders Closed',
  },
  {
    id: 'afternoon',
    label: 'Afternoon Feast',
    time: '12:00 PM – 3:30 PM',
    emoji: '☀️',
    subtitle: 'Saapadu & Biryani',
    canOrder: false,
    badgeText: 'Orders Closed',
  },
  {
    id: 'dinner',
    label: 'Night Tiffin',
    time: '7:00 PM – 10:30 PM',
    emoji: '🌙',
    subtitle: 'Parottas & Chettinad Specials',
    canOrder: true,
    badgeText: '🟢 Orderable Now',
  },
]

export default function Menu() {
  const [params, setParams] = useSearchParams()
  // Default to slot in URL, or 'dinner' (Night Tiffin) where ordering is active
  const initial = TABS.some((t) => t.id === params.get('slot')) ? params.get('slot') : 'dinner'
  const [active, setActive] = useState(initial)
  
  // Instant hydration from bundled seedMenu — zero loading lockup or delay
  const [items, setItems] = useState(() => seedMenu.filter((i) => i.category === initial))
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError('')
    // Best effort background sync with server if available
    api
      .get('/menu', { params: { category: active } })
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
          setItems(res.data.items)
        }
      })
      .catch(() => {
        if (!cancelled) setOffline(true)
      })
    return () => {
      cancelled = true
    }
  }, [active])

  const activeTab = useMemo(() => TABS.find((t) => t.id === active) || TABS[2], [active])

  const pick = (id) => {
    if (id === active) return
    setActive(id)
    // Instant switch with zero delay
    setItems(seedMenu.filter((i) => i.category === id))
    setParams({ slot: id }, { replace: true })
  }

  const isNight = active === 'dinner'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
      {/* Header */}
      <header className="text-center max-w-2xl mx-auto">
        <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-[0.2em] px-3.5 py-1">
          Daily Kitchen Menu
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-ink">
          Authentic Mylapore Flavours
        </h1>
        <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
          Prepared in traditional cast bronze urlis with pure stone-ground batter and fresh ghee.
        </p>
        {offline && (
          <p className="mx-auto mt-4 inline-block rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-stone-300">
            📡 Offline Mode — All items &amp; Night Tiffin ordering fully active.
          </p>
        )}
      </header>

      {/* Double-Bezel Tab Selector */}
      <div className="mt-10 flex flex-col items-center">
        <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-stone-200/70 p-1.5 border border-stone-300/50 shadow-inner">
          {TABS.map((t) => {
            const isSel = active === t.id
            return (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-fluid ${
                  isSel
                    ? 'bg-brand-600 text-white shadow-pop'
                    : 'bg-transparent text-stone-700 hover:text-ink hover:bg-white/60'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                    t.canOrder
                      ? isSel
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                      : isSel
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-300/60 text-stone-600'
                  }`}
                >
                  {t.canOrder ? 'Order Now' : 'Price View'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Slot Time & Status Eyebrow */}
        <div className="mt-4 text-center">
          <p className="text-xs font-semibold text-stone-500 tracking-wide">
            {activeTab.label} Service · <span className="text-brand-700 font-bold tabular-nums">{activeTab.time}</span> ·{' '}
            {activeTab.canOrder ? (
              <span className="text-emerald-700 font-bold">🟢 Online Ordering Open</span>
            ) : (
              <span className="text-stone-500 font-medium">Viewing &amp; Prices Only (Orders Closed)</span>
            )}
          </p>
        </div>
      </div>

      {/* Service Status Notification Banner */}
      {!isNight ? (
        <div className="mt-6 mx-auto max-w-3xl rounded-2xl border border-stone-300/80 bg-stone-100/90 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-stone-200 text-xl shadow-inner">
                {activeTab.emoji}
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span>{activeTab.label} — Menu &amp; Price Preview</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                    Orders Closed
                  </span>
                </h2>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  All dish details and prices are shown below. Ordering is currently reserved for the{' '}
                  <strong className="text-brand-700">Night Tiffin</strong> slot.
                </p>
              </div>
            </div>
            <button
              onClick={() => pick('dinner')}
              className="shrink-0 rounded-full bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-pop hover:bg-brand-700 active:scale-95 transition"
            >
              Order Night Tiffin 🌙
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 mx-auto max-w-3xl rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-950">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-xl">
              🌙
            </span>
            <div>
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Night Tiffin Ordering is Live!</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  Accepting Orders
                </span>
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                Every Night dish below is ready for instant ordering, freshly made on the hot tawa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {items && items.length === 0 && (
        <div className="mt-16 text-center py-12 rounded-3xl border border-dashed border-stone-300 bg-stone-50">
          <p className="text-stone-600 font-medium">No items currently available in this slot.</p>
        </div>
      )}

      {/* Items Grid — displays every dish with price */}
      {items && items.length > 0 && (
        <div key={active} className="mt-10 grid animate-fade-up gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MenuItemCard key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Footnote banner */}
      <div className="mt-14 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-center text-xs text-amber-900 shadow-sm max-w-3xl mx-auto">
        ✦ All tiffins served with fresh coconut chutney, spicy tomato kara chutney &amp; piping hot drumstick sambar.
      </div>
    </div>
  )
}
