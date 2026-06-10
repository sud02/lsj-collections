const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { authLimiter } = require('../middleware/ratelimit.middleware')
const { asyncHandler } = require('../utils/response')

router.post('/phone-login', authLimiter, validate(ctrl.phoneLoginSchema), asyncHandler(ctrl.phoneLogin))
router.post('/complete-profile', auth, validate(ctrl.completeProfileSchema), asyncHandler(ctrl.completeProfile))
router.get('/me', auth, asyncHandler(ctrl.me))
router.post('/logout', auth, asyncHandler(ctrl.logout))

module.exports = router
