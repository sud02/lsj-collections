const db = require('../config/db')
const img = require('../config/images')
const { ok } = require('../utils/response')

/**
 * The old PHP admin stored `location` as a numeric code, not the 'hero'/'split'
 * names the storefront filters on, so real banners never matched and the site
 * fell back to placeholders. Anything that isn't already a known name is
 * treated as a hero banner — which is what a full-width advert is.
 */
const KNOWN_POSITIONS = new Set(['hero', 'split'])
const normalizePosition = (location) => {
  const v = String(location || '').trim().toLowerCase()
  return KNOWN_POSITIONS.has(v) ? v : 'hero'
}

/**
 * Banner links were written for the old site (/product-view?slug=x) and 404 on
 * the Next.js routes. Rewrite the known legacy shapes; leave anything else be.
 */
const rewriteLegacyLink = (url) => {
  const raw = String(url || '').trim()
  if (!raw) return null

  try {
    const parsed = new URL(raw, 'https://lsjcollections.com')
    const slug = parsed.searchParams.get('slug')

    if (/\/product-view$/.test(parsed.pathname) && slug) return `/products/${slug}`
    if (/\/category-view$/.test(parsed.pathname) && slug) return `/products?search=${encodeURIComponent(slug)}`

    // Same-site absolute links become relative so they route client-side.
    if (/(^|\.)lsjcollections\.com$/i.test(parsed.hostname)) {
      return `${parsed.pathname}${parsed.search}` || '/products'
    }
    return raw
  } catch {
    return raw
  }
}

exports.list = async (_req, res) => {
  const [rows] = await db.query(
    `SELECT id, name, image, description, url, location
     FROM advertisements
     WHERE status = 1
     ORDER BY id DESC`
  )

  const decorated = rows
    // Rows still holding a bare filename point at the old PHP host, which no
    // longer exists. A banner whose image 404s is worse than one fewer banner.
    .filter((r) => /^https?:\/\//i.test(String(r.image || '').trim()))
    .map((r) => ({
    id: r.id,
    title: r.name,
    description: r.description,
    link: rewriteLegacyLink(r.url),
    link_url: rewriteLegacyLink(r.url),
    image_url: img.advertisement(r.image),
    position: normalizePosition(r.location)
    }))
  return ok(res, decorated)
}
