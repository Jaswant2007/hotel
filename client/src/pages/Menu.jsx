import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { loadSeed } from '../lib/api'
import MenuItemCard from '../components/MenuItemCard'
import Spinner from '../components/Spinner'

const TABS = [
  { id: 'morning', label: 'Morning', time: '6:30 AM – 11:00 AM', emoji: '🌄' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM – 3:30 PM', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', time: '7:00 PM – 10:30 PM', emoji: '🌙' },
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
    setItems(null)
    setError('')
    api
      .get('/menu', { params: { category: active } })
      .then((res) => !cancelled && setItems(res.data.items))
      .catch(() =>
        // API unreachable → static seed fallback
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
    setActive(id)
    setParams({ slot: id }, { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-ink">Our Menu</h1>
        <p className="mt-1 text-stone-500">Freshly cooked to order · Chennai-style pricing</p>
        {offline && (
          <p className="mx-auto mt-3 inline-block rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-stone-300">
            📡 Static demo — prices &amp; dishes shown; live ordering runs in the Arena LIVE PREVIEW
          </p>
        )}
      </header>

      {/* Tabs */}
      <div className="no-scrollbar mt-6 flex justify-start gap-2 overflow-x-auto sm:justify-center">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
              active === t.id
                ? 'bg-ink text-white shadow-card'
                : 'border border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-stone-400">
        {activeTab.label} service · {activeTab.time}
      </p>

      {/* Items */}
      {error && (
        <div className="mx-auto mt-8 max-w-lg rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}
      {!items && !error && (
        <div className="mt-10">
          <Spinner label="Loading the menu…" full />
        </div>
      )}
      {items && items.length === 0 && (
        <p className="mt-10 text-center text-stone-500">No items in this slot right now. Check back soon!</p>
      )}
      {items && items.length > 0 && (
        <div key={active} className="mt-8 grid animate-fade-up gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MenuItemCard key={item._id} item={item} />
          ))}
        </div>
      )}

      <p className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-800">
        ※ Menu prices are Chennai-area pricing and are demo data — confirm with the hotel before going live.
      </p>
    </div>
  )
}
