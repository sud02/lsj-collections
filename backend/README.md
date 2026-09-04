# LSJ Collections — Backend API

REST API for LSJ Collections, a premium hallmark jewellery e-commerce platform based in Tirupati, India.

Stack: **Node.js 20 + Express 4 + MySQL 8 (Hostinger) + PhonePe + Resend**.
(Firebase Admin is still installed but the phone-OTP path it served is commented out — see [Auth](#auth).)

The API connects to an existing production MySQL database on Hostinger. **No migrations** — the schema is already live.

---

## Quick start

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env
# fill in DB, PhonePe, Resend credentials

# 3. whitelist your IP in Hostinger hPanel → Remote MySQL

# 4. run
npm run dev          # development with nodemon
npm start            # production

# 5. verify
curl http://localhost:5000/health
```

Server runs on `http://localhost:5000`. All API endpoints live under `/api`.

---

## Project layout

```
backend/
├── server.js                       entry point
├── src/
│   ├── app.js                      Express app (middleware + routes)
│   ├── config/
│   │   ├── db.js                   mysql2 pool (Hostinger)
│   │   ├── firebase.js             Firebase Admin init (fallback — unused)
│   │   ├── phonepe.js              PhonePe config + endpoints
│   │   └── images.js               CDN URL builders
│   ├── routes/                     thin route definitions
│   ├── controllers/                request handlers
│   ├── middleware/                 auth, validate, error, rate-limit, upload
│   ├── services/                   phonepe, firebase, email, upload
│   └── utils/                      logger, response, hash, sanitize, query
├── uploads/                        local file storage (review/testimonial/customization)
├── .env.example
├── package.json
└── railway.json
```

---

## Environments

Production and development never share data. Which database you get is decided
entirely by `.env` / the host's environment variables — `.env` is gitignored, so
nothing environment-specific is ever committed.

| | Production (Render) | Development (local) |
|---|---|---|
| `NODE_ENV` | `production` | unset / `development` |
| `DB_NAME` | `u529052488_lsj` | `u529052488_lsjdev` |
| Data | real customers and orders | catalogue only, empty customer tables |
| Rate limiters | on | skipped |
| `AUTH_BYPASS_OTP` | ignored — see below | honoured if set |

`utils/environment.js` decides which environment this really is. `NODE_ENV`
alone is not trusted: a host that simply never sets it would leave every
`NODE_ENV !== 'production'` check believing it is in development, silently
enabling the OTP bypass and disabling rate limiting on a live site. So the
**database is the deciding signal** — anything that weakens security for
convenience (`AUTH_BYPASS_OTP`, skipping rate limits) requires *both* a
non-production `NODE_ENV` **and** a throwaway `DB_NAME`. It fails closed.

`config/db.js` enforces this on startup:

- **production + a dev-looking `DB_NAME`** (matching `dev|test|local|staging`, or a
  localhost host) → logs an error and **exits**. Failing fast beats writing real
  orders into a throwaway database; a crashed deploy is not promoted, so the
  previous release keeps serving.
- **development + the live database** → logs a loud warning, because a test
  sign-up there creates a real customer record.

## Development database

`backend/.env` ships pointing at the **live** Hostinger database, so a test
sign-up or checkout run locally creates a real customer row and a real order.
Use a separate dev database instead — the server logs a loud warning at startup
whenever it detects otherwise.

The DB user only has privileges on `u529052488_lsj`, so the database itself must
be created by hand:

1. hPanel → **Databases → MySQL Databases** → create e.g. `u529052488_lsjdev`
   (note the user and password it generates)
2. Put those in `backend/.env` as `DEV_DB_NAME` / `DEV_DB_USER` / `DEV_DB_PASSWORD`
3. Run the clone:

   ```bash
   node scripts/clone-to-dev.js          # add --drop to rebuild existing tables
   ```

4. Point `DB_NAME` / `DB_USER` / `DB_PASSWORD` at the dev database and restart

The clone copies **every table's structure**, but only catalogue rows —
categories, sub_categories, products, product_variations, attributes, ornaments,
features, partners, advertisements, coupons. Customer tables (`users`, `orders`,
`order_products`, `cart`, `wishlist`, `ratings`, `testimonials`, `contact`,
`subscriptions`, `admin`) are created empty by design, so nothing personal is
ever copied out of production. The source database is only ever read from.

Seed a dev admin with `node scripts/create-admin.js` once pointed at the dev DB.

## API endpoints

Base URL: `/api`

### Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/email/request-otp` | Public | Email a 6-digit code, return a signed `otp_token` (5 requests/15min per address) |
| POST | `/auth/email/verify-otp` | Public | Verify `otp_token` + code, create the account if new, issue JWT |
| POST | `/auth/admin-login` | Public | Admin portal email + password |
| POST | `/auth/complete-profile` | Auth | Update name/email/mobile/address |
| GET  | `/auth/me` | Auth | Current user |
| POST | `/auth/logout` | Auth | Client drops token |
| ~~POST~~ | ~~`/auth/phone-login`~~ | — | Firebase phone OTP — commented out, see below |

#### Customer sign-in — email OTP

Customers sign in with a one-time code emailed by **Resend**; there is no password.
First verification creates the account, so sign-up and sign-in are the same flow.

```
POST /auth/email/request-otp  { email }
  → { otp_token, email, expires_in, is_registered }
POST /auth/email/verify-otp   { otp_token, code }
  → { token, user, is_new }        // is_new → show the profile step
```

Codes are **not stored in MySQL** (the Hostinger schema is live and we don't run
migrations). `otp_token` carries the address and expiry in the clear plus an HMAC
over the payload *and* the code — the code itself can't be recovered from it, and
verification recomputes the HMAC with whatever the user typed
(`src/services/otp.service.js`). Defences:

| Layer | Limit |
|---|---|
| `otpRequestLimiter` | 5 code requests / 15 min, keyed on the email address |
| `otpVerifyLimiter` | 15 verification attempts / 15 min per IP |
| Signed token | 5 wrong guesses, 10-minute expiry, single-use after success |

Tune with `OTP_TTL_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_SECRET` (defaults to `JWT_SECRET`).
Set `AUTH_BYPASS_OTP=true` to skip the email entirely and accept `AUTH_BYPASS_CODE`
during local development.

**Cost:** Resend's free tier covers 3,000 emails/month (100/day) — enough for the
current volume, since one sign-in is one email. Beyond that it's $20/month for
50k. If sign-ins ever outgrow that, Amazon SES is ~$0.10 per 1,000 emails and
`email.service.js` is the only file that would change.

#### Firebase phone OTP (fallback)

Mobile-number sign-in is left in the tree, commented out, so it can be restored:
`config/firebase.js`, `services/firebase.service.js`, and the `phoneLogin` handler,
`phoneLoginSchema` and `/phone-login` route in `controllers/auth.controller.js` /
`routes/auth.routes.js`. Uncomment those four spots and restore the
`FIREBASE_*` env vars. `/auth/dev-login` (phone + fixed code, gated on
`AUTH_BYPASS_OTP`) is still wired up.

### Products
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products` | Public | search, category, subcategory, sort, min_price, max_price, page, limit |
| GET | `/products/popular` | Public | `is_popular_collection = 1` |
| GET | `/products/new-arrivals` | Public | latest 12 |
| GET | `/products/recommended` | Public | `is_recommended = 1` |
| GET | `/products/lakshmi-kubera` | Public | `is_lakshmi_kubera = 1` |
| GET | `/products/:slug` | Public | full details + variations + rating |
| GET | `/products/:id/reviews` | Public | reviews for product |
| POST | `/products/:id/reviews` | Auth | add review |

### Categories / Subcategories
| Method | Path | Auth |
|---|---|---|
| GET | `/categories` | Public |
| GET | `/categories/:id` | Public |
| GET | `/subcategories/:id/products` | Public |

### Cart (auth)
| Method | Path |
|---|---|
| GET | `/cart` |
| POST | `/cart` |
| PUT | `/cart/:id` |
| DELETE | `/cart/:id` |
| DELETE | `/cart` |

### Wishlist (auth)
| Method | Path |
|---|---|
| GET | `/wishlist` |
| POST | `/wishlist` |
| DELETE | `/wishlist/:product_id` |

### Orders (auth)
| Method | Path |
|---|---|
| POST | `/orders` |
| GET | `/orders` |
| GET | `/orders/:id` |
| GET | `/orders/:id/products` |

### Payment
| Method | Path | Auth |
|---|---|---|
| POST | `/payment/initiate` | Auth |
| POST | `/payment/callback` | Public (PhonePe webhook) |
| GET  | `/payment/status/:txnId` | Public |

### Other
| Method | Path | Auth |
|---|---|---|
| POST | `/coupons/validate` | Public |
| GET  | `/testimonials` | Public |
| POST | `/testimonials` | Public (multipart/form-data) |
| GET  | `/advertisements` | Public |
| GET  | `/gold-rate` | Public |
| POST | `/contact` | Public (rate limited 10/hour) |
| POST | `/subscribe` | Public |
| POST | `/uploads/review-image` | Auth |
| POST | `/uploads/customization` | Auth |

---

## Response format

```json
// success
{ "success": true, "data": {...} }

// list with pagination
{ "success": true, "data": [...], "pagination": { "total": 245, "page": 1, "limit": 24, "total_pages": 11 } }

// error
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE" }
```

---

## Environment variables

See [.env.example](.env.example). Required:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — Hostinger MySQL
- `JWT_SECRET` — long random string
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK
- `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`, `PHONEPE_BASE_URL`
- `CDN_URL` — base path for product images (`https://lsjcollections.com/panels/admin`)
- `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`
- `FRONTEND_URL`, `API_URL`

---

## Security

- All SQL uses parameterized queries via `mysql2/promise`.
- JWT-secured routes via [src/middleware/auth.middleware.js](src/middleware/auth.middleware.js); ownership scoped to `req.user.id`.
- Zod validation on every body-accepting endpoint (`src/middleware/validate.middleware.js`).
- `helmet` headers + CORS allowlist + `trust proxy` for accurate rate-limit IPs.
- PhonePe webhook signature verified using timing-safe compare.
- File uploads: extension + MIME whitelist (jpg/jpeg/png/gif/webp), 5MB cap, UUID-renamed filenames.
- Rate limits: phone-login 5/15min, payment 20/15min, contact 10/hour, general 100/15min.
- Passwords (legacy) stripped from every response.

---

## Deployment (Railway)

1. Push the `backend` directory to a Git repo.
2. New project on Railway → deploy from repo.
3. Add all environment variables in the Railway dashboard.
4. Note Railway's outbound IP (Variables/Networking section) and add it to Hostinger → Remote MySQL whitelist.
5. Set custom domain `api.lsjcollections.com` → CNAME to Railway host.
6. Railway uses `railway.json` for healthcheck (`/health`) and start command.

---

## Logging

- HTTP access logs via `morgan` piped into `winston`.
- Application events logged at `info | warn | error`.
- Specifically logged: user logins, order creation, payment initiated, payment callbacks, validation failures, DB errors.

---

## Notes for the existing schema

- All queries map 1:1 to existing column names (`statusval`, `discounted_price`, `grandtotal`, etc.).
- No migrations are run by this service.
- Image filenames are stored bare in the DB; the API transforms them to absolute URLs via [src/config/images.js](src/config/images.js) using `CDN_URL`.
