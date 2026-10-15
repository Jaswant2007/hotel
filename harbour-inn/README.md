# Harbour Inn — Passwordless Email-OTP Authentication System

Production-ready, security-audited passwordless email-OTP authentication and session management system built for **Harbour Inn**, a coastal boutique hotel direct-booking web application.

---

## 🏛️ System Architecture

* **Front End**: React 18 + TypeScript + Tailwind CSS (configured with the Harbour Inn design tokens: `Newsreader` + `Figtree`, Teal `#1F4E4A`, Terracotta `#9A5B2E`, 48px inputs, 8px radius, WCAG 2.2 AA).
* **Back End API**: Node.js + Express (TypeScript, REST `/api/v1`), structured in clean domain layers with strict Zod validation.
* **Database**: PostgreSQL with standard relational migrations (`users`, `otp_codes`, `refresh_tokens`, `audit_log`).
* **Cache & Limiter**: Redis sliding-window rate limiter with seamless in-memory fallback for local development.
* **Email Delivery**: Asynchronous Nodemailer engine with retry logic, exponential backoff, and Mailpit sandbox integration.
* **Tokens & Sessions**: Short-lived JWT Access Tokens (15 min) + Rotating Refresh Tokens (30 days) delivered via `HttpOnly`, `Secure`, `SameSite=Lax` cookies, with automatic token-family reuse detection.

---

## ⚡ Quick Start with Docker Compose

The fastest way to spin up PostgreSQL, Redis, and Mailpit:

```bash
cd harbour-inn

# 1. Start Postgres, Redis, and Mailpit
docker compose up -d

# 2. Setup Server
cd server
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# 3. Setup Client (in a separate terminal)
cd ../client
npm install
npm run dev
```

* **Web Application**: [http://localhost:5173](http://localhost:5173)
* **API Server**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
* **Mailpit (View Sent OTP Emails)**: [http://localhost:8025](http://localhost:8025)

---

## 🔑 Authentication User Flows

### 1. Sign Up (New Guest)
1. Navigate to [http://localhost:5173](http://localhost:5173) and click **"Create an account"** or **"Reserve Your Stay"**.
2. Enter Name, Email, and check the GDPR Consent checkbox.
3. A single-use 6-digit code is dispatched to the inbox.
4. View the email in Mailpit at [http://localhost:8025](http://localhost:8025) (or the server terminal console).
5. Enter the code in the 6-box input. The system validates the code, marks the email verified, issues HttpOnly cookies, and logs the guest in.

### 2. Log In (Existing Guest)
1. Click **"Sign In"** in the top navigation.
2. Enter your registered email address (`guest@harbourinn-hotel.com`).
3. Enter the 6-digit code received.

### 3. Session Revocation & Device Management
1. Click the guest initials avatar in the top right -> **"Profile & Device Sessions"**.
2. Review all active devices.
3. Click the trash icon to revoke a specific device, or **"Log Out All Devices"** to invalidate all refresh token families.

---

## 🧪 Running Tests

The test suite covers unit tests for OTP cryptography, sliding-window rate limits, and integration tests for refresh token rotation and reuse detection:

```bash
cd harbour-inn/server
npm run test
```

### Test Coverage Highlights:
* `otp.service.test.ts`: Validates `crypto.randomInt` 6-digit range, deterministic HMAC-SHA256 hashing, and `crypto.timingSafeEqual` constant-time comparison.
* `rate-limiter.test.ts`: Validates sliding-window enforcement and `Retry-After` calculation.
* `token.rotation.test.ts`: Simulates legitimate token rotation and verifies that replaying an already-used token instantly triggers **Token Reuse Detection** and revokes the entire token family.

---

## 📚 Deliverables & Documentation Index

* **OpenAPI 3.1 Specification**: [`openapi.yaml`](./openapi.yaml)
* **Postman Collection**: [`Harbour_Inn_Auth.postman_collection.json`](./Harbour_Inn_Auth.postman_collection.json)
* **Sequence Diagrams**: [`docs/SEQUENCE_DIAGRAM.md`](./docs/SEQUENCE_DIAGRAM.md)
* **Security & Threat Model**: [`docs/SECURITY_NOTES.md`](./docs/SECURITY_NOTES.md)
* **Design System Tokens**: [`hotel-design-tokens.json`](./hotel-design-tokens.json)
* **Database Migrations**: [`server/src/db/migrations/`](./server/src/db/migrations/)
