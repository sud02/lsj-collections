const { z } = require('zod')
const db = require('../config/db')
const img = require('../config/images')
const logger = require('../utils/logger')
const { ok, notFound, badRequest } = require('../utils/response')
const { toPositiveInt } = require('../utils/sanitize')
const { productSelect } = require('../utils/sql')

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
exports.stats = async (_req, res) => {
  const queries = await Promise.all([
    db.query('SELECT COUNT(*) AS c FROM products WHERE status = 1'),
    db.query('SELECT COUNT(*) AS c FROM products WHERE status = 0'),
    db.query('SELECT COUNT(*) AS c FROM testimonials WHERE status = 0'),
    db.query('SELECT COUNT(*) AS c FROM testimonials WHERE status = 1'),
    db.query('SELECT COUNT(*) AS c FROM ratings WHERE status = 0'),
    db.query('SELECT COUNT(*) AS c FROM ratings WHERE status = 1'),
    db.query('SELECT COUNT(*) AS c FROM orders'),
    db.query("SELECT COUNT(*) AS c FROM orders WHERE payment_status = 'paid'"),
    db.query("SELECT COUNT(*) AS c FROM orders WHERE payment_status = 'pending'"),
    db.query('SELECT COUNT(*) AS c FROM users WHERE status = 1'),
    db.query('SELECT COUNT(*) AS c FROM contact'),
    db.query('SELECT COUNT(*) AS c FROM subscriptions')
  ])
  const v = (i) => queries[i][0][0].c
  return ok(res, {
    products: { active: v(0), inactive: v(1), total: v(0) + v(1) },
    testimonials: { pending: v(2), approved: v(3) },
    reviews: { pending: v(4), approved: v(5) },
    orders: { total: v(6), paid: v(7), pending: v(8) },
    users: v(9),
    contacts: v(10),
    subscribers: v(11)
  })
}

// ──────────────────────────────────────────────
// Testimonials
// ──────────────────────────────────────────────
exports.listTestimonials = async (req, res) => {
  const status = req.query.status === 'pending' ? 0 : req.query.status === 'all' ? null : 1
  const where = status === null ? '' : 'WHERE status = ?'
  const params = status === null ? [] : [status]
  const [rows] = await db.query(
    `SELECT id, name, subject, message, rating, image, status, created_at
     FROM testimonials ${where} ORDER BY created_at DESC`,
    params
  )
  return ok(res, rows.map((r) => ({
    ...r,
    rating: Number(r.rating) || 0,
    image_url: img.testimonial(r.image)
  })))
}

exports.updateTestimonial = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  const status = req.body.status
  if (!id || ![0, 1].includes(status)) return badRequest(res, 'status must be 0 or 1')
  const [r] = await db.query('UPDATE testimonials SET status = ? WHERE id = ?', [status, id])
  if (!r.affectedRows) return notFound(res, 'Testimonial not found')
  logger.info('Admin updated testimonial', { admin_id: req.user.id, id, status })
  return ok(res, { id, status })
}

exports.deleteTestimonial = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Testimonial not found')
  const [r] = await db.query('DELETE FROM testimonials WHERE id = ?', [id])
  if (!r.affectedRows) return notFound(res, 'Testimonial not found')
  return ok(res, { id, deleted: true })
}

// ──────────────────────────────────────────────
// Reviews (ratings table)
// ──────────────────────────────────────────────
exports.listReviews = async (req, res) => {
  const status = req.query.status === 'pending' ? 0 : req.query.status === 'all' ? null : 1
  const where = status === null ? '' : 'WHERE r.status = ?'
  const params = status === null ? [] : [status]
  const [rows] = await db.query(
    `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.status, r.created_at,
            u.name AS user_name, p.product_name, p.featured_image
     FROM ratings r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN products p ON p.id = r.product_id
     ${where}
     ORDER BY r.created_at DESC`,
    params
  )
  return ok(res, rows.map((r) => ({
    ...r,
    rating: Number(r.rating) || 0,
    product_image_url: img.product(r.featured_image)
  })))
}

exports.updateReview = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  const status = req.body.status
  if (!id || ![0, 1].includes(status)) return badRequest(res, 'status must be 0 or 1')
  const [r] = await db.query('UPDATE ratings SET status = ? WHERE id = ?', [status, id])
  if (!r.affectedRows) return notFound(res, 'Review not found')
  return ok(res, { id, status })
}

exports.deleteReview = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Review not found')
  const [r] = await db.query('DELETE FROM ratings WHERE id = ?', [id])
  if (!r.affectedRows) return notFound(res, 'Review not found')
  return ok(res, { id, deleted: true })
}

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────
const productSchema = z.object({
  product_name: z.string().min(2).max(250),
  product_code: z.string().max(100).optional().or(z.literal('')),
  slug: z.string().max(250).optional().or(z.literal('')),
  category_id: z.coerce.number().int().positive(),
  subcategory_id: z.coerce.number().int().positive().optional().nullable().or(z.literal('')),
  ornament_type: z.coerce.number().int().positive(),
  ornament_weight: z.string().max(150),
  discount_percentage: z.string().max(50).default('0'),
  miscalleneous_price: z.string().max(255).default('0'),
  short_description: z.string().max(2000).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  features: z.string().optional().or(z.literal('')),
  general_info: z.string().optional().or(z.literal('')),
  hashtags: z.string().max(200).optional().or(z.literal('')),
  stock: z.string().max(50).default('1'),
  is_lakshmi_kubera: z.string().default('0'),
  is_popular_collection: z.string().default('0'),
  is_recommended: z.string().default('0'),
  status: z.coerce.number().int().min(0).max(1).default(1)
})

const slugify = (s) =>
  s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

exports.listProducts = async (req, res) => {
  const search = (req.query.search || '').toString().trim()
  const where = []
  const params = []
  if (req.query.status === 'inactive') { where.push('p.status = 0') }
  else if (req.query.status !== 'all') { where.push('p.status = 1') }
  if (search) {
    where.push('(p.product_name LIKE ? OR p.product_code LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [rows] = await db.query(
    `SELECT ${productSelect('p')}, c.name AS category_name, sc.name AS subcategory_name
     FROM products p
     LEFT JOIN ornaments o ON o.id = p.ornament_type
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN sub_categories sc ON sc.id = p.subcategory_id
     ${whereSql}
     ORDER BY p.id DESC
     LIMIT 200`,
    params
  )
  return ok(res, rows.map((p) => ({
    ...p,
    price: Number(p.discounted_price) || 0,
    mrp: Number(p.mrp) || 0,
    featured_image_url: img.product(p.featured_image),
    additional_image_urls: img.productMultiple(p.additional_images),
    category_name: p.category_name,
    subcategory_name: p.subcategory_name
  })))
}

exports.getProduct = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Product not found')
  const [rows] = await db.query(
    `SELECT ${productSelect('p')}, c.name AS category_name, sc.name AS subcategory_name
     FROM products p
     LEFT JOIN ornaments o ON o.id = p.ornament_type
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN sub_categories sc ON sc.id = p.subcategory_id
     WHERE p.id = ?`,
    [id]
  )
  if (!rows.length) return notFound(res, 'Product not found')
  const p = rows[0]
  return ok(res, {
    ...p,
    price: Number(p.discounted_price) || 0,
    mrp: Number(p.mrp) || 0,
    featured_image_url: img.product(p.featured_image),
    additional_image_urls: img.productMultiple(p.additional_images)
  })
}

const collectFiles = (req) => {
  const featured = req.files?.featured_image?.[0]?.filename || null
  const additional = (req.files?.additional_images || []).map((f) => f.filename)
  return { featured, additional }
}

exports.createProduct = async (req, res) => {
  const parsed = productSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message, 'VALIDATION_ERROR')
  const data = parsed.data

  const { featured, additional } = collectFiles(req)
  if (!featured) return badRequest(res, 'Featured image is required', 'NO_FEATURED_IMAGE')

  const slug = data.slug ? slugify(data.slug) : slugify(data.product_name)
  const code = data.product_code || `LSJ-${Date.now()}`

  const [r] = await db.query(
    `INSERT INTO products (
      product_code, product_name, slug, category_id, subcategory_id,
      featured_image, additional_images, ornament_type, ornament_weight,
      discount_percentage, miscalleneous_price, short_description, description,
      features, general_info, hashtags, stock,
      is_lakshmi_kubera, is_popular_collection, is_recommended,
      status, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
    [
      code, data.product_name, slug, data.category_id, data.subcategory_id || null,
      featured, additional.join(','), data.ornament_type, data.ornament_weight,
      data.discount_percentage, data.miscalleneous_price, data.short_description || '', data.description || '',
      data.features || '', data.general_info || '', data.hashtags || '', data.stock,
      data.is_lakshmi_kubera, data.is_popular_collection, data.is_recommended,
      data.status
    ]
  )

  logger.info('Admin created product', { admin_id: req.user.id, product_id: r.insertId, name: data.product_name })
  return ok(res, { id: r.insertId, slug, message: 'Product created' }, 201)
}

// Bulk import — text/numeric fields only. Products are created as DRAFTS
// (status 0, no images) so the storefront isn't broken; admin adds an image
// via the edit page, which flips the product active.
const bulkRowSchema = z.object({
  product_name: z.string().min(2).max(250),
  product_code: z.string().max(100).optional().or(z.literal('')),
  slug: z.string().max(250).optional().or(z.literal('')),
  category_id: z.coerce.number().int().positive(),
  subcategory_id: z.coerce.number().int().positive().optional().nullable().or(z.literal('')),
  ornament_type: z.coerce.number().int().positive(),
  ornament_weight: z.coerce.string().max(150),
  discount_percentage: z.coerce.string().max(50).optional(),
  miscalleneous_price: z.coerce.string().max(255).optional(),
  short_description: z.string().max(2000).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  features: z.string().optional().or(z.literal('')),
  stock: z.coerce.string().max(50).optional(),
  is_lakshmi_kubera: z.coerce.string().optional(),
  is_popular_collection: z.coerce.string().optional(),
  is_recommended: z.coerce.string().optional()
})

const MAX_BULK_ROWS = 500

exports.bulkCreateProducts = async (req, res) => {
  const rows = req.body?.rows
  if (!Array.isArray(rows) || !rows.length) {
    return badRequest(res, 'Provide a non-empty "rows" array', 'NO_ROWS')
  }
  if (rows.length > MAX_BULK_ROWS) {
    return badRequest(res, `Too many rows (max ${MAX_BULK_ROWS} per import)`, 'TOO_MANY_ROWS')
  }

  const created = []
  const failed = []

  for (let i = 0; i < rows.length; i++) {
    const parsed = bulkRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      failed.push({ row: i + 1, reason: parsed.error.issues[0].message })
      continue
    }
    const d = parsed.data
    const slug = d.slug ? slugify(d.slug) : slugify(d.product_name)
    const code = d.product_code || `LSJ-${Date.now()}-${i}`
    try {
      const [r] = await db.query(
        `INSERT INTO products (
          product_code, product_name, slug, category_id, subcategory_id,
          featured_image, additional_images, ornament_type, ornament_weight,
          discount_percentage, miscalleneous_price, short_description, description,
          features, general_info, hashtags, stock,
          is_lakshmi_kubera, is_popular_collection, is_recommended,
          status, created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
        [
          code, d.product_name, slug, d.category_id, d.subcategory_id || null,
          '', '', d.ornament_type, d.ornament_weight,
          d.discount_percentage || '0', d.miscalleneous_price || '0',
          d.short_description || '', d.description || '',
          d.features || '', '', '', d.stock || '1',
          d.is_lakshmi_kubera || '0', d.is_popular_collection || '0', d.is_recommended || '0',
          0 // draft until an image is added
        ]
      )
      created.push({ row: i + 1, id: r.insertId, product_name: d.product_name })
    } catch (err) {
      failed.push({ row: i + 1, reason: err.code === 'ER_DUP_ENTRY' ? 'Duplicate product code/slug' : 'Database error' })
    }
  }

  logger.info('Admin bulk product import', { admin_id: req.user.id, created: created.length, failed: failed.length })
  return ok(res, { created: created.length, failed, created_items: created }, 201)
}

exports.updateProduct = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Product not found')

  const parsed = productSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message, 'VALIDATION_ERROR')
  const data = parsed.data

  const [exists] = await db.query('SELECT id, additional_images FROM products WHERE id = ?', [id])
  if (!exists.length) return notFound(res, 'Product not found')

  const { featured, additional } = collectFiles(req)

  const updates = []
  const params = []
  const setIf = (col, val) => {
    if (val !== undefined && val !== null && val !== '') {
      updates.push(`${col} = ?`)
      params.push(val)
    }
  }
  setIf('product_name', data.product_name)
  setIf('product_code', data.product_code)
  setIf('slug', data.slug ? slugify(data.slug) : undefined)
  setIf('category_id', data.category_id)
  setIf('subcategory_id', data.subcategory_id)
  setIf('ornament_type', data.ornament_type)
  setIf('ornament_weight', data.ornament_weight)
  setIf('discount_percentage', data.discount_percentage)
  setIf('miscalleneous_price', data.miscalleneous_price)
  setIf('short_description', data.short_description)
  setIf('description', data.description)
  setIf('features', data.features)
  setIf('general_info', data.general_info)
  setIf('hashtags', data.hashtags)
  setIf('stock', data.stock)
  setIf('is_lakshmi_kubera', data.is_lakshmi_kubera)
  setIf('is_popular_collection', data.is_popular_collection)
  setIf('is_recommended', data.is_recommended)
  if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status) }
  if (featured) { updates.push('featured_image = ?'); params.push(featured) }
  if (additional.length) {
    const merged = [exists[0].additional_images, additional.join(',')].filter(Boolean).join(',')
    updates.push('additional_images = ?'); params.push(merged)
  }
  if (!updates.length) return badRequest(res, 'No fields to update')

  updates.push('updated_at = NOW()')
  params.push(id)
  await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params)

  logger.info('Admin updated product', { admin_id: req.user.id, product_id: id })
  return ok(res, { id, updated: true })
}

exports.deleteProduct = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Product not found')
  // Soft delete — flip status to 0 so existing orders/reviews stay intact
  const [r] = await db.query('UPDATE products SET status = 0 WHERE id = ?', [id])
  if (!r.affectedRows) return notFound(res, 'Product not found')
  logger.info('Admin soft-deleted product', { admin_id: req.user.id, product_id: id })
  return ok(res, { id, status: 0 })
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────
exports.listOrders = async (req, res) => {
  const where = []
  const params = []
  if (req.query.payment) { where.push('payment_status = ?'); params.push(req.query.payment) }
  if (req.query.order_status) { where.push('order_status = ?'); params.push(req.query.order_status) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [rows] = await db.query(
    `SELECT id, order_id, user_id, billing_fullname, billing_email, billing_mobile,
            grandtotal, payment_mode, payment_status, order_status, coupon, created_at
     FROM orders ${whereSql}
     ORDER BY created_at DESC LIMIT 200`,
    params
  )
  return ok(res, rows)
}

exports.getOrder = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Order not found')

  const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id])
  if (!orders.length) return notFound(res, 'Order not found')
  const order = orders[0]

  // order_products links to the orders.order_id STRING (e.g. "LSJ-1777…"), not the numeric id.
  const [items] = await db.query(
    `SELECT id, product_id, product_name, product_image, product_slug, product_type,
            quantity, product_weight, price_per_gram, product_actual_price, product_price
     FROM order_products WHERE order_id = ? ORDER BY id`,
    [order.order_id]
  )

  return ok(res, {
    order,
    items: items.map((it) => ({
      ...it,
      product_image_url: img.product(it.product_image)
    }))
  })
}

exports.updateOrder = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Order not found')
  const fields = ['order_status', 'payment_status', 'remarks']
  const updates = []
  const params = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`)
      params.push(req.body[f])
    }
  }
  if (!updates.length) return badRequest(res, 'No fields to update')
  updates.push('updated_at = NOW()')
  params.push(id)
  await db.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params)
  logger.info('Admin updated order', { admin_id: req.user.id, order_id: id })
  return ok(res, { id, updated: true })
}

// ──────────────────────────────────────────────
// Gold rate (stored in the ornaments table)
// ──────────────────────────────────────────────
const RATE_24K_MATCHER = (n) => /24\s*k/i.test(n)
const RATE_22K_MATCHER = (n) => /22\s*k/i.test(n)

const findRateRow = async (matcher) => {
  const [rows] = await db.query('SELECT id, name, price, updated_at FROM ornaments WHERE status = 1')
  return rows.find((r) => matcher(String(r.name || '')))
}

exports.getGoldRate = async (_req, res) => {
  const row24 = await findRateRow(RATE_24K_MATCHER)
  const row22 = await findRateRow(RATE_22K_MATCHER)

  const rate24 = row24 ? parseFloat(row24.price) : 0
  const rate22 = row22 ? parseFloat(row22.price) : (rate24 ? Math.round(rate24 * 0.916) : 0)

  return ok(res, {
    rate_22k: rate22,
    rate_24k: rate24,
    has_explicit_22k: !!row22,
    updated_at: row24?.updated_at || row22?.updated_at || null
  })
}

const rateUpdateSchema = z.object({
  rate_24k: z.coerce.number().positive().max(1_000_000),
  rate_22k: z.coerce.number().positive().max(1_000_000).optional()
})

exports.updateGoldRate = async (req, res) => {
  const parsed = rateUpdateSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message, 'VALIDATION_ERROR')
  const { rate_24k, rate_22k } = parsed.data

  // Update / insert 24K row
  const row24 = await findRateRow(RATE_24K_MATCHER)
  if (row24) {
    await db.query('UPDATE ornaments SET price = ?, updated_at = NOW() WHERE id = ?', [
      String(rate_24k),
      row24.id
    ])
  } else {
    await db.query(
      "INSERT INTO ornaments (name, price, status, created_at) VALUES ('24k Gold Rate', ?, 1, NOW())",
      [String(rate_24k)]
    )
  }

  // Update / insert 22K row (only if explicitly provided)
  if (rate_22k != null) {
    const row22 = await findRateRow(RATE_22K_MATCHER)
    if (row22) {
      await db.query('UPDATE ornaments SET price = ?, updated_at = NOW() WHERE id = ?', [
        String(rate_22k),
        row22.id
      ])
    } else {
      await db.query(
        "INSERT INTO ornaments (name, price, status, created_at) VALUES ('22k Gold Rate', ?, 1, NOW())",
        [String(rate_22k)]
      )
    }
  }

  logger.info('Admin updated gold rate', { admin_id: req.user.id, rate_24k, rate_22k })
  return ok(res, { rate_24k, rate_22k: rate_22k ?? Math.round(rate_24k * 0.916), updated: true })
}

// ──────────────────────────────────────────────
// Reference data (for product form selects)
// ──────────────────────────────────────────────
exports.referenceData = async (_req, res) => {
  const [categories] = await db.query('SELECT id, name FROM categories WHERE status = 1 ORDER BY name')
  const [subcategories] = await db.query('SELECT id, category_id, name FROM sub_categories WHERE status = 1 ORDER BY name')
  const [ornaments] = await db.query('SELECT id, name, price FROM ornaments WHERE status = 1 ORDER BY name')
  return ok(res, { categories, subcategories, ornaments })
}
