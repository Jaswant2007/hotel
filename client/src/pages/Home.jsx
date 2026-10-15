import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { seedMenu } from '../lib/api'
import MenuItemCard from '../components/MenuItemCard'
import Spinner from '../components/Spinner'

export default function Home() {
  const [popular, setPopular] = useState(() => seedMenu.filter((i) => i.isPopular).slice(0, 6))
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/menu/popular')
      .then((res) => {
        if (res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
          setPopular(res.data.items)
        }
      })
      .catch(() => {
        setOffline(true)
      })
  }, [])

  return (
    <div className="relative overflow-hidden pb-16">
      {offline && (
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-stone-300">
          📡 Offline Demo Mode — Menu &amp; cart are fully operational locally.
        </div>
      )}

      {/* ---------- Hero Section (Editorial Luxury) ---------- */}
      <section className="relative mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div className="relative min-h-[78vh] overflow-hidden rounded-[2.5rem] bg-ink shadow-doppel border border-stone-800/40">
          {/* Background Imagery with rich cinematic grade */}
          <img
            src="/images/dishes/hero.jpg"
            alt="Authentic South Indian feast served on fresh banana leaf at Hotel Sri Vari"
            className="absolute inset-0 h-full w-full object-cover opacity-60 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />

          {/* Hero Content Container */}
          <div className="relative z-10 flex min-h-[78vh] flex-col justify-end p-6 sm:p-12 lg:p-16 max-w-3xl">
            {/* Micro Eyebrow Tag */}
            <div className="w-fit inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-1.5 backdrop-blur-md animate-fade-up">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200">
                Heritage South Indian Dining · Estd. 1998
              </span>
            </div>

            {/* Editorial Headline */}
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-cream-50 sm:text-6xl lg:text-7xl leading-[1.08] animate-fade-up">
              The soul of Mylapore, <br />
              <span className="italic font-normal text-amber-200/90 font-display">delivered hot</span> to your table.
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-stone-300 animate-fade-up font-light">
              Steaming Mallipoo idlis, crisp golden ghee roast dosas, and fragrant Chettinad specialties.
              Stone-ground daily and cooked with heirloom recipes.
            </p>

            {/* Action Buttons (Button-in-Button Pattern) */}
            <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up">
              <button
                onClick={() => navigate('/menu')}
                className="btn-island"
              >
                <span>Explore Full Menu</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </button>

              <a
                href="#heritage"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:border-white/40 active:scale-95 transition-all duration-300"
              >
                Our Heritage Story
              </a>
            </div>

            {/* Feature Highlights Strip */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-white/10 text-xs font-medium text-stone-300">
              <span className="inline-flex items-center gap-2">
                <span className="text-amber-400">✦</span> 30–45 Min Swift Delivery
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-amber-400">✦</span> Pure Ghee &amp; Cast Bronze Simmer
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-amber-400">✦</span> 10% Off First Order
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Popular Dishes (Double-Bezel Grid) ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 lg:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-stone-200/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
              <span>Signature Selections</span>
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
              What Chennai orders on repeat
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-lg">
              Freshly prepared across our breakfast, afternoon meals, and dinner tiffin slots.
            </p>
          </div>

          <Link
            to="/menu"
            className="btn-island-outline self-start sm:self-auto shrink-0"
          >
            <span>Browse Full Menu</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {error && <p className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-700 border border-red-200">{error}</p>}

        {!popular && !error && (
          <div className="mt-12 py-16">
            <Spinner label="Curating today’s kitchen specials…" full />
          </div>
        )}

        {popular && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((item) => (
              <MenuItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Heritage Bento Grid (The Sri Vari Standard) ---------- */}
      <section id="heritage" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700 bg-brand-50 border border-brand-200/60">
            The Sri Vari Philosophy
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
            Heirloom recipes, zero compromises
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            Behind every plate of crispy dosa and fragrant sambar lies 25+ years of daily devotion to South Indian culinary tradition.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Item 1: Large Featured Card */}
          <div className="md:col-span-2 doppel-shell group">
            <div className="doppel-core h-full flex flex-col justify-between p-8 sm:p-10 relative overflow-hidden">
              <div className="relative z-10 max-w-md">
                <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-wider">
                  Morning 4:00 AM Tradition
                </span>
                <h3 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold text-ink">
                  The Bronze Urli Sambar Simmer
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  We don’t use shortcuts or pre-packaged pastes. Every morning begins with small shallots, fresh drumstick, and Madras coriander seeds ground fresh on granite mills, slow-simmered in traditional heavy bronze vessels.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-6 pt-6 border-t border-stone-100 relative z-10">
                <div>
                  <span className="block font-display text-2xl font-bold text-brand-700 tabular-nums">14 hrs</span>
                  <span className="text-xs text-stone-500 font-medium">Batter fermentation</span>
                </div>
                <div className="h-8 w-px bg-stone-200" />
                <div>
                  <span className="block font-display text-2xl font-bold text-brand-700 tabular-nums">100%</span>
                  <span className="text-xs text-stone-500 font-medium">Pure Desi Ghee</span>
                </div>
                <div className="h-8 w-px bg-stone-200" />
                <div>
                  <span className="block font-display text-2xl font-bold text-brand-700 tabular-nums">0</span>
                  <span className="text-xs text-stone-500 font-medium">Artificial additives</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Item 2: Filter Kaapi Craft */}
          <div className="doppel-shell group">
            <div className="doppel-core h-full flex flex-col justify-between p-8 sm:p-10 bg-gradient-to-br from-amber-50/60 to-white">
              <div>
                <span className="chip bg-amber-100 text-amber-900 text-[10px] uppercase tracking-wider">
                  The Chennai Ritual
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold text-ink">
                  Kumbakonam Degree Filter Kaapi
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  Drip-brewed from shade-grown Chikmagalur plantation beans with 15% chicory blend. Served piping hot with thick frothy milk.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Brewed fresh each hour</span>
                <span className="text-lg">☕</span>
              </div>
            </div>
          </div>

          {/* Bento Item 3: Banana Leaf Meals */}
          <div className="doppel-shell group">
            <div className="doppel-core h-full flex flex-col justify-between p-8">
              <div>
                <span className="chip bg-leaf-100 text-leaf-800 text-[10px] uppercase tracking-wider">
                  Afternoon Feast
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-ink">
                  Banana Leaf Saapadu
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  Kootu, poriyal, rasam, appalam, vadai, and paayasam. The gold standard of Tamil Nadu midday dining.
                </p>
              </div>
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-leaf-700">
                <span>Available 11:30 AM – 3:30 PM</span>
              </div>
            </div>
          </div>

          {/* Bento Item 4: Chettinad Night Tiffin */}
          <div className="md:col-span-2 doppel-shell group">
            <div className="doppel-core h-full flex flex-col sm:flex-row items-center justify-between p-8 sm:p-10 gap-6">
              <div className="max-w-md">
                <span className="chip bg-brand-100 text-brand-800 text-[10px] uppercase tracking-wider">
                  Evening &amp; Dinner
                </span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                  Flaky Parottas &amp; Fiery Kurma
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Hand-tossed flaky layered parottas paired with slow-simmered Chettinad salna and spicy egg or vegetable roast.
                </p>
              </div>
              <button
                onClick={() => navigate('/menu')}
                className="btn-island shrink-0"
              >
                <span>Order Dinner Now</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Final High-End CTA Banner ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="doppel-shell p-2 sm:p-3 bg-gradient-to-r from-brand-900 via-brand-800 to-ink">
          <div className="rounded-[calc(2rem-0.375rem)] bg-gradient-to-r from-brand-800/90 to-ink/90 p-8 sm:p-16 text-center text-white relative overflow-hidden border border-white/10 shadow-2xl">
            {/* Subtle background glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="chip bg-white/20 text-white backdrop-blur-md px-3.5 py-1 text-[11px] uppercase tracking-[0.2em]">
                First Order Privilege
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
                Craving honest South Indian food?
              </h2>
              <p className="mt-3 text-stone-200 text-base sm:text-lg leading-relaxed font-light">
                Order now and enjoy an automatic <strong>10% discount</strong> on your first order. Packed securely in insulated containers so it arrives piping hot.
              </p>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => navigate('/menu')}
                  className="inline-flex items-center justify-between gap-4 rounded-full bg-white px-8 py-4 text-sm font-bold text-ink shadow-2xl hover:bg-stone-100 active:scale-95 transition-all duration-300 ease-fluid group"
                >
                  <span>Begin Your Order</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white transition-transform duration-300 group-hover:translate-x-1">
                    ↗
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
