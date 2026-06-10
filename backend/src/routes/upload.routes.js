const router = require('express').Router()
const ctrl = require('../controllers/upload.controller')
const auth = require('../middleware/auth.middleware')
const { reviewUpload, customizationUpload } = require('../middleware/upload.middleware')

router.post('/review-image', auth, reviewUpload, ctrl.reviewImage)
router.post('/customization', auth, customizationUpload, ctrl.customizationImage)

module.exports = router
