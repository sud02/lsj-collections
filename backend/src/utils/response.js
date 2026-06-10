exports.ok = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data })

exports.paginated = (res, data, pagination) =>
  res.json({ success: true, data, pagination })

exports.fail = (res, statusCode, error, code) =>
  res.status(statusCode).json({ success: false, error, code })

exports.notFound = (res, error = 'Resource not found') =>
  res.status(404).json({ success: false, error, code: 'NOT_FOUND' })

exports.unauthorized = (res, error = 'Authentication required') =>
  res.status(401).json({ success: false, error, code: 'UNAUTHORIZED' })

exports.forbidden = (res, error = 'Forbidden') =>
  res.status(403).json({ success: false, error, code: 'FORBIDDEN' })

exports.badRequest = (res, error, code = 'BAD_REQUEST') =>
  res.status(400).json({ success: false, error, code })

exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

exports.buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  total_pages: Math.max(1, Math.ceil(total / limit))
})
