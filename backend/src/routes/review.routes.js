const router = require('express').Router()
const ctrl = require('../controllers/review.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.get('/product/:id', asyncHandler(ctrl.getReviews))
router.post('/product/:id', auth, validate(ctrl.reviewSchema), asyncHandler(ctrl.createReview))

module.exports = router
