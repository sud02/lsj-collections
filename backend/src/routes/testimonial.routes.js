const router = require('express').Router()
const ctrl = require('../controllers/testimonial.controller')
const { testimonialUpload } = require('../middleware/upload.middleware')
const { asyncHandler } = require('../utils/response')

router.get('/', asyncHandler(ctrl.list))
router.post('/', testimonialUpload, asyncHandler(ctrl.create))

module.exports = router
