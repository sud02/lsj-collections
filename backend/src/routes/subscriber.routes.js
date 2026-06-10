const router = require('express').Router()
const ctrl = require('../controllers/subscriber.controller')
const { validate } = require('../middleware/validate.middleware')
const { asyncHandler } = require('../utils/response')

router.post('/', validate(ctrl.subscribeSchema), asyncHandler(ctrl.subscribe))

module.exports = router
