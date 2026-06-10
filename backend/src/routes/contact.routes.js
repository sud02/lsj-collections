const router = require('express').Router()
const ctrl = require('../controllers/contact.controller')
const { validate } = require('../middleware/validate.middleware')
const { contactLimiter } = require('../middleware/ratelimit.middleware')
const { asyncHandler } = require('../utils/response')

router.post('/', contactLimiter, validate(ctrl.createSchema), asyncHandler(ctrl.create))

module.exports = router
