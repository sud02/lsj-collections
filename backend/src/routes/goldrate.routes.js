const router = require('express').Router()
const ctrl = require('../controllers/goldrate.controller')
const { asyncHandler } = require('../utils/response')

router.get('/', asyncHandler(ctrl.getLatest))

module.exports = router
