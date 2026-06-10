const { forbidden } = require('../utils/response')

module.exports = (req, res, next) => {
  const adminMobile = process.env.ADMIN_MOBILE
  if (!req.user) return forbidden(res, 'Admin access required')
  if (req.user.role === 'admin') return next()
  if (adminMobile && req.user.mobile === adminMobile) return next()
  return forbidden(res, 'Admin access required')
}
