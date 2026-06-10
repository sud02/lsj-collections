const router = require('express').Router()
const ctrl = require('../controllers/coupon.controller')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.post('/validate', validate(ctrl.validateSchema), asyncHandler(ctrl.validateCoupon))

module.exports = router
