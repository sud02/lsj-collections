const { z } = require('zod')
const db = require('../config/db')
const img = require('../config/images')
const { ok, paginated, notFound, buildPagination } = require('../utils/response')
const { toPositiveInt, toFloat, escapeLike } = require('../utils/sanitize')
const { productSelect } = require('../utils/sql')
const { cleanName } = require('../utils/format')

const SORT_MAP = {
  newest: 'p.created_at DESC',
  price_asc: 'discounted_price ASC',
  price_desc: 'discounted_price DESC',
  popular: 'p.is_popular_collection DESC, p.created_at DESC'
}

const decorateProduct = (p) => {
  const stock = parseInt(p.stock, 10)
  const stockNum = Number.isFinite(stock) ? stock : 0
  const weight = parseFloat(p.ornament_weight)
  const discount = parseFloat(p.discount_percentage)
  return {
    ...p,
    price: Number(p.discounted_price) || 0,
    mrp: Number(p.mrp) || 0,
    discount_percent: Number.isFinite(discount) ? discount : 0,
    weight_grams: Number.isFinite(weight) ? weight : undefined,
    weight: p.ornament_weight,
    is_in_stock: stockNum > 0,
    is_new_arrival: false,
    is_popular: p.is_popular_collection === '1' || p.is_popular_collection === 1,
    is_lakshmi_kubera: p.is_lakshmi_kubera === '1' || p.is_lakshmi_kubera === 1,
    is_recommended: p.is_recommended === '1' || p.is_recommended === 1,
    featured_image_url: img.product(p.featured_image),
    additional_image_urls: img.productMultiple(p.additional_images),
    additional_images: img.productMultiple(p.additional_images),
    size_chart_url: img.product(p.size_chart),
    average_rating: p.average_rating !== undefined ? Number(p.average_rating) : undefined,
    review_count: p.review_count !== undefined ? Number(p.review_count) : undefined,
    category_name: cleanName(p.category_name) || undefined,
    subcategory_name: cleanName(p.subcategory_name) || undefined
  }
}

const baseFrom = `
  FROM products p
  LEFT JOIN ornaments o ON o.id = p.ornament_type
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN sub_categories sc ON sc.id = p.subcategory_id
`

const baseSelect = `
  SELECT ${productSelect('p')},
         c.name AS category_name,
         sc.name AS subcategory_name
  ${baseFrom}
`

exports.listProducts = async (req, res) => {
  const search = (req.query.search || '').toString().trim()
  const subcategory = toPositiveInt(req.query.subcategory)
  const category = toPositiveInt(req.query.category)
  const sort = SORT_MAP[req.query.sort] || SORT_MAP.newest
  const minPrice = toFloat(req.query.min_price)
  const maxPrice = toFloat(req.query.max_price)
  const page = toPositiveInt(req.query.page, 1)
  const limit = Math.min(toPositiveInt(req.query.limit, 24), 60)
  const offset = (page - 1) * limit

  const where = ['p.status = 1']
  const params = []

  if (search) {
    where.push('(p.product_name LIKE ? OR p.product_code LIKE ? OR p.short_description LIKE ?)')
    const term = `%${escapeLike(search)}%`
    params.push(term, term, term)
  }
  if (subcategory) {
    where.push('p.subcategory_id = ?')
    params.push(subcategory)
  }
  if (category) {
    where.push('p.category_id = ?')
    params.push(category)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const havingParts = []
  if (minPrice !== null) havingParts.push(`discounted_price >= ${Number(minPrice)}`)
  if (maxPrice !== null) havingParts.push(`discounted_price <= ${Number(maxPrice)}`)
  const havingSql = havingParts.length ? `HAVING ${havingParts.join(' AND ')}` : ''

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM (
       SELECT p.id, ${require('../utils/sql').PRODUCT_DISCOUNTED_SQL} AS discounted_price
       ${baseFrom}
       ${whereSql}
       ${havingSql}
     ) sub`,
    params
  )
  const total = countRows[0].total

  const [rows] = await db.query(
    `${baseSelect} ${whereSql} ${havingSql} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  return paginated(res, rows.map(decorateProduct), buildPagination(total, page, limit))
}

const buildList = (whereExtra, orderBy, limit) => async (_req, res) => {
  const where = ['p.status = 1']
  if (whereExtra) where.push(whereExtra)
  const sql = `${baseSelect} WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ?`
  const [rows] = await db.query(sql, [limit])
  return ok(res, rows.map(decorateProduct))
}

exports.popular = buildList("p.is_popular_collection = '1'", 'p.created_at DESC', 12)
exports.newArrivals = buildList('', 'p.created_at DESC', 12)
exports.recommended = buildList("p.is_recommended = '1'", 'p.created_at DESC', 12)
exports.lakshmiKubera = buildList("p.is_lakshmi_kubera = '1'", 'p.created_at DESC', 12)

exports.getBySlug = async (req, res) => {
  const { slug } = req.params

  const [rows] = await db.query(
    `${baseSelect} WHERE p.slug = ? AND p.status = 1 LIMIT 1`,
    [slug]
  )
  if (!rows.length) {
    const id = parseInt(slug, 10)
    if (Number.isFinite(id)) {
      const [byId] = await db.query(
        `${baseSelect} WHERE p.id = ? AND p.status = 1 LIMIT 1`,
        [id]
      )
      if (byId.length) rows.push(byId[0])
    }
  }
  if (!rows.length) return notFound(res, 'Product not found')

  const product = rows[0]

  const [variations] = await db.query(
    `SELECT v.id, v.attribute_id, v.variation_name, v.product_price AS price,
            v.is_same_price, v.ornament_weight, v.discount_percentage,
            a.name AS attribute_name
     FROM product_variations v
     LEFT JOIN attributes a ON a.id = v.attribute_id
     WHERE v.product_id = ? AND v.status = 1`,
    [product.id]
  )

  const [agg] = await db.query(
    `SELECT COALESCE(AVG(CAST(rating AS DECIMAL(3,2))), 0) AS average_rating,
            COUNT(*) AS review_count
     FROM ratings WHERE product_id = ? AND status = 1`,
    [product.id]
  )

  return ok(res, {
    ...decorateProduct({
      ...product,
      average_rating: agg[0].average_rating,
      review_count: agg[0].review_count
    }),
    variations: variations.map((v) => ({
      id: v.id,
      attribute_name: v.attribute_name || '',
      attribute_value: v.variation_name,
      price_delta: v.product_price ? Number(v.product_price) : 0
    }))
  })
}

exports.reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().min(5).max(1000)
})

exports.getReviews = async (req, res) => {
  const productId = toPositiveInt(req.params.id)
  if (!productId) return notFound(res, 'Product not found')

  const [rows] = await db.query(
    `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.created_at,
            u.name AS user_name
     FROM ratings r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? AND r.status = 1
     ORDER BY r.created_at DESC`,
    [productId]
  )

  const decorated = rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    user_name: r.user_name || 'Customer',
    rating: Number(r.rating) || 0,
    review: r.review,
    created_at: r.created_at
  }))
  return ok(res, decorated)
}

exports.createReview = async (req, res) => {
  const productId = toPositiveInt(req.params.id)
  if (!productId) return notFound(res, 'Product not found')

  const [products] = await db.query(
    'SELECT id FROM products WHERE id = ? AND status = 1',
    [productId]
  )
  if (!products.length) return notFound(res, 'Product not found')

  const { rating, review } = req.body

  // Reviews go through admin moderation by default — admin approves
  // via /admin/reviews. Override with REVIEW_AUTO_APPROVE=true if needed.
  const autoApprove = process.env.REVIEW_AUTO_APPROVE === 'true'
  const status = autoApprove ? 1 : 0

  const [result] = await db.query(
    `INSERT INTO ratings (user_id, product_id, rating, review, status, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [String(req.user.id), productId, String(rating), review, status]
  )

  const [rows] = await db.query(
    `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.status, r.created_at,
            u.name AS user_name
     FROM ratings r LEFT JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [result.insertId]
  )
  const r = rows[0]

  return ok(
    res,
    {
      id: r.id,
      user_id: r.user_id,
      product_id: r.product_id,
      user_name: r.user_name || 'Customer',
      rating: Number(r.rating) || 0,
      review: r.review,
      status: r.status,
      created_at: r.created_at,
      message: autoApprove
        ? 'Thank you for your review.'
        : 'Thank you for your review. It will appear after approval.'
    },
    201
  )
}
