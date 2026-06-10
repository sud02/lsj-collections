const db = require('../config/db')
const img = require('../config/images')
const { ok } = require('../utils/response')

exports.list = async (_req, res) => {
  const [rows] = await db.query(
    `SELECT id, name, image, description, url, location
     FROM advertisements
     WHERE status = 1
     ORDER BY id DESC`
  )

  const decorated = rows.map((r) => ({
    id: r.id,
    title: r.name,
    description: r.description,
    link: r.url,
    link_url: r.url,
    image_url: img.advertisement(r.image),
    position: r.location || 'hero'
  }))
  return ok(res, decorated)
}
