const logger = require('../utils/logger')

const formatIssue = (issue) => {
  const path = Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : null
  return path ? `${path}: ${issue.message}` : issue.message
}

const runSchema = (schema, data) => {
  const result = schema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: formatIssue(result.error.issues[0]) }
  }
  return { ok: true, data: result.data }
}

exports.validate = (schema) => (req, res, next) => {
  const result = runSchema(schema, req.body)
  if (!result.ok) {
    logger.warn('Validation failed', { endpoint: req.originalUrl, error: result.error })
    return res.status(400).json({
      success: false,
      error: result.error,
      code: 'VALIDATION_ERROR'
    })
  }
  req.body = result.data
  next()
}

exports.validateQuery = (schema) => (req, res, next) => {
  const result = runSchema(schema, req.query)
  if (!result.ok) {
    return res.status(400).json({
      success: false,
      error: result.error,
      code: 'VALIDATION_ERROR'
    })
  }
  req.validatedQuery = result.data
  next()
}

exports.validateParams = (schema) => (req, res, next) => {
  const result = runSchema(schema, req.params)
  if (!result.ok) {
    return res.status(400).json({
      success: false,
      error: result.error,
      code: 'VALIDATION_ERROR'
    })
  }
  req.params = result.data
  next()
}
