import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import MenuItemCard from '../components/MenuItemCard'
import Spinner from '../components/Spinner'

export default function Home() {
  const [popular, setPopular] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/menu/popular')
      .then((res) => setPopular(res.data.items))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <img src="/images/dishes/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <div className="relative mx-auto flex min-h-[74vh] max-w-6xl flex-col justify-center px-4 py-20 text-white">
          <span className="w-fit animate-fade-up rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
            Since 1998 · Mylapore, Chennai
          </span>
          <h1 className="mt-5 max-w-2xl animate-fade-up font-display text-5xl font-extrabold leading-[1.05] drop-shadow-lg sm:text-6xl md:text-7xl" style={{ animationDelay: '.08s' }}>
            Hotel Sri Vari
          </h1>
          <p className="mt-4 max-w-xl animate-fade-up text-lg leading-relaxed text-stone-200 sm:text-xl" style={{ animationDelay: '.16s' }}>
            Authentic South Indian tiffin & meals — steaming idlis, crispy dosas and Dum biryani,
            cooked fresh and delivered hot to your door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '.24s' }}>
            <button onClick={() => navigate('/menu')} className="btn bg-brand-600 px-8 py-3.5 text-base font-bold text-white hover:bg-brand-500 shadow-pop">
              Order Now →
            </button>
            <a href="#about" className="btn border border-white/40 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10">
              Our Story
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-stone-300 animate-fade-up" style={{ animationDelay: '.32s' }}>
            <span>✓ 30–45 min delivery</span>
            <span>✓ Free delivery above ₹500</span>
            <span>✓ 10% off your first order</span>
          </div>
        </div>
      </section>

      {/* ---------- Popular dishes ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-ink">Popular dishes</h2>
            <p className="mt-1 text-stone-500">What Chennai orders on repeat</p>
          </div>
          <Link to="/menu" className="btn-outline shrink-0">
            Full menu →
          </Link>
        </div>

        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!popular && !error && (
          <div className="mt-8">
            <Spinner label="Fetching today’s specials…" full />
          </div>
        )}
        {popular && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((item) => (
              <MenuItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- About ---------- */}
      <section id="about" className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
          <div className="relative">
            <img src="/images/dishes/about.jpg" alt="Dosa being prepared at Hotel Sri Vari" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card" />
            <div className="absolute -bottom-5 -right-2 rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-pop sm:right-6">
              <p className="font-display text-2xl font-extrabold leading-none">25+ yrs</p>
              <p className="text-xs font-semibold">of filter coffee & tiffin</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">About us</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">
              A small hotel with a big heart
            </h2>
            <p className="mt-4 leading-relaxed text-stone-600">
              Hotel Sri Vari started as a six-table tiffin room in Mylapore. Three generations later,
              the same stone-ground batter, the same 4 a.m. sambar simmer, and the same Chettinad
              masala pounded fresh every morning.
            </p>
            <p className="mt-3 leading-relaxed text-stone-600">
              Now you can order it online — from the first filter coffee of the day to the last
              parotta of the night — and we’ll rush it to your doorstep across Chennai.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ['3', 'Meal slots daily'],
                ['21+', 'Menu items'],
                ['4.8★', 'Local rating'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="font-display text-2xl font-extrabold text-brand-700">{n}</p>
                  <p className="text-[11px] font-semibold text-stone-500">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-amber-500 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Hungry already?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Your first order gets an automatic <strong>10% discount</strong>. Fresh food, honest
            prices, delivered across Chennai.
          </p>
          <button onClick={() => navigate('/menu')} className="btn mt-6 bg-white px-10 py-3.5 text-base font-bold text-brand-700 hover:bg-stone-100">
            Browse the menu
          </button>
        </div>
      </section>
    </div>
  )
}
