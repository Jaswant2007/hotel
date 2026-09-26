# Hotel Sri Vari — Online Food Ordering & Delivery

A full-stack ordering website for **Hotel Sri Vari**, a small South Indian hotel in Mylapore,
Chennai. Customers browse the menu by meal slot (Morning / Afternoon / Dinner), add items to a
cart, get their first-order discount applied automatically, pay online with Razorpay (or cash on
delivery), and track the kitchen status live. Hotel staff get a minimal kitchen queue dashboard
to update order status.

![Stack](https://img.shields.io/badge/stack-React%20%C2%B7%20Express%20%C2%B7%20MongoDB-orange)

## Tech stack

| Layer    | Tech                                                                  |
| -------- | --------------------------------------------------------------------- |
| Frontend | React 19 + Vite, Tailwind CSS, React Router, Axios                     |
| Backend  | Node.js + Express, Mongoose, express-validator, bcryptjs, JSON Web Token |
| Database | MongoDB (wire-protocol)                                               |
| Payments | Razorpay (orders + HMAC signature verification + webhook), COD fallback |

## Project structure

```
hotel/
├── client/          # React SPA (Vite + Tailwind)
│   └── src/
│       ├── pages/       # Home, Menu, Login, Register, Cart, Checkout,
│       │                # Orders, OrderTracking, Profile, StaffDashboard
│       ├── components/  # Navbar, Footer, MenuItemCard, trackers, guards
│       ├── context/     # AuthContext (JWT session), CartContext
│       └── lib/         # axios API client with interceptors
└── server/          # Express REST API
    ├── src/
    │   ├── config/      # Mongo connection
    │   ├── models/      # User, MenuItem, Order, DeliveryZone
    │   ├── middleware/  # JWT protect, staff guard, validation, errors
    │   ├── routes/      # /auth /menu /cart /orders /profile /payment
    │   ├── controllers/ # order creation, pricing, status flow
    │   └── utils/       # pricing, razorpay client, notification hooks
    └── scripts/         # seed.js (menu + zones + staff), smoke.mjs
```

## Quick start

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start a MongoDB-compatible database server (port 27017)
cd server && npm run db          # SQLite-backed, persistent in server/.data/db
#   …or point MONGO_URI at a real mongod/Atlas instance instead.

# 3. Seed menu, delivery zones and the staff account
npm run seed

# 4. Start the API (port 4000)
npm start

# 5. Start the website (port 5173, proxies /api → 4000)
cd ../client && npm run dev
```

Open **http://localhost:5173**.

### Demo accounts

| Role   | Email                  | Password  | Use                         |
| ------ | ---------------------- | --------- | --------------------------- |
| Staff  | staff@hotelsrivar.com  | staff123  | Kitchen queue at `/staff`   |
| Customer | (register on the site) | —       | Gets `isFirstOrder: true` → 10 % off |

> The sandbox has no access to fastdl.mongodb.org, so `npm run db` starts
> **`@rckflr/easydb-server`** — a pure-JS server speaking the real MongoDB wire protocol on
> `127.0.0.1:27017` with SQLite persistence. Mongoose connects exactly as it would to `mongod`;
> to use genuine MongoDB, just run `mongod` and keep `MONGO_URI` unchanged.

## Features

### Customer
- **Home** — hero banner, tagline, *Order Now* CTA, popular dishes, about section, footer with delivery areas/fees.
- **Auth** — register (name, email, phone, password, default address) & login; JWT sessions
  (7 days); new accounts flagged `isFirstOrder: true`.
- **Menu** — Morning / Afternoon / Dinner tabs (auto-selected by clock), veg/non-veg tags,
  images, descriptions, ₹ prices, quantity stepper + add to cart.
- **Cart** — items, quantities, subtotal, empty states; synced to localStorage + server cart API.
- **Checkout** — saved addresses or one-time address, pickup toggle, pincode-based delivery fee
  (₹20 / ₹30 / ₹40 zones, free above ₹500), automatic **10 % first-order discount**, bill
  breakdown `Subtotal → Discount → Delivery Fee → Total`, **Razorpay** online payment
  (demo mode when keys are not configured) or **Cash on Delivery**.
- **Tracking** — status flow *Placed → Confirmed → Preparing → Out for Delivery → Delivered*
  with live polling every 8 s, ETA countdown, status timeline, on-screen confirmation.
- **Profile** — edit name/email/phone, manage addresses, change password, order history with
  status + **reorder**.

### Staff (`/staff`, role-protected)
- Live order queue (auto-refresh), filter by status, one-click advancement along the status
  flow, payment badges, customer notes, address for the rider.

### API overview

```
POST /api/auth/register | /api/auth/login     GET /api/auth/me
GET  /api/menu (?category=)                   GET /api/menu/popular
GET|PUT|DELETE /api/cart
POST /api/orders                              GET /api/orders (?scope=staff&status=)
GET  /api/orders/:id                          PATCH /api/orders/:id/status   [staff]
GET|PATCH /api/profile                        PATCH /api/profile/password
POST /api/profile/addresses                   PATCH|DELETE /api/profile/addresses/:id
GET  /api/payment/config                      POST /api/payment/create-order
POST /api/payment/verify                      POST /api/payment/webhook   (raw + HMAC)
```

**Security:** bcrypt password hashing, express-validator on every input, JWT `protect` guard on
protected routes, separate `staffOnly` guard for status updates, server-side price recomputation
on every order (client prices are never trusted), Razorpay signature verification with
`crypto.timingSafeEqual`, and a raw-body webhook with `RAZORPAY_WEBHOOK_SECRET`.

## Environment (server/.env)

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/hotel_sri_vari
JWT_SECRET=...
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=               # leave blank → demo payment mode
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
DEFAULT_DELIVERY_FEE=20
FREE_DELIVERY_OVER=500
```

See `server/.env.example`.

## Notes

- Menu items & prices are **Chennai-area demo pricing — confirm before going live** (also shown on the Menu page).
- Email/SMS notifications are stubbed as a pluggable hook in `server/src/utils/notify.js`.
- All dish/hero images in `client/public/images/` are placeholders — replace with the hotel’s own photos.
