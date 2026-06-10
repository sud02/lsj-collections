const jwt = require('jsonwebtoken')
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
