const logger = require('../utils/logger')

exports.notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  })
}

exports.errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500

  logger.error('Request failed', {
    endpoint: `${req.method} ${req.originalUrl}`,
    user_id: req.user?.id,
    status,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  })

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      code: 'DUPLICATE'
    })
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      error: 'Foreign key constraint failed',
      code: 'FK_CONSTRAINT'
    })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON body',
      code: 'INVALID_JSON'
    })
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large (max 5MB)',
      code: 'FILE_TOO_LARGE'
    })
  }

  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error' : err.message,
    code: err.code || 'SERVER_ERROR'
  })
}
