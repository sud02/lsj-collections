# LSJ Collections

Premium hallmark jewellery e-commerce platform — Tirupati, India.

Monorepo:

| Folder | Stack | Purpose |
|---|---|---|
| [backend/](backend/) | Node.js 20 · Express 4 · MySQL (Hostinger) · PhonePe · Resend | REST API |
| [frontend/](frontend/) | Next.js 14 · TypeScript · Tailwind · Zustand | Storefront + admin dashboard |

## Quick start

```bash
# backend
cd backend
cp .env.example .env   # fill in DB, PhonePe, Resend
npm install
npm run dev            # localhost:5001

# frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev            # localhost:3000
```

Each package's README has setup details, endpoint list, and deployment notes.

## Deployment

- **Backend** → Render (Node web service, root `backend`)
- **Frontend** → Vercel (Next.js, root `frontend`)
- **Database** → existing Hostinger MySQL (no migrations — schema is live)

See [backend/README.md](backend/README.md#deployment-railway) for deploy steps.

## Sign-in

Customers sign in with a **one-time code emailed by Resend** — no password, and
the account is created on first verification. Firebase phone OTP is kept in the
tree, commented out, as a fallback. See
[backend/README.md](backend/README.md#auth) for the endpoints, rate limits, and
how to switch back.

## Admin

Mobile `ADMIN_MOBILE` (set in `backend/.env`) gets `role: 'admin'` on login. After signing in, an **Admin Dashboard** link appears in the account menu, leading to `/admin/*` for moderating testimonials, reviews, and managing products.
