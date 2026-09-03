const crypto = require('crypto')
const logger = require('../utils/logger')

/**
 * Stateless one-time-password codes.
 *
 * The schema on Hostinger is live and we don't run migrations, so codes are not
 * stored in MySQL. Instead `issue()` returns an opaque `otp_token` that carries
 * the email + expiry in the clear and an HMAC over (payload + code). The code
 * itself never leaves the server except in the email, and it can't be recovered
 * from the token — verification recomputes the HMAC with the code the user typed
 * and compares in constant time.
 *
 * A small in-memory map adds per-token attempt limiting and single-use
 * enforcement on top. It's best-effort (it resets on redeploy and isn't shared
 * between instances); the signed token and the route rate-limiters are the real
 * guarantees.
 */

const TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '10', 10)
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10)

const secret = () => process.env.OTP_SECRET || process.env.JWT_SECRET || ''

const b64url = (buf) => Buffer.from(buf).toString('base64url')

const sign = (encodedPayload, code) =>
  b64url(crypto.createHmac('sha256', secret()).update(`${encodedPayload}.${code}`).digest())

// 6 digits, uniform, cryptographically random (000000–999999 all reachable).
exports.generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')

// jti -> { attempts, expiresAt, consumed }
const tokenState = new Map()

const pruneState = () => {
  const now = Date.now()
  for (const [jti, state] of tokenState) {
    if (state.expiresAt <= now) tokenState.delete(jti)
  }
}

const stateFor = (jti, expiresAt) => {
  if (tokenState.size > 5000) pruneState()
  let state = tokenState.get(jti)
  if (!state) {
    state = { attempts: 0, expiresAt, consumed: false }
    tokenState.set(jti, state)
  }
  return state
}

class OtpError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}
exports.OtpError = OtpError

/**
 * Build a signed token for `code`. Nothing is persisted — hand the token to the
 * client and the code to the user (by email).
 *
 * @returns {{ token: string, expiresAt: number, ttlSeconds: number }}
 */
exports.issue = ({ purpose, subject, code }) => {
  if (!secret()) {
    throw new OtpError('OTP_NOT_CONFIGURED', 'OTP signing secret is not configured')
  }

  const expiresAt = Date.now() + TTL_MINUTES * 60 * 1000
  const payload = { p: purpose, s: subject, x: expiresAt, j: crypto.randomUUID() }
  const encoded = b64url(JSON.stringify(payload))

  return {
    token: `${encoded}.${sign(encoded, code)}`,
    expiresAt,
    ttlSeconds: TTL_MINUTES * 60
  }
}

/**
 * Check a user-supplied code against a token. Throws OtpError on any failure;
 * returns the token's subject (the email it was issued for) on success.
 *
 * A correct code consumes the token, so it can't be replayed.
 */
exports.verify = ({ purpose, token, code }) => {
  if (!secret()) {
    throw new OtpError('OTP_NOT_CONFIGURED', 'OTP signing secret is not configured')
  }

  const parts = String(token || '').split('.')
  if (parts.length !== 2) throw new OtpError('OTP_INVALID', 'Invalid or expired code')

  const [encoded, providedSig] = parts

  let payload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw new OtpError('OTP_INVALID', 'Invalid or expired code')
  }

  if (!payload || payload.p !== purpose || !payload.s || !payload.j) {
    throw new OtpError('OTP_INVALID', 'Invalid or expired code')
  }

  if (typeof payload.x !== 'number' || payload.x <= Date.now()) {
    throw new OtpError('OTP_EXPIRED', 'This code has expired — request a new one')
  }

  const state = stateFor(payload.j, payload.x)

  if (state.consumed) {
    throw new OtpError('OTP_USED', 'This code has already been used — request a new one')
  }

  if (state.attempts >= MAX_ATTEMPTS) {
    throw new OtpError('OTP_TOO_MANY', 'Too many incorrect attempts — request a new code')
  }

  state.attempts += 1

  const expectedSig = sign(encoded, code)
  const a = Buffer.from(expectedSig)
  const b = Buffer.from(String(providedSig))

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const remaining = Math.max(0, MAX_ATTEMPTS - state.attempts)
    logger.warn('OTP verification failed', { subject: payload.s, remaining })
    throw new OtpError(
      'OTP_INVALID',
      remaining > 0
        ? `Incorrect code — ${remaining} attempt${remaining === 1 ? '' : 's'} left`
        : 'Too many incorrect attempts — request a new code'
    )
  }

  state.consumed = true
  return { subject: payload.s, issuedFor: purpose }
}

exports.config = { TTL_MINUTES, MAX_ATTEMPTS }
