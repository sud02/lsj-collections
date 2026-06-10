const router = require('express').Router()
const ctrl = require('../controllers/category.controller')
const { asyncHandler } = require('../utils/response')

router.get('/', asyncHandler(ctrl.listCategories))
router.get('/:id', asyncHandler(ctrl.getCategory))

module.exports = router
