const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const db = require('../config/db')
const otpService = require('../services/otp.service')
const emailService = require('../services/email.service')
// FALLBACK — Firebase phone OTP. Uncomment this (and the phoneLogin handler +
// its route in auth.routes.js) to switch back to mobile-number sign-in.
// const firebaseService = require('../services/firebase.service')
const { ok, fail, unauthorized } = require('../utils/response')
const { normalizeMobile } = require('../utils/sanitize')
const logger = require('../utils/logger')
const { devToolsAllowed } = require('../utils/environment')

exports.requestEmailOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200, 'Email is too long')
    .email('Enter a valid email address')
})

exports.verifyEmailOtpSchema = z.object({
  otp_token: z.string().min(20, 'Request a new code'),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code')
})

// FALLBACK — Firebase phone OTP
// exports.phoneLoginSchema = z.object({
//   firebase_token: z.string().min(10),
//   phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number')
// })

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
  // Email sign-ups start without a mobile — this is where they add one.
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional()
})

const normalizeEmail = (val) => String(val || '').trim().toLowerCase()

/**
 * Local-only escape hatch: skip sending mail and accept AUTH_BYPASS_CODE.
 *
 * Requires a throwaway database as well as a non-production NODE_ENV. A host
 * that forgets to set NODE_ENV must not be enough to turn this on — with the
 * flag set, anyone could sign in as anyone with the fixed code.
 */
const bypassEnabled = () => {
  if (process.env.AUTH_BYPASS_OTP !== 'true') return false
  if (!devToolsAllowed()) {
    logger.error(
      'AUTH_BYPASS_OTP is set but this process is serving the live database — ' +
      'ignoring it. Unset AUTH_BYPASS_OTP on this deployment.',
      { db: process.env.DB_NAME, node_env: process.env.NODE_ENV || '(unset)' }
    )
    return false
  }
  return true
}

// Comma-separated allow-list, e.g. ADMIN_LOGIN_EMAILS=owner@lsjcollections.com,ops@...
// Deliberately separate from ADMIN_EMAIL (the support inbox notifications go to).
const adminEmails = () =>
  String(process.env.ADMIN_LOGIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean)

const resolveRole = (user) => {
  const adminMobile = process.env.ADMIN_MOBILE
  if (adminMobile && user.mobile === adminMobile) return 'admin'
  if (user.email && adminEmails().includes(normalizeEmail(user.email))) return 'admin'
  return 'user'
}

const issueToken = (user) =>
  jwt.sign(
    { id: user.id, mobile: user.mobile, email: user.email, role: resolveRole(user) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )

const sanitizeUser = (user) => {
  if (!user) return null
  const { password, ...rest } = user
  rest.role = resolveRole(user)
  return rest
}

// ──────────────────────────────────────────────
// Customer sign-in — email one-time password
// ──────────────────────────────────────────────

const findUserByEmail = async (email) => {
  // No unique index on users.email (live schema), so a few legacy rows can share
  // an address — the oldest one is the real account.
  const [rows] = await db.query(
    'SELECT * FROM users WHERE LOWER(email) = ? ORDER BY id ASC LIMIT 1',
    [email]
  )
  return rows[0] || null
}

/**
 * Step 1 — POST /api/auth/email/request-otp { email }
 *
 * Always responds the same way whether or not the address has an account: the
 * account is created on successful verification, so there's nothing to leak.
 */
exports.requestEmailOtp = async (req, res) => {
  const email = normalizeEmail(req.body.email)

  const existing = await findUserByEmail(email)
  if (existing && existing.status === 0) {
    return fail(res, 403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
  }

  // Dev escape hatch (same flags the old phone bypass used): skip the email and
  // accept a fixed code, so local/offline work doesn't burn Resend quota.
  const bypass = bypassEnabled()
  const code = bypass ? (process.env.AUTH_BYPASS_CODE || '123456') : otpService.generateCode()

  let issued
  try {
    issued = otpService.issue({ purpose: 'email_login', subject: email, code })
  } catch (err) {
    logger.error('OTP issue failed', { message: err.message })
    return fail(res, 500, 'Unable to send a code right now', 'OTP_NOT_CONFIGURED')
  }

  if (bypass) {
    logger.warn('Email OTP bypass active — code not emailed', { email, code })
  } else {
    const result = await emailService.sendLoginOtp({
      to: email,
      code,
      minutes: otpService.config.TTL_MINUTES
    })

    if (result?.error || result?.skipped) {
      logger.error('OTP email not delivered', { email, reason: result.error || 'resend not configured' })
      // Deliberately neutral: the usual cause is our own mail config (missing or
      // invalid Resend key), not a bad address, so don't send the customer off
      // to re-check an address that was fine.
      return fail(
        res,
        502,
        'We could not send your code just now. Please try again in a moment.',
        'OTP_SEND_FAILED'
      )
    }
  }

  logger.info('Email OTP sent', { email, is_new: !existing })

  return ok(res, {
    otp_token: issued.token,
    email,
    expires_in: issued.ttlSeconds,
    is_registered: Boolean(existing),
    dev_bypass: bypass
  })
}

/**
 * Step 2 — POST /api/auth/email/verify-otp { otp_token, code }
 *
 * Verifies the code, creates the account on first sign-in, and returns a JWT.
 */
exports.verifyEmailOtp = async (req, res) => {
  const { otp_token, code } = req.body

  let verified
  try {
    verified = otpService.verify({ purpose: 'email_login', token: otp_token, code })
  } catch (err) {
    if (err instanceof otpService.OtpError) {
      const status = err.code === 'OTP_TOO_MANY' ? 429 : 401
      return fail(res, status, err.message, err.code)
    }
    throw err
  }

  const email = normalizeEmail(verified.subject)

  let user = await findUserByEmail(email)
  let isNew = false

  if (user) {
    if (user.status === 0) {
      return fail(res, 403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
    }
  } else {
    const [result] = await db.query(
      `INSERT INTO users (mobile, name, email, password, status, created_at)
       VALUES ('', ?, ?, '', 1, NOW())`,
      ['LSJ Customer', email]
    )
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId])
    user = rows[0]
    isNew = true
  }

  const token = issueToken(user)

  logger.info('User logged in (email OTP)', { user_id: user.id, is_new: isNew })

  return ok(res, {
    token,
    user: sanitizeUser(user),
    is_new: isNew
  })
}

// ──────────────────────────────────────────────
// FALLBACK — Firebase phone OTP sign-in.
// Superseded by the email OTP flow above. Uncomment this handler, the
// phoneLoginSchema, the firebaseService require, and the /phone-login route in
// auth.routes.js to switch back to mobile sign-in.
// ──────────────────────────────────────────────
// exports.phoneLogin = async (req, res) => {
//   const { firebase_token, phone } = req.body
//
//   let decoded
//   try {
//     decoded = await firebaseService.verifyIdToken(firebase_token)
//   } catch (err) {
//     logger.warn('Firebase token verification failed', { message: err.message })
//     return unauthorized(res, 'Invalid or expired OTP token')
//   }
//
//   const fbPhone = decoded.phone_number
//   if (!fbPhone) {
//     return fail(res, 401, 'Firebase token missing phone number', 'INVALID_FIREBASE_TOKEN')
//   }
//
//   const fbMobile = normalizeMobile(fbPhone)
//   const submittedMobile = normalizeMobile(phone)
//
//   if (fbMobile !== submittedMobile) {
//     logger.warn('Phone mismatch on login', { fbMobile, submittedMobile })
//     return fail(res, 401, 'Phone number mismatch', 'PHONE_MISMATCH')
//   }
//
//   const mobile = fbMobile
//
//   const [existing] = await db.query('SELECT * FROM users WHERE mobile = ? LIMIT 1', [mobile])
//
//   let user
//   let isNew = false
//
//   if (existing.length) {
//     user = existing[0]
//     if (user.status === 0) {
//       return fail(res, 403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
//     }
//   } else {
//     const [result] = await db.query(
//       `INSERT INTO users (mobile, name, email, password, status, created_at)
//        VALUES (?, ?, '', '', 1, NOW())`,
//       [mobile, 'LSJ Customer']
//     )
//     const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId])
//     user = rows[0]
//     isNew = true
//   }
//
//   const token = issueToken(user)
//
//   logger.info('User logged in', { user_id: user.id, is_new: isNew })
//
//   return ok(res, {
//     token,
//     user: sanitizeUser(user),
//     is_new: isNew
//   })
// }

exports.devLogin = async (req, res) => {
  if (!bypassEnabled()) {
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
  const { name, email, mobile, address } = req.body

  await db.query(
    `UPDATE users
     SET name = ?,
         email = COALESCE(?, email),
         mobile = COALESCE(?, mobile),
         address = COALESCE(?, address),
         updated_at = NOW()
     WHERE id = ?`,
    [
      name,
      email ? normalizeEmail(email) : null,
      mobile ? normalizeMobile(mobile) : null,
      address || null,
      req.user.id
    ]
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
