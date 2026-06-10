const router = require('express').Router()
const ctrl = require('../controllers/wishlist.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.use(auth)

router.get('/', asyncHandler(ctrl.getWishlist))
router.post('/', validate(ctrl.addSchema), asyncHandler(ctrl.addToWishlist))
router.delete('/:product_id', asyncHandler(ctrl.removeFromWishlist))

module.exports = router
