const db = require('../config/db')
const { ok } = require('../utils/response')

// gold_rate table doesn't exist in this DB. Pull live per-gram prices from the
// `ornaments` table, looking for the nearest matches by name, with safe fallbacks.
exports.getLatest = async (_req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, price, updated_at FROM ornaments WHERE status = 1"
  )

  const find = (matcher) => {
    const hit = rows.find((r) => matcher(String(r.name).toLowerCase()))
    return hit ? parseFloat(hit.price) : null
  }

  const rate_24k = find((n) => n.includes('24k') || n.includes('24 k') || n.includes('24karat')) || 0
  const rate_22k =
    find((n) => n.includes('22k') || n.includes('22 k') || n.includes('22karat')) ||
    (rate_24k ? Math.round(rate_24k * 0.916) : 0)

  const latest = rows.reduce((acc, r) => {
    const t = r.updated_at ? new Date(r.updated_at).getTime() : 0
    return t > acc ? t : acc
  }, 0)

  return ok(res, {
    rate_22k: Number.isFinite(rate_22k) ? rate_22k : 0,
    rate_24k: Number.isFinite(rate_24k) ? rate_24k : 0,
    updated_at: latest ? new Date(latest).toISOString() : new Date().toISOString()
  })
}
