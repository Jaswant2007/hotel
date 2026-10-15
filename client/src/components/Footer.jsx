export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-300/40 bg-[#161210] text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand Column */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm ring-2 ring-brand-100/20">
              <span className="font-display text-base font-extrabold italic tracking-tight">SV</span>
            </span>
            <span className="leading-tight">
              <span className="block font-display text-xl font-bold tracking-tight text-white">Hotel Sri Vari</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-brand-400">
                Heritage South Indian · Mylapore
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400 font-light">
            An authentic family kitchen serving honest South Indian delicacies since 1998 — stone-ground batter, 4 AM bronze urli sambar, and traditional Kumbakonam degree filter coffee.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-300/90">
            <span>✦ Pure Desi Ghee</span>
            <span>·</span>
            <span>✦ 100% Traditional Prep</span>
            <span>·</span>
            <span>✦ Mylapore, Chennai</span>
          </div>
        </div>

        {/* Delivery Zones */}
        <div>
          <h4 className="font-display text-base font-bold text-white tracking-wide">Delivery Zones</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-stone-400">
            <li className="flex justify-between">
              <span>Central Chennai (600001–06)</span>
              <span className="text-stone-300 font-bold tabular-nums">₹20</span>
            </li>
            <li className="flex justify-between">
              <span>Greater Chennai</span>
              <span className="text-stone-300 font-bold tabular-nums">₹30</span>
            </li>
            <li className="flex justify-between">
              <span>Extended Suburbs</span>
              <span className="text-stone-300 font-bold tabular-nums">₹40</span>
            </li>
            <li className="pt-2 text-leaf-400 font-semibold border-t border-stone-800">
              ✓ Free delivery on orders above ₹500
            </li>
          </ul>
        </div>

        {/* Contact & Hours */}
        <div>
          <h4 className="font-display text-base font-bold text-white tracking-wide">The Dining Room</h4>
          <ul className="mt-4 space-y-2 text-xs text-stone-400">
            <li>12, Temple Street, Near Kapaleeshwarar Temple</li>
            <li>Mylapore, Chennai 600004</li>
            <li className="pt-1 text-stone-200 font-medium tabular-nums">📞 +91 98400 12345</li>
            <li className="text-stone-200">✉️ order@hotelsrivar.in</li>
            <li className="mt-2 text-[11px] text-amber-300/80 font-semibold">
              Open Daily · 6:30 AM – 10:30 PM
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-800/80 py-6 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Hotel Sri Vari · Mylapore, Chennai · All rights reserved
      </div>
    </footer>
  )
}
