const { z } = require('zod')
const db = require('../config/db')
const img = require('../config/images')
const logger = require('../utils/logger')
const { ok, notFound, badRequest } = require('../utils/response')
const { toPositiveInt } = require('../utils/sanitize')
const { PRODUCT_DISCOUNTED_SQL } = require('../utils/sql')

const addressSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  address1: z.string().min(5).max(200),
  address2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode')
})

exports.createSchema = z.object({
  billing: addressSchema,
  shipping: addressSchema.optional(),
  coupon_code: z.string().max(50).optional()
})

const round2 = (n) => Math.round(Number(n) * 100) / 100

exports.createOrder = async (req, res) => {
  const userId = req.user.id
  const { billing, shipping, coupon_code } = req.body

  const [cart] = await db.query(
    `SELECT c.id AS cart_id, c.product_id, c.quantity,
            p.id AS pid, p.product_name, p.featured_image, p.slug,
            p.ornament_type, p.ornament_weight, p.status,
            ${PRODUCT_DISCOUNTED_SQL} AS discounted_price
     FROM cart c
     JOIN products p ON p.id = CAST(c.product_id AS UNSIGNED)
     LEFT JOIN ornaments o ON o.id = p.ornament_type
     WHERE c.user_id = ? AND c.status = 1`,
    [String(userId)]
  )

  if (!cart.length) return badRequest(res, 'Cart is empty', 'EMPTY_CART')

  const inactive = cart.find((i) => i.status !== 1)
  if (inactive) {
    return badRequest(
      res,
      `Product "${inactive.product_name}" is no longer available`,
      'PRODUCT_UNAVAILABLE'
    )
  }

  const items = cart.map((i) => ({
    ...i,
    quantity: parseInt(i.quantity, 10) || 1,
    line_price: round2(Number(i.discounted_price) * (parseInt(i.quantity, 10) || 1))
  }))

  const subtotal = round2(items.reduce((s, i) => s + i.line_price, 0))
  const gst = round2(subtotal * 0.18)
  let grandtotal = round2(subtotal + gst)
  let discount = 0
  let appliedCoupon = null
  let couponType = null

  if (coupon_code) {
    const [coupons] = await db.query(
      `SELECT * FROM coupons
       WHERE coupon = ? AND status = 1
       LIMIT 1`,
      [coupon_code]
    )
    if (coupons.length) {
      const c = coupons[0]
      const discountVal = parseFloat(c.discount) || 0
      discount =
        c.type === 'percentage'
          ? round2((grandtotal * discountVal) / 100)
          : round2(discountVal)
      if (discount > grandtotal) discount = grandtotal
      grandtotal = round2(grandtotal - discount)
      appliedCoupon = c.coupon
      couponType = c.type
    }
  }

  const ship = shipping || billing
  const orderRef = `LSJ-${Date.now()}-${userId}`

  const conn = await db.getConnection()
  await conn.beginTransaction()

  try {
    const [result] = await conn.query(
      `INSERT INTO orders (
         user_id, total_products, subtotal, gst, total, grandtotal,
         billing_fullname, billing_email, billing_mobile,
         billing_address1, billing_address2, billing_city, billing_state, billing_pincode,
         shipping_fullname, shipping_email, shipping_mobile,
         shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_pincode,
         coupon, coupon_type, discount,
         payment_status, order_status, status, order_id, created_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,NOW())`,
      [
        String(userId),
        String(items.length),
        String(subtotal),
        String(gst),
        String(round2(subtotal + gst + discount)),
        String(grandtotal),
        billing.name,
        billing.email,
        billing.mobile,
        billing.address1,
        billing.address2 || '',
        billing.city,
        billing.state,
        billing.pincode,
        ship.name,
        ship.email,
        ship.mobile,
        ship.address1,
        ship.address2 || '',
        ship.city,
        ship.state,
        ship.pincode,
        appliedCoupon,
        couponType,
        String(discount),
        'pending',
        'pending',
        orderRef
      ]
    )

    const orderRowId = result.insertId

    for (const item of items) {
      await conn.query(
        `INSERT INTO order_products
         (order_id, user_id, product_id, product_name, product_image, quantity,
          product_actual_price, product_price, product_slug, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [
          orderRef,
          String(userId),
          String(item.pid),
          item.product_name,
          item.featured_image || '',
          item.quantity,
          String(item.discounted_price),
          String(item.line_price),
          item.slug
        ]
      )
    }

    await conn.commit()

    logger.info('Order created', {
      user_id: userId,
      order_row_id: orderRowId,
      order_ref: orderRef,
      grandtotal,
      items: items.length,
      coupon: appliedCoupon
    })

    return ok(
      res,
      {
        order_id: orderRowId,
        order_ref: orderRef,
        subtotal,
        gst,
        discount,
        grandtotal,
        coupon_code: appliedCoupon
      },
      201
    )
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

exports.listOrders = async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, order_id, total_products, subtotal, gst, total, grandtotal, discount,
            payment_reference, payment_status, order_status, coupon,
            billing_fullname, billing_city, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [String(req.user.id)]
  )
  return ok(res, rows)
}

exports.getOrder = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Order not found')

  const [rows] = await db.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [id, String(req.user.id)]
  )
  if (!rows.length) return notFound(res, 'Order not found')

  const order = rows[0]
  const [items] = await db.query(
    `SELECT * FROM order_products WHERE order_id = ?`,
    [order.order_id]
  )

  const decoratedItems = items.map((i) => ({
    ...i,
    featured_image_url: img.product(i.product_image)
  }))

  return ok(res, { order, items: decoratedItems })
}

exports.getOrderProducts = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Order not found')

  const [orders] = await db.query(
    'SELECT id, order_id FROM orders WHERE id = ? AND user_id = ?',
    [id, String(req.user.id)]
  )
  if (!orders.length) return notFound(res, 'Order not found')

  const [items] = await db.query(
    `SELECT * FROM order_products WHERE order_id = ?`,
    [orders[0].order_id]
  )

  const decorated = items.map((i) => ({
    ...i,
    featured_image_url: img.product(i.product_image)
  }))

  return ok(res, decorated)
}
