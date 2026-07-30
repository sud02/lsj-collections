const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const db = require('./config/db')
const logger = require('./utils/logger')
const routes = require('./routes')
const { apiLimiter } = require('./middleware/ratelimit.middleware')
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware')

const app = express()

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

const staticAllowed = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
]

// Allow the apex and ANY subdomain of lsjcollections.com over https
// (www, admin, media, …) — covers the storefront and the admin portal.
const lsjDomainPattern = /^https:\/\/([a-z0-9-]+\.)?lsjcollections\.com$/i

// Vercel previews get URLs like https://lsj-collections-git-feature-xyz.vercel.app
// Match the project's subdomains automatically when VERCEL_PROJECT is set.
const vercelProject = (process.env.VERCEL_PROJECT || '').trim()
const vercelPattern = vercelProject
  ? new RegExp(`^https://${vercelProject}(-[a-z0-9-]+)?\\.vercel\\.app$`, 'i')
  : null

const isAllowedOrigin = (origin) =>
  staticAllowed.includes(origin) ||
  lsjDomainPattern.test(origin) ||
  Boolean(vercelPattern && vercelPattern.test(origin))

app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin / server-to-server requests have no Origin header.
      if (!origin || isAllowedOrigin(origin)) return cb(null, true)
      // Deny gracefully — returning an Error here makes the CORS preflight 500.
      logger.warn('CORS: blocked origin', { origin })
      return cb(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  })
)

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/', (_req, res) =>
  res.json({
    success: true,
    data: { service: 'LSJ Collections API', version: '1.0.0', docs: '/api' }
  })
)

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime() })
  } catch (err) {
    logger.error('Health check failed', { message: err.message })
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

app.use('/api', apiLimiter, routes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
