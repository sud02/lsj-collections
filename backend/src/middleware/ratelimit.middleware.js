const rateLimit = require('express-rate-limit')

const isDev = process.env.NODE_ENV !== 'production'

const baseOpts = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev
}

exports.authLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT'
  }
})

// OTP requests cost a real email — key on the address (falling back to IP) so one
// person hammering "resend" can't spend the whole Resend quota.
exports.otpRequestLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) =>
    (req.body?.email ? String(req.body.email).trim().toLowerCase() : '') || req.ip,
  message: {
    success: false,
    error: 'Too many code requests. Please try again in 15 minutes.',
    code: 'RATE_LIMIT'
  }
})

// Guessing attempts. The signed token caps attempts per code; this caps them per IP.
exports.otpVerifyLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT'
  }
})

exports.apiLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    code: 'RATE_LIMIT'
  }
})

exports.paymentLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many payment attempts. Please try again later.',
    code: 'RATE_LIMIT'
  }
})

exports.contactLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many submissions. Please try again in an hour.',
    code: 'RATE_LIMIT'
  }
})
