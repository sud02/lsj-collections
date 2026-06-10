# LSJ Collections — Backend API

REST API for LSJ Collections, a premium hallmark jewellery e-commerce platform based in Tirupati, India.

Stack: **Node.js 20 + Express 4 + MySQL 8 (Hostinger) + Firebase Admin + PhonePe + Resend**.

The API connects to an existing production MySQL database on Hostinger. **No migrations** — the schema is already live.

---

## Quick start

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env
# fill in DB, Firebase, PhonePe, Resend credentials

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
│   │   ├── firebase.js             Firebase Admin init
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

## API endpoints

Base URL: `/api`

### Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/phone-login` | Public | Verify Firebase OTP token, issue JWT (rate limited 5/15min) |
| POST | `/auth/complete-profile` | Auth | Update name/email/address |
| GET  | `/auth/me` | Auth | Current user |
| POST | `/auth/logout` | Auth | Client drops token |

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
