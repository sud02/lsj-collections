const router = require('express').Router()
const ctrl = require('../controllers/order.controller')
const auth = require('../middleware/auth.middleware')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.use(auth)

router.post('/', validate(ctrl.createSchema), asyncHandler(ctrl.createOrder))
router.get('/', asyncHandler(ctrl.listOrders))
router.get('/:id', asyncHandler(ctrl.getOrder))
router.get('/:id/products', asyncHandler(ctrl.getOrderProducts))

module.exports = router
