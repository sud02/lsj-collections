const router = require('express').Router()
const ctrl = require('../controllers/admin.controller')
const auth = require('../middleware/auth.middleware')
const admin = require('../middleware/admin.middleware')
const { productUpload } = require('../middleware/upload.middleware')
const { asyncHandler } = require('../utils/response')

router.use(auth, admin)

router.get('/stats', asyncHandler(ctrl.stats))
router.get('/reference-data', asyncHandler(ctrl.referenceData))

// Testimonials
router.get('/testimonials', asyncHandler(ctrl.listTestimonials))
router.patch('/testimonials/:id', asyncHandler(ctrl.updateTestimonial))
router.delete('/testimonials/:id', asyncHandler(ctrl.deleteTestimonial))

// Reviews
router.get('/reviews', asyncHandler(ctrl.listReviews))
router.patch('/reviews/:id', asyncHandler(ctrl.updateReview))
router.delete('/reviews/:id', asyncHandler(ctrl.deleteReview))

// Products
router.get('/products', asyncHandler(ctrl.listProducts))
router.post('/products/bulk', asyncHandler(ctrl.bulkCreateProducts))
router.get('/products/:id', asyncHandler(ctrl.getProduct))
router.post('/products', productUpload, asyncHandler(ctrl.createProduct))
router.put('/products/:id', productUpload, asyncHandler(ctrl.updateProduct))
router.delete('/products/:id', asyncHandler(ctrl.deleteProduct))

// Orders
router.get('/orders', asyncHandler(ctrl.listOrders))
router.get('/orders/:id', asyncHandler(ctrl.getOrder))
router.patch('/orders/:id', asyncHandler(ctrl.updateOrder))

// Gold rate
router.get('/gold-rate', asyncHandler(ctrl.getGoldRate))
router.patch('/gold-rate', asyncHandler(ctrl.updateGoldRate))

module.exports = router
