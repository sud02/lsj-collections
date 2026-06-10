const product = require('./product.controller')

exports.getReviews = product.getReviews
exports.createReview = product.createReview
exports.reviewSchema = product.reviewSchema
