const router = require('express').Router()
const ctrl = require('../controllers/advertisement.controller')
const { asyncHandler } = require('../utils/response')

router.get('/', asyncHandler(ctrl.list))

module.exports = router
