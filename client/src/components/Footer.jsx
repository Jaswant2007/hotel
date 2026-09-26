export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-display text-lg font-extrabold text-white">
              SV
            </span>
            <span className="font-display text-xl font-extrabold text-white">Hotel Sri Vari</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            A small family hotel serving honest South Indian food — soft idlis in the morning,
            unlimited meals at noon, and fiery Chettinad dinners.
          </p>
        </div>

        <div>
          <h4 className="font-display text-base font-bold text-white">Delivery areas</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-400">
            <li>Central Chennai · 600001–600006 — ₹20</li>
            <li>Greater Chennai · select pincodes — ₹30</li>
            <li>Nearby areas · select pincodes — ₹40</li>
            <li className="text-leaf-500">Free delivery on orders above ₹500</li>
            <li>Pickup from the hotel — ₹0</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-bold text-white">Contact</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-400">
            <li>12, Temple Street, Mylapore</li>
            <li>Chennai, Tamil Nadu 600004</li>
            <li>📞 +91 98400 12345</li>
            <li>✉️ order@hotelsrivar.in</li>
            <li className="text-stone-500">Open daily · 6:30 AM – 10:30 PM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Hotel Sri Vari · Chennai · Prices include GST · Demo project
      </div>
    </footer>
  )
}
