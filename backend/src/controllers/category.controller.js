const db = require('../config/db')
const img = require('../config/images')
const { ok, notFound, paginated, buildPagination } = require('../utils/response')
const { toPositiveInt } = require('../utils/sanitize')
const { productSelect } = require('../utils/sql')
const { cleanName } = require('../utils/format')

const decorateCategory = (c) => ({
  ...c,
  name: cleanName(c.name),
  slug: c.slug || String(c.id),
  image_url: img.category(c.image)
})
const decorateSub = (s) => ({
  ...s,
  name: cleanName(s.name),
  category_id: parseInt(s.category_id, 10) || s.category_id,
  slug: s.slug || String(s.id),
  image_url: img.subcategory(s.image)
})

exports.listCategories = async (_req, res) => {
  const [categories] = await db.query(
    'SELECT * FROM categories WHERE status = 1 ORDER BY id ASC'
  )
  const [subs] = await db.query(
    'SELECT * FROM sub_categories WHERE status = 1 ORDER BY id ASC'
  )

  const subsByCategory = subs.reduce((acc, s) => {
    const cid = parseInt(s.category_id, 10)
    if (!acc[cid]) acc[cid] = []
    acc[cid].push(decorateSub(s))
    return acc
  }, {})

  const result = categories.map((c) => ({
    ...decorateCategory(c),
    subcategories: subsByCategory[c.id] || []
  }))

  return ok(res, result)
}

exports.getCategory = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Category not found')

  const [rows] = await db.query(
    'SELECT * FROM categories WHERE id = ? AND status = 1',
    [id]
  )
  if (!rows.length) return notFound(res, 'Category not found')

  const [subs] = await db.query(
    'SELECT * FROM sub_categories WHERE category_id = ? AND status = 1 ORDER BY id ASC',
    [String(id)]
  )

  return ok(res, {
    ...decorateCategory(rows[0]),
    subcategories: subs.map(decorateSub)
  })
}

exports.getSubcategoryProducts = async (req, res) => {
  const id = toPositiveInt(req.params.id)
  if (!id) return notFound(res, 'Subcategory not found')

  const [subs] = await db.query(
    'SELECT * FROM sub_categories WHERE id = ? AND status = 1',
    [id]
  )
  if (!subs.length) return notFound(res, 'Subcategory not found')

  const page = toPositiveInt(req.query.page, 1)
  const limit = Math.min(toPositiveInt(req.query.limit, 24), 60)
  const offset = (page - 1) * limit

  const [countRows] = await db.query(
    'SELECT COUNT(*) AS total FROM products WHERE subcategory_id = ? AND status = 1',
    [id]
  )
  const total = countRows[0].total

  const [products] = await db.query(
    `SELECT ${productSelect('p')}
     FROM products p
     LEFT JOIN ornaments o ON o.id = p.ornament_type
     WHERE p.subcategory_id = ? AND p.status = 1
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [id, limit, offset]
  )

  const decorated = products.map((p) => ({
    ...p,
    price: Number(p.discounted_price) || 0,
    mrp: Number(p.mrp) || 0,
    featured_image_url: img.product(p.featured_image),
    additional_image_urls: img.productMultiple(p.additional_images),
    additional_images: img.productMultiple(p.additional_images)
  }))

  return paginated(res, decorated, buildPagination(total, page, limit))
}
