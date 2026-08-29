const router = require('express').Router()
const ctrl = require('../controllers/payment.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { paymentLimiter } = require('../middleware/ratelimit.middleware')
const { asyncHandler } = require('../utils/response')

router.post('/initiate', auth, paymentLimiter, validate(ctrl.initiateSchema), asyncHandler(ctrl.initiate))
router.post('/callback', asyncHandler(ctrl.callback))
router.get('/status/:orderId', auth, asyncHandler(ctrl.checkStatus))

module.exports = router
