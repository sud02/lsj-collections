const router = require('express').Router()
const ctrl = require('../controllers/category.controller')
const { asyncHandler } = require('../utils/response')

router.get('/:id/products', asyncHandler(ctrl.getSubcategoryProducts))

module.exports = router
