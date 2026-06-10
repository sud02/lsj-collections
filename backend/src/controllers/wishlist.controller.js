const { z } = require('zod')
const db = require('../config/db')
const img = require('../config/images')
const { ok, notFound } = require('../utils/response')
const { toPositiveInt } = require('../utils/sanitize')
const { PRODUCT_DISCOUNTED_SQL } = require('../utils/sql')

exports.addSchema = z.object({
  product_id: z.number().int().positive()
})

exports.getWishlist = async (req, res) => {
  const [rows] = await db.query(
    `SELECT w.id, w.product_id, w.created_at,
            p.id AS pid, p.product_name, p.slug, p.product_code, p.featured_image,
            p.additional_images, p.stock, p.ornament_type, p.ornament_weight,
            p.discount_percentage,
            ${PRODUCT_DISCOUNTED_SQL} AS discounted_price
     FROM wishlist w
     JOIN products p ON p.id = CAST(w.product_id AS UNSIGNED)
     LEFT JOIN ornaments o ON o.id = p.ornament_type
     WHERE w.user_id = ? AND p.status = 1 AND w.status = 1
     ORDER BY w.created_at DESC`,
    [String(req.user.id)]
  )

  const decorated = rows.map((r) => {
    const price = Number(r.discounted_price) || 0
    const stock = parseInt(r.stock, 10) || 0
    return {
      id: r.id,
      product_id: r.pid,
      product: {
        id: r.pid,
        product_name: r.product_name,
        slug: r.slug,
        product_code: r.product_code,
        featured_image_url: img.product(r.featured_image),
        additional_images: img.productMultiple(r.additional_images),
        stock,
        is_in_stock: stock > 0,
        price,
        mrp: price
      },
      created_at: r.created_at
    }
  })

  return ok(res, decorated)
}

exports.addToWishlist = async (req, res) => {
  const { product_id } = req.body
  const userId = String(req.user.id)
  const productId = String(product_id)

  const [products] = await db.query(
    'SELECT id FROM products WHERE id = ? AND status = 1',
    [product_id]
  )
  if (!products.length) return notFound(res, 'Product not found')

  const [existing] = await db.query(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ? LIMIT 1',
    [userId, productId]
  )
  if (existing.length) {
    return ok(res, { message: 'Already in wishlist', id: existing[0].id })
  }

  const [result] = await db.query(
    'INSERT INTO wishlist (user_id, product_id, status, created_at) VALUES (?, ?, 1, NOW())',
    [userId, productId]
  )

  return ok(res, { id: result.insertId, message: 'Added to wishlist' }, 201)
}

exports.removeFromWishlist = async (req, res) => {
  const productId = toPositiveInt(req.params.product_id)
  if (!productId) return notFound(res, 'Wishlist item not found')

  const [result] = await db.query(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
    [String(req.user.id), String(productId)]
  )
  if (!result.affectedRows) return notFound(res, 'Wishlist item not found')

  return ok(res, { message: 'Removed from wishlist' })
}
