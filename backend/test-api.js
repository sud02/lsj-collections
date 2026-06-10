// One-shot CRUD smoke test against the running API.
// Usage: node test-api.js
require('dotenv').config()
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')

const BASE = process.env.API_URL || 'http://localhost:5001'
const JWT_SECRET = process.env.JWT_SECRET

const results = []
const pass = (name, info = '') => results.push({ name, ok: true, info })
const fail = (name, info = '') => results.push({ name, ok: false, info })

async function req(method, path, { token, body, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await r.text()
  let data = null
  try { data = JSON.parse(text) } catch { /* not json */ }
  if (raw) return { status: r.status, data, text }
  return { status: r.status, data }
}

async function expect(name, fn, validator) {
  try {
    const res = await fn()
    const verdict = validator(res)
    if (verdict) {
      pass(name, `→ ${res.status}`)
    } else {
      fail(name, `→ ${res.status} ${res.data ? JSON.stringify(res.data).slice(0, 160) : ''}`)
    }
    return res
  } catch (err) {
    fail(name, `EXC ${err.message}`)
    return null
  }
}

;(async () => {
  console.log(`\nTesting ${BASE}\n`)

  // === 1. Get a real user + product from the DB so the FKs are valid ===
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })
  const [users] = await conn.query('SELECT id, mobile FROM users WHERE status = 1 ORDER BY id DESC LIMIT 1')
  const [products] = await conn.query("SELECT id, slug FROM products WHERE status = 1 LIMIT 2")
  const [coupons] = await conn.query(
    "SELECT coupon, expiry FROM coupons WHERE status = 1 AND (expiry IS NULL OR expiry = '' OR STR_TO_DATE(expiry, '%Y-%m-%d') >= CURDATE()) LIMIT 1"
  )
  await conn.end()

  if (!users.length || !products.length) {
    console.error('Need at least one user and one product in the DB')
    process.exit(1)
  }
  const user = users[0]
  const product = products[0]
  const product2 = products[1] || products[0]
  const couponCode = coupons[0]?.coupon || null

  const token = jwt.sign({ id: user.id, mobile: user.mobile, role: 'user' }, JWT_SECRET, { expiresIn: '1h' })
  console.log(`Test user: id=${user.id}  product: id=${product.id} slug=${product.slug}  coupon: ${couponCode || '(none)'}\n`)

  // ============================================================
  // PUBLIC READS
  // ============================================================
  await expect('GET /health', () => req('GET', '/health'), (r) => r.status === 200)
  await expect('GET /api/products', () => req('GET', '/api/products?limit=2'), (r) => r.status === 200 && Array.isArray(r.data?.data))
  await expect('GET /api/products?search', () => req('GET', '/api/products?search=silver&limit=2'), (r) => r.status === 200)
  await expect('GET /api/products?sort=price_asc', () => req('GET', '/api/products?sort=price_asc&limit=2'), (r) => r.status === 200)
  await expect('GET /api/products/popular', () => req('GET', '/api/products/popular'), (r) => r.status === 200)
  await expect('GET /api/products/new-arrivals', () => req('GET', '/api/products/new-arrivals'), (r) => r.status === 200)
  await expect('GET /api/products/recommended', () => req('GET', '/api/products/recommended'), (r) => r.status === 200)
  await expect('GET /api/products/lakshmi-kubera', () => req('GET', '/api/products/lakshmi-kubera'), (r) => r.status === 200)
  await expect('GET /api/products/:slug', () => req('GET', `/api/products/${product.slug}`), (r) => r.status === 200 && r.data?.data?.id === product.id)
  await expect('GET /api/products/:id/reviews', () => req('GET', `/api/products/${product.id}/reviews`), (r) => r.status === 200 && Array.isArray(r.data?.data))

  await expect('GET /api/categories', () => req('GET', '/api/categories'), (r) => r.status === 200)
  await expect('GET /api/gold-rate', () => req('GET', '/api/gold-rate'), (r) => r.status === 200)
  await expect('GET /api/advertisements', () => req('GET', '/api/advertisements'), (r) => r.status === 200)
  await expect('GET /api/testimonials', () => req('GET', '/api/testimonials'), (r) => r.status === 200)

  // ============================================================
  // AUTH
  // ============================================================
  await expect('POST /api/auth/phone-login (bad token)',
    () => req('POST', '/api/auth/phone-login', { body: { firebase_token: 'invalid_xx', phone: '9876543210' } }),
    (r) => r.status === 401)

  await expect('GET /api/auth/me (with JWT)',
    () => req('GET', '/api/auth/me', { token }),
    (r) => r.status === 200 && r.data?.data?.user?.id === user.id)

  await expect('GET /api/auth/me (no token blocked)',
    () => req('GET', '/api/auth/me'),
    (r) => r.status === 401)

  await expect('POST /api/auth/complete-profile',
    () => req('POST', '/api/auth/complete-profile', { token, body: { name: 'Test User', email: 'test@example.com' } }),
    (r) => r.status === 200)

  // ============================================================
  // CART CRUD
  // ============================================================
  await expect('DELETE /api/cart (clear before)',
    () => req('DELETE', '/api/cart', { token }),
    (r) => r.status === 200)

  await expect('POST /api/cart (add)',
    () => req('POST', '/api/cart', { token, body: { product_id: product.id, quantity: 2 } }),
    (r) => r.status === 201 && Array.isArray(r.data?.data?.items) && r.data.data.items.length === 1)

  const cartGet = await expect('GET /api/cart',
    () => req('GET', '/api/cart', { token }),
    (r) => r.status === 200 && Array.isArray(r.data?.data?.items))

  const cartItemId = cartGet?.data?.data?.items?.[0]?.id

  await expect('POST /api/cart (add second product)',
    () => req('POST', '/api/cart', { token, body: { product_id: product2.id, quantity: 1 } }),
    (r) => r.status === 201)

  await expect('PUT /api/cart/:id (update qty)',
    () => req('PUT', `/api/cart/${cartItemId}`, { token, body: { quantity: 3 } }),
    (r) => r.status === 200 && r.data?.data?.items?.find((i) => i.id === cartItemId)?.quantity === 3)

  await expect('DELETE /api/cart/:id',
    () => req('DELETE', `/api/cart/${cartItemId}`, { token }),
    (r) => r.status === 200)

  await expect('PUT /api/cart/:bad (validation)',
    () => req('PUT', `/api/cart/${cartItemId}`, { token, body: { quantity: 0 } }),
    (r) => r.status === 400)

  // ============================================================
  // WISHLIST CRUD
  // ============================================================
  await expect('DELETE /api/wishlist/:productId (cleanup)',
    () => req('DELETE', `/api/wishlist/${product.id}`, { token }),
    (r) => r.status === 200 || r.status === 404)

  await expect('POST /api/wishlist (add)',
    () => req('POST', '/api/wishlist', { token, body: { product_id: product.id } }),
    (r) => r.status === 200 || r.status === 201)

  await expect('POST /api/wishlist (idempotent)',
    () => req('POST', '/api/wishlist', { token, body: { product_id: product.id } }),
    (r) => r.status === 200)

  await expect('GET /api/wishlist',
    () => req('GET', '/api/wishlist', { token }),
    (r) => r.status === 200 && Array.isArray(r.data?.data) && r.data.data.length >= 1)

  await expect('DELETE /api/wishlist/:productId',
    () => req('DELETE', `/api/wishlist/${product.id}`, { token }),
    (r) => r.status === 200)

  // ============================================================
  // REVIEWS
  // ============================================================
  await expect('POST /api/products/:id/reviews',
    () => req('POST', `/api/products/${product.id}/reviews`, { token, body: { rating: 5, review: 'Lovely piece, great quality!' } }),
    (r) => r.status === 201)

  await expect('POST /api/products/:id/reviews (validation: short review)',
    () => req('POST', `/api/products/${product.id}/reviews`, { token, body: { rating: 5, review: 'ok' } }),
    (r) => r.status === 400)

  await expect('POST /api/products/:id/reviews (validation: rating>5)',
    () => req('POST', `/api/products/${product.id}/reviews`, { token, body: { rating: 6, review: 'too high' } }),
    (r) => r.status === 400)

  // ============================================================
  // COUPONS
  // ============================================================
  if (couponCode) {
    await expect('POST /api/coupons/validate (real code)',
      () => req('POST', '/api/coupons/validate', { body: { code: couponCode, grand_total: 5000 } }),
      (r) => r.status === 200)
  }
  await expect('POST /api/coupons/validate (bad code)',
    () => req('POST', '/api/coupons/validate', { body: { code: 'NONEXIST_XYZ', grand_total: 1000 } }),
    (r) => r.status === 404)

  // ============================================================
  // CONTACT / SUBSCRIBE
  // ============================================================
  await expect('POST /api/contact',
    () => req('POST', '/api/contact', {
      body: { name: 'Test', email: 'qa@example.com', subject: 'Test contact', message: 'CRUD smoke test message' }
    }),
    (r) => r.status === 201)

  const subEmail = `qa+${Date.now()}@example.com`
  await expect('POST /api/subscribe (new)',
    () => req('POST', '/api/subscribe', { body: { email: subEmail } }),
    (r) => r.status === 201)
  await expect('POST /api/subscribe (duplicate handled)',
    () => req('POST', '/api/subscribe', { body: { email: subEmail } }),
    (r) => r.status === 200)
  await expect('POST /api/subscribe (validation)',
    () => req('POST', '/api/subscribe', { body: { email: 'not-an-email' } }),
    (r) => r.status === 400)

  // ============================================================
  // ORDERS (creates a row — useful as full-stack check)
  // ============================================================
  await expect('POST /api/cart (re-add for order)',
    () => req('POST', '/api/cart', { token, body: { product_id: product.id, quantity: 1 } }),
    (r) => r.status === 201)

  const orderRes = await expect('POST /api/orders',
    () => req('POST', '/api/orders', {
      token,
      body: {
        billing: {
          name: 'Test User', email: 'test@example.com', mobile: '9876543210',
          address1: '123 Test Lane', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '517501'
        }
      }
    }),
    (r) => r.status === 201 && r.data?.data?.order_id)
  const orderId = orderRes?.data?.data?.order_id

  await expect('GET /api/orders',
    () => req('GET', '/api/orders', { token }),
    (r) => r.status === 200 && Array.isArray(r.data?.data))

  if (orderId) {
    await expect('GET /api/orders/:id',
      () => req('GET', `/api/orders/${orderId}`, { token }),
      (r) => r.status === 200 && r.data?.data?.order?.id === orderId)
    await expect('GET /api/orders/:id/products',
      () => req('GET', `/api/orders/${orderId}/products`, { token }),
      (r) => r.status === 200 && Array.isArray(r.data?.data))
    await expect('GET /api/orders/:bad (ownership)',
      () => req('GET', '/api/orders/999999999', { token }),
      (r) => r.status === 404)
  }

  // ============================================================
  // 404 / route not found
  // ============================================================
  await expect('GET /api/does-not-exist (404)',
    () => req('GET', '/api/no-such-route'),
    (r) => r.status === 404)

  // ============================================================
  // REPORT
  // ============================================================
  console.log('\n────── results ──────')
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'}  ${r.name.padEnd(55)} ${r.info}`)
  }
  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  console.log(`\n${passed} passed, ${failed} failed (${results.length} total)\n`)
  process.exit(failed > 0 ? 1 : 0)
})().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
