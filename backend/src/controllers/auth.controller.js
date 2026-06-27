const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const db = require('../config/db')
const firebaseService = require('../services/firebase.service')
const { ok, fail, unauthorized } = require('../utils/response')
const { normalizeMobile } = require('../utils/sanitize')
const logger = require('../utils/logger')

exports.phoneLoginSchema = z.object({
  firebase_token: z.string().min(10),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number')
})

exports.adminLoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
})

exports.devLoginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number'),
  code: z.string().regex(/^\d{4,6}$/, 'Invalid OTP code')
})

exports.completeProfileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  address: z.string().max(500).optional()
})

const resolveRole = (user) => {
  const adminMobile = process.env.ADMIN_MOBILE
  if (adminMobile && user.mobile === adminMobile) return 'admin'
  return 'user'
}

const issueToken = (user) =>
  jwt.sign(
    { id: user.id, mobile: user.mobile, role: resolveRole(user) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )

const sanitizeUser = (user) => {
  if (!user) return null
  const { password, ...rest } = user
  rest.role = resolveRole(user)
  return rest
}

exports.phoneLogin = async (req, res) => {
  const { firebase_token, phone } = req.body

  let decoded
  try {
    decoded = await firebaseService.verifyIdToken(firebase_token)
  } catch (err) {
    logger.warn('Firebase token verification failed', { message: err.message })
    return unauthorized(res, 'Invalid or expired OTP token')
  }

  const fbPhone = decoded.phone_number
  if (!fbPhone) {
    return fail(res, 401, 'Firebase token missing phone number', 'INVALID_FIREBASE_TOKEN')
  }

  const fbMobile = normalizeMobile(fbPhone)
  const submittedMobile = normalizeMobile(phone)

  if (fbMobile !== submittedMobile) {
    logger.warn('Phone mismatch on login', { fbMobile, submittedMobile })
    return fail(res, 401, 'Phone number mismatch', 'PHONE_MISMATCH')
  }

  const mobile = fbMobile

  const [existing] = await db.query('SELECT * FROM users WHERE mobile = ? LIMIT 1', [mobile])

  let user
  let isNew = false

  if (existing.length) {
    user = existing[0]
    if (user.status === 0) {
      return fail(res, 403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
    }
  } else {
    const [result] = await db.query(
      `INSERT INTO users (mobile, name, email, password, status, created_at)
       VALUES (?, ?, '', '', 1, NOW())`,
      [mobile, 'LSJ Customer']
    )
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId])
    user = rows[0]
    isNew = true
  }

  const token = issueToken(user)

  logger.info('User logged in', { user_id: user.id, is_new: isNew })

  return ok(res, {
    token,
    user: sanitizeUser(user),
    is_new: isNew
  })
}

exports.devLogin = async (req, res) => {
  if (process.env.AUTH_BYPASS_OTP !== 'true') {
    return fail(res, 404, 'Dev login is disabled', 'BYPASS_DISABLED')
  }

  const expected = process.env.AUTH_BYPASS_CODE || '123456'
  const { phone, code } = req.body

  if (code !== expected) {
    logger.warn('Dev-login bad code', { phone })
    return fail(res, 401, 'Invalid OTP code', 'INVALID_CODE')
  }

  const mobile = normalizeMobile(phone)
  const [existing] = await db.query('SELECT * FROM users WHERE mobile = ? LIMIT 1', [mobile])

  let user
  let isNew = false

  if (existing.length) {
    user = existing[0]
    if (user.status === 0) {
      return fail(res, 403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
    }
  } else {
    const [result] = await db.query(
      `INSERT INTO users (mobile, name, email, password, status, created_at)
       VALUES (?, ?, '', '', 1, NOW())`,
      [mobile, 'LSJ Customer']
    )
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId])
    user = rows[0]
    isNew = true
  }

  const token = issueToken(user)
  logger.info('User logged in (dev-bypass)', { user_id: user.id, is_new: isNew })

  return ok(res, {
    token,
    user: sanitizeUser(user),
    is_new: isNew
  })
}

exports.completeProfile = async (req, res) => {
  const { name, email, address } = req.body

  await db.query(
    `UPDATE users
     SET name = ?,
         email = COALESCE(?, email),
         address = COALESCE(?, address),
         updated_at = NOW()
     WHERE id = ?`,
    [name, email || null, address || null, req.user.id]
  )

  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  return ok(res, { user: sanitizeUser(rows[0]) })
}

exports.me = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!rows.length) return fail(res, 404, 'User not found', 'USER_NOT_FOUND')
  return ok(res, { user: sanitizeUser(rows[0]) })
}

exports.logout = async (_req, res) => ok(res, { message: 'Logged out' })

// ──────────────────────────────────────────────
// Admin portal — email/password login (admin table)
// ──────────────────────────────────────────────
const isBcryptHash = (v) => typeof v === 'string' && /^\$2[aby]\$/.test(v)

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body

  const [rows] = await db.query(
    'SELECT id, email, password, role, status FROM admin WHERE email = ? LIMIT 1',
    [email.toLowerCase().trim()]
  )

  // Generic message — don't reveal whether the email exists
  if (!rows.length) {
    logger.warn('Admin login: unknown email', { email })
    return unauthorized(res, 'Invalid email or password')
  }

  const account = rows[0]

  if (account.status !== 1) {
    return fail(res, 403, 'This admin account is disabled', 'ACCOUNT_DISABLED')
  }

  // Only admin-type roles may use the portal (the table can also hold non-admin rows)
  if (!account.role || account.role === 'user') {
    return fail(res, 403, 'This account does not have admin access', 'NOT_ADMIN')
  }

  // Migration guard: seed rows store plaintext passwords. We refuse to authenticate
  // anything that isn't a bcrypt hash — run scripts/create-admin.js to set a real one.
  if (!isBcryptHash(account.password)) {
    logger.error('Admin login blocked: password not hashed', { admin_id: account.id })
    return fail(
      res,
      403,
      'This account needs a secure password set by an administrator before sign-in',
      'PASSWORD_RESET_REQUIRED'
    )
  }

  const valid = await bcrypt.compare(password, account.password)
  if (!valid) {
    logger.warn('Admin login: bad password', { admin_id: account.id })
    return unauthorized(res, 'Invalid email or password')
  }

  const token = jwt.sign(
    { id: account.id, email: account.email, role: 'admin', admin_role: account.role, kind: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )

  logger.info('Admin logged in', { admin_id: account.id, role: account.role })

  return ok(res, {
    token,
    user: {
      id: account.id,
      name: account.email.split('@')[0],
      email: account.email,
      mobile: '',
      role: 'admin',
      admin_role: account.role
    }
  })
}
