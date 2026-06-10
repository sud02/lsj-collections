# LSJ Collections

Premium hallmark jewellery e-commerce platform — Tirupati, India.

Monorepo:

| Folder | Stack | Purpose |
|---|---|---|
| [backend/](backend/) | Node.js 20 · Express 4 · MySQL (Hostinger) · Firebase Admin · PhonePe · Resend | REST API |
| [frontend/](frontend/) | Next.js 14 · TypeScript · Tailwind · Zustand · Firebase client | Storefront + admin dashboard |

## Quick start

```bash
# backend
cd backend
cp .env.example .env   # fill in DB, Firebase, PhonePe, Resend
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

## Admin

Mobile `ADMIN_MOBILE` (set in `backend/.env`) gets `role: 'admin'` on login. After signing in, an **Admin Dashboard** link appears in the account menu, leading to `/admin/*` for moderating testimonials, reviews, and managing products.
