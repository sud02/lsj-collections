const router = require('express').Router()
const ctrl = require('../controllers/product.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.get('/', asyncHandler(ctrl.listProducts))
router.get('/popular', asyncHandler(ctrl.popular))
router.get('/new-arrivals', asyncHandler(ctrl.newArrivals))
router.get('/recommended', asyncHandler(ctrl.recommended))
router.get('/lakshmi-kubera', asyncHandler(ctrl.lakshmiKubera))

router.get('/:slug', asyncHandler(ctrl.getBySlug))
router.get('/:id/reviews', asyncHandler(ctrl.getReviews))
router.post('/:id/reviews', auth, validate(ctrl.reviewSchema), asyncHandler(ctrl.createReview))

module.exports = router
