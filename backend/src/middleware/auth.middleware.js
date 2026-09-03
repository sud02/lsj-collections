const jwt = require('jsonwebtoken')
const { unauthorized } = require('../utils/response')

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    })
  }

  const token = header.slice(7).trim()
  if (!token) return unauthorized(res, 'Authentication required')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: decoded.id,
      mobile: decoded.mobile,
      email: decoded.email,
      role: decoded.role || 'user'
    }
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    })
  }
}
