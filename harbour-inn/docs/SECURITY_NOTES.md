# Harbour Inn Authentication Security Architecture & Threat Analysis

This document details the threat models, cryptographic standards, defensive layers, and email deliverability records implemented across the Harbour Inn Email-OTP authentication system.

---

## 1. Threats Addressed & Defensive Mitigations

| Threat Vector | Attack Scenario | Implemented Mitigation |
| :--- | :--- | :--- |
| **Credential Stuffing / Stolen Passwords** | Attackers use breached password databases from other sites to compromise guest accounts. | **Completely Eliminated**: Passwordless architecture. No passwords exist in database or transit. |
| **Phishing / Magic Link Hijacking** | Phishing kits intercept or rewrite clickable sign-in URLs. | **No Clickable Links**: Emails contain ONLY a plain 6-digit numeric code. Guests must manually type or copy the code onto the booking portal. |
| **OTP Brute-Force & Guessing** | Botnet tests 1,000,000 combinations to guess a 6-digit code. | **Attempt Thresholding + Sliding Limit**: Locked after 5 incorrect verification attempts. Maximum 3 OTP requests per 15 minutes per email, and 10 per hour per IP. |
| **Timing Side-Channel Attacks** | Attacker measures microseconds taken to compare hashes to deduce the valid token character-by-character. | **Constant-Time Comparison**: Comparison implemented via `crypto.timingSafeEqual` on fixed-length HMAC byte buffers. |
| **Database Breach / Hash Cracking** | Attacker dumps the database and attempts offline dictionary or rainbow table attacks on OTPs. | **Server-Peppered HMAC-SHA256**: Codes are hashed with `OTP_HMAC_SECRET` stored only in server environment variables. Plain OTPs are NEVER written to disk or logs. |
| **Token Theft & Replay (XSS)** | Malicious script attempts to read tokens from `localStorage`. | **HttpOnly + Secure Cookies**: Access and refresh tokens are stored in `HttpOnly` cookies, completely inaccessible to JavaScript execution. |
| **Refresh Token Interception & Replay** | Attacker intercepts a rotating refresh token over the wire or via a compromised proxy. | **Token Family Reuse Detection**: Refresh tokens form a linked family. If an already-rotated token is submitted again, the entire family is immediately revoked and logged to the security audit trail. |
| **Cross-Site Request Forgery (CSRF)** | Third-party website triggers unauthorized booking cancellation or session logout. | **Double-Submit CSRF Token**: Custom header `X-CSRF-Token` validated against signed cookie for all non-safe HTTP methods. |
| **User Enumeration** | Attacker queries the endpoint with email lists to detect whether individuals have visited or booked at Harbour Inn. | **Uniform Generic Responses**: `POST /auth/otp/request` returns identical status codes, copy, and latency regardless of whether an account exists. |
| **Throwaway / Disposable Email Spam** | Attackers flood the booking system using temporary disposable inboxes (Mailinator, 10MinuteMail). | **Disposable Domain Filtering**: Email validation rejects disposable domains via strict domain blocklists before OTP generation. |

---

## 2. Cryptographic Specifications

1. **Random Number Generation**:
   ```typescript
   // Cryptographically strong pseudo-random integer in range [100000, 999999]
   crypto.randomInt(100000, 1000000).toString();
   ```
2. **Keyed Hash (HMAC-SHA256)**:
   ```typescript
   crypto.createHmac('sha256', process.env.OTP_HMAC_SECRET)
         .update(code.trim())
         .digest('hex');
   ```
3. **Constant-Time Buffer Comparison**:
   ```typescript
   const bufA = Buffer.from(candidateHash, 'hex');
   const bufB = Buffer.from(storedHash, 'hex');
   crypto.timingSafeEqual(bufA, bufB);
   ```

---

## 3. Email Deliverability & Anti-Spoofing Guide (SPF, DKIM, DMARC)

To prevent hotel verification emails from landing in spam filters or being rejected by strict corporate mail servers, configure the following DNS records on your domain registrar:

### 1. SPF (Sender Policy Framework)
Authorizes your designated mail servers to send on behalf of `harbourinn-hotel.com`:
```dns
Type: TXT
Host: @
Value: "v=spf1 include:_spf.resend.com include:amazonses.com ~all"
```

### 2. DKIM (DomainKeys Identified Mail)
Cryptographically signs outgoing messages to prove they have not been tampered with:
```dns
Type: CNAME
Host: resend._domainkey.harbourinn-hotel.com
Value: dkim.resend.com
```

### 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)
Instructs receiving mailboxes how to handle failed SPF/DKIM checks:
```dns
Type: TXT
Host: _dmarc.harbourinn-hotel.com
Value: "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@harbourinn-hotel.com; aspf=r;"
```

---

## 4. Remaining Risks & Recommended Hardening

1. **Email Provider Compromise**: If the guest's personal email account is compromised, the attacker can receive the OTP. Recommend offering optional WebAuthn / Passkeys for high-tier loyalty members.
2. **Aggressive Distributed Botnets**: While IP rate limits block individual attackers, distributed proxy networks can bypass single-IP limits. Recommend enabling Cloudflare Turnstile or hCaptcha after 2 consecutive failed attempts.
3. **Database Encryption at Rest**: Enable AWS RDS / PostgreSQL transparent data encryption (TDE) for the physical disk volume.
