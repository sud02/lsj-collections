const { z } = require('zod')
const db = require('../config/db')
const img = require('../config/images')
const { ok, notFound } = require('../utils/response')
const { toPositiveInt } = require('../utils/sanitize')
const { PRODUCT_DISCOUNTED_SQL } = require('../utils/sql')

exports.addSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive().max(100).default(1)
})

exports.updateSchema = z.object({
  quantity: z.number().int().positive().max(100)
})

const fetchCartWithTotals = async (userId) => {
  const [rows] = await db.query(
    `SELECT c.id, c.product_id, c.quantity, c.created_at,
            p.product_name, p.slug, p.product_code,
            p.featured_image, p.additional_images,
            p.discount_percentage, p.stock, p.ornament_type, p.ornament_weight,
            ${PRODUCT_DISCOUNTED_SQL} AS discounted_price
     FROM cart c
     JOIN products p ON p.id = CAST(c.product_id AS UNSIGNED)
     LEFT JOIN ornaments o ON o.id = p.ornament_type
     WHERE c.user_id = ? AND c.status = 1
     ORDER BY c.created_at DESC`,
    [String(userId)]
  )

  const items = rows.map((r) => {
    const qty = parseInt(r.quantity, 10) || 1
    const price = Number(r.discounted_price) || 0
    return {
      id: r.id,
      product_id: parseInt(r.product_id, 10),
      product: {
        id: parseInt(r.product_id, 10),
        product_name: r.product_name,
        slug: r.slug,
        product_code: r.product_code,
        stock: parseInt(r.stock, 10) || 0,
        featured_image_url: img.product(r.featured_image),
        additional_images: img.productMultiple(r.additional_images),
        price,
        mrp: price
      },
      quantity: qty,
      unit_price: price,
      total_price: Math.round(price * qty * 100) / 100
    }
  })

  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const gst = Math.round(subtotal * 0.18 * 100) / 100
  const grand_total = Math.round((subtotal + gst) * 100) / 100

  return {
    items,
    subtotal,
    gst,
    grand_total,
    item_count: items.length,
    total_quantity: items.reduce((s, i) => s + i.quantity, 0)
  }
}

exports.getCart = async (req, res) => {
  const data = await fetchCartWithTotals(req.user.id)
  return ok(res, data)
}

exports.addToCart = async (req, res) => {
  const { product_id, quantity } = req.body
  const userId = String(req.user.id)
  const productId = String(product_id)

  const [products] = await db.query(
    'SELECT id FROM products WHERE id = ? AND status = 1',
    [product_id]
  )
  if (!products.length) return notFound(res, 'Product not found')

  const [existing] = await db.query(
    'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND status = 1 LIMIT 1',
    [userId, productId]
  )

  if (existing.length) {
    const current = parseInt(existing[0].quantity, 10) || 0
    const newQty = Math.min(current + quantity, 100)
    await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [String(newQty), existing[0].id])
  } else {
    await db.query(
      'INSERT INTO cart (user_id, product_id, quantity, status, created_at) VALUES (?, ?, ?, 1, NOW())',
      [userId, productId, String(quantity)]
    )
  }

  const data = await fetchCartWithTotals(userId)
  return ok(res, data, 201)
}

exports.updateCart = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Cart item not found')

  const [items] = await db.query('SELECT id FROM cart WHERE id = ? AND user_id = ?', [
    id,
    String(req.user.id)
  ])
  if (!items.length) return notFound(res, 'Cart item not found')

  await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [String(req.body.quantity), id])

  const data = await fetchCartWithTotals(req.user.id)
  return ok(res, data)
}

exports.removeItem = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Cart item not found')

  const [result] = await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [
    id,
    String(req.user.id)
  ])
  if (!result.affectedRows) return notFound(res, 'Cart item not found')

  const data = await fetchCartWithTotals(req.user.id)
  return ok(res, data)
}

exports.clearCart = async (req, res) => {
  await db.query('DELETE FROM cart WHERE user_id = ?', [String(req.user.id)])
  return ok(res, { items: [], subtotal: 0, gst: 0, grand_total: 0, item_count: 0, total_quantity: 0 })
}

exports.fetchCartWithTotals = fetchCartWithTotals
