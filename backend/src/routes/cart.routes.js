const router = require('express').Router()
const ctrl = require('../controllers/cart.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.use(auth)

router.get('/', asyncHandler(ctrl.getCart))
router.post('/', validate(ctrl.addSchema), asyncHandler(ctrl.addToCart))
router.put('/:id', validate(ctrl.updateSchema), asyncHandler(ctrl.updateCart))
router.delete('/:id', asyncHandler(ctrl.removeItem))
router.delete('/', asyncHandler(ctrl.clearCart))

module.exports = router
