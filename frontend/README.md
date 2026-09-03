# LSJ Collections — Frontend

Premium hallmark jewellery e-commerce storefront built with Next.js 14 (App Router) for **LSJ Collections**, Tirupati.

## Tech Stack

- **Next.js 14** — App Router, SSR, SSG, ISR
- **TypeScript** — strict mode
- **Tailwind CSS** — fully custom brand tokens (no UI library)
- **Zustand** — auth / cart / wishlist state, persisted to `localStorage`
- **Email OTP** (codes emailed by the API via Resend) + JWT — authentication
- **React Hook Form + Zod** — checkout validation
- **Framer Motion** — micro-animations
- **Embla Carousel** — hero & related-products sliders
- **Axios** — API client with auto-attached JWT
- **PhonePe** — payment gateway

## Getting Started

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in the API + PhonePe keys
npm run dev
```

App runs on `http://localhost:3000`.

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.lsjcollections.com/api
NEXT_PUBLIC_CDN_URL=https://lsjcollections.com/panels/admin
NEXT_PUBLIC_PHONEPE_ENV=UAT
```

## Folder Structure

```
frontend/
├── app/
│   ├── (shop)/        — products, categories, popular, new-arrivals
│   ├── (checkout)/    — cart, checkout, order-success
│   ├── (account)/     — account, wishlist
│   ├── (info)/        — contact, faqs, policies, lakshmi-kubera
│   ├── api/payment/   — PhonePe initiate + callback proxies
│   ├── layout.tsx     — root layout (fonts, providers, header, footer)
│   ├── page.tsx       — homepage
│   ├── providers.tsx  — toaster + auth modal + auth-expired listener
│   ├── robots.ts      — dynamic robots.txt
│   ├── sitemap.ts     — dynamic sitemap with product slugs
│   ├── not-found.tsx, loading.tsx
│   └── globals.css    — Tailwind + brand tokens
│
├── components/
│   ├── layout/        — Header, Footer, AnnouncementBar, MobileBottomNav
│   ├── auth/          — AuthModal + Email/OTP/Profile steps
│   ├── product/       — Card, Grid, Gallery, Variations, Reviews, Related, Filters
│   ├── cart/          — CartItem, CartSummary, CartDrawer
│   ├── checkout/      — Billing/Shipping forms, Coupon, OrderSummary, schema
│   ├── home/          — Hero, CategoryStrip, FeaturedProducts, SplitBanners,
│   │                    GoldRateTicker, Testimonials, TrustStrip
│   ├── policy/        — Shared PolicyLayout
│   └── ui/            — Button, Input, Modal, Breadcrumb, Badge, Spinner, EmptyState
│
├── lib/               — api (axios + interceptors), auth, utils (firebase.ts is a commented-out fallback)
├── store/             — Zustand stores (auth, cart, wishlist)
└── types/             — Product, Cart, Order, User
```

## Brand System

Configured in `tailwind.config.ts` and `app/globals.css`:

| Token        | Value      | Usage                       |
|--------------|------------|-----------------------------|
| `gold`       | `#c4996c`  | Primary brand colour        |
| `gold-dark`  | `#a67c52`  | Hover states                |
| `gold-light` | `#e8c99a`  | Subtle accents              |
| `gold-bg`    | `#fdf8f3`  | Tinted backgrounds          |
| `cream`      | `#faf7f2`  | Page section backgrounds    |
| `dark`       | `#1a1a1a`  | Headings, primary text      |

**Fonts**: Playfair Display (headings) + Poppins (body), loaded via `next/font/google` with CSS variables.

## Authentication Flow

Sign-in and sign-up are one flow — a 6-digit code emailed to the customer. There
is no password, and no Firebase on the client.

1. `Header` → Login button → `openAuthModal()`
2. `EmailStep` collects the address and calls `POST /auth/email/request-otp`,
   which emails the code and returns a signed `otp_token`
3. `OTPStep` posts that token + the typed code to `POST /auth/email/verify-otp`,
   which creates the account if it's new and returns a JWT
4. JWT is stored in `localStorage` (`lsj_token`) + Zustand auth store (persisted)
5. New users (`is_new: true`) see `ProfileStep` to add name + mobile
   (skippable — checkout collects a mobile anyway)
6. On login, cart and wishlist sync with the server

Resends re-request a fresh `otp_token` (the old one is single-use). The backend
caps requests at 5 per address per 15 min and wrong guesses at 5 per code, so the
UI just surfaces whatever error it returns.

**Firebase phone OTP** is kept as a fallback in [lib/firebase.ts](lib/firebase.ts)
and [components/auth/PhoneStep.tsx](components/auth/PhoneStep.tsx), both commented
out, along with `phoneLogin`/`formatPhoneE164` in [lib/auth.ts](lib/auth.ts). The
`firebase` package and `NEXT_PUBLIC_FIREBASE_*` vars are untouched — uncomment
those three files and swap `EmailStep` back out in `AuthModal.tsx` to restore it.

The axios interceptor in [lib/api.ts](lib/api.ts) auto-attaches the JWT and dispatches `lsj:auth-expired` on any 401, which is caught in [app/providers.tsx](app/providers.tsx) to log out and re-open the modal.

## Cart & Wishlist

- **Logged-out**: items live in `localStorage` only
- **Logged-in**: every mutation hits the backend; on login, local items are pushed to the server before fetching the canonical list
- Both stores persist via Zustand `persist` middleware

## Payment Flow (PhonePe)

```
Checkout form → POST /orders → POST /api/payment/initiate (proxy)
              → server calls /payment/initiate upstream
              → returns redirect_url → window.location = redirect_url
              → PhonePe → /order-success/[id]  + /api/payment/callback (webhook)
```

The `app/api/payment/*` routes are thin proxies that keep the upstream URL out of the browser.

## SEO

- Product detail pages — `generateMetadata()` + `generateStaticParams()` for top 50 products + ISR every 30min
- Homepage — ISR every 1 hour
- Dynamic `sitemap.ts` and `robots.ts`

## Build / Deploy

```bash
npm run build
npm run start
```

Designed to deploy on Vercel — `next.config.mjs` already configures the remote image patterns for `lsjcollections.com` and `api.lsjcollections.com`.

---

**Need help?** support@lsjcollections.com · +91 83094 09007
