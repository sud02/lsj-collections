const { z } = require('zod')
const db = require('../config/db')
const { ok, fail } = require('../utils/response')

exports.validateSchema = z.object({
  code: z.string().min(1).max(50),
  grand_total: z.number().nonnegative()
})

exports.validateCoupon = async (req, res) => {
  const { code, grand_total } = req.body

  const [rows] = await db.query(
    `SELECT * FROM coupons WHERE coupon = ? AND status = 1 LIMIT 1`,
    [code]
  )

  if (!rows.length) return fail(res, 404, 'Invalid or expired coupon', 'INVALID_COUPON')

  const coupon = rows[0]

  if (coupon.expiry) {
    const exp = new Date(coupon.expiry)
    if (Number.isFinite(exp.getTime()) && exp.getTime() < Date.now()) {
      return fail(res, 404, 'Coupon expired', 'EXPIRED_COUPON')
    }
  }

  const discountVal = parseFloat(coupon.discount) || 0
  const discount =
    coupon.type === 'percentage'
      ? Math.min(Math.round((grand_total * discountVal) / 100 * 100) / 100, grand_total)
      : Math.min(discountVal, grand_total)

  const newTotal = Math.max(0, Math.round((grand_total - discount) * 100) / 100)

  return ok(res, {
    code: coupon.coupon,
    type: coupon.type,
    discount,
    new_total: newTotal
  })
}
