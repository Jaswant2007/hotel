import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { loadSeed } from '../lib/api'
import MenuItemCard from '../components/MenuItemCard'
import Spinner from '../components/Spinner'

const TABS = [
  { id: 'morning', label: 'Morning Tiffin', time: '6:30 AM – 11:00 AM', emoji: '🌄', subtitle: 'Idlis, Dosas & Filter Kaapi' },
  { id: 'afternoon', label: 'Afternoon Feast', time: '12:00 PM – 3:30 PM', emoji: '☀️', subtitle: 'Saapadu & Biryani' },
  { id: 'dinner', label: 'Dinner Tiffin', time: '7:00 PM – 10:30 PM', emoji: '🌙', subtitle: 'Parottas & Chettinad' },
]

function slotByClock() {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 16) return 'afternoon'
  return 'dinner'
}

export default function Menu() {
  const [params, setParams] = useSearchParams()
  const initial = TABS.some((t) => t.id === params.get('slot')) ? params.get('slot') : slotByClock()
  const [active, setActive] = useState(initial)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError('')
    api
      .get('/menu', { params: { category: active } })
      .then((res) => !cancelled && setItems(res.data.items))
      .catch(() =>
        loadSeed()
          .then((seed) => {
            if (cancelled) return
            setOffline(true)
            setItems(seed.filter((i) => i.category === active))
          })
          .catch(() => !cancelled && setError('Could not load the menu right now.')),
      )
    return () => {
      cancelled = true
    }
  }, [active])

  const activeTab = useMemo(() => TABS.find((t) => t.id === active), [active])

  const pick = (id) => {
    if (id === active) return
    setActive(id)
    setItems(null)
    setParams({ slot: id }, { replace: true })
  }

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
            📡 Offline Mode — Local dishes and ordering fully accessible.
          </p>
        )}
      </header>

      {/* Double-Bezel Tab Selector */}
      <div className="mt-10 flex justify-center">
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
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot Time Eyebrow */}
      <div className="mt-4 text-center">
        <p className="text-xs font-semibold text-stone-500 tracking-wide">
          {activeTab.label} Service · <span className="text-brand-700 font-bold tabular-nums">{activeTab.time}</span>
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {!items && !error && (
        <div className="mt-16 py-12">
          <Spinner label={`Loading ${activeTab.label} specialties…`} full />
        </div>
      )}

      {/* Empty state */}
      {items && items.length === 0 && (
        <div className="mt-16 text-center py-12 rounded-3xl border border-dashed border-stone-300 bg-stone-50">
          <p className="text-stone-600 font-medium">No items currently available in this slot.</p>
        </div>
      )}

      {/* Items Grid */}
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
