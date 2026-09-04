const rateLimit = require('express-rate-limit')
const { devToolsAllowed } = require('../utils/environment')

const baseOpts = {
  standardHeaders: true,
  legacyHeaders: false,
  // Only skip for genuine local development — a deployment serving the live
  // database keeps its limits even if NODE_ENV is missing. Evaluated per
  // request rather than captured at module load.
  skip: () => devToolsAllowed()
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

/**
 * Broad abuse ceiling across the whole API — scrapers and floods, not people.
 *
 * This is deliberately generous. A single storefront page fires 6-8 requests
 * (categories, popular, new arrivals, products, cart, wishlist), so an ordinary
 * browsing session reaches several hundred well within the window, and office
 * or mobile networks put many customers behind one IP. The endpoints that
 * actually need protecting — sign-in, OTP requests, payments — carry their own
 * far tighter limits below, so this one only has to stop the extremes.
 *
 * It was effectively never enforced before (skip() was tied to an unset
 * NODE_ENV), so 100 was never tested against real traffic; it blocks normal
 * shopping within a couple of minutes.
 */
exports.apiLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 1000,
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
