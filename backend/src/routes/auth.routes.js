const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const {
  authLimiter,
  otpRequestLimiter,
  otpVerifyLimiter
} = require('../middleware/ratelimit.middleware')
const { asyncHandler } = require('../utils/response')

// Customer sign-in — email OTP (primary)
router.post(
  '/email/request-otp',
  otpRequestLimiter,
  validate(ctrl.requestEmailOtpSchema),
  asyncHandler(ctrl.requestEmailOtp)
)
router.post(
  '/email/verify-otp',
  otpVerifyLimiter,
  validate(ctrl.verifyEmailOtpSchema),
  asyncHandler(ctrl.verifyEmailOtp)
)

// FALLBACK — Firebase phone OTP. Uncomment together with phoneLogin +
// phoneLoginSchema in auth.controller.js to switch back to mobile sign-in.
// router.post('/phone-login', authLimiter, validate(ctrl.phoneLoginSchema), asyncHandler(ctrl.phoneLogin))

router.post('/dev-login', authLimiter, validate(ctrl.devLoginSchema), asyncHandler(ctrl.devLogin))
router.post('/admin-login', authLimiter, validate(ctrl.adminLoginSchema), asyncHandler(ctrl.adminLogin))
router.post('/complete-profile', auth, validate(ctrl.completeProfileSchema), asyncHandler(ctrl.completeProfile))
router.get('/me', auth, asyncHandler(ctrl.me))
router.post('/logout', auth, asyncHandler(ctrl.logout))

module.exports = router
