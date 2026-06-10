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
