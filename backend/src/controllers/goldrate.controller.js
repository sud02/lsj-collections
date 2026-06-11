const db = require('../config/db')
const { ok } = require('../utils/response')

// gold_rate table doesn't exist in this DB. Rates are stored as rows in the
// `ornaments` table — admin edits them via /api/admin/gold-rate.
exports.getLatest = async (_req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, price, updated_at FROM ornaments WHERE status = 1'
  )

  const find = (matcher) => rows.find((r) => matcher(String(r.name || '')))

  const row24 = find((n) => /24\s*k/i.test(n))
  const row22 = find((n) => /22\s*k/i.test(n))

  const rate_24k = row24 ? parseFloat(row24.price) : 0
  const rate_22k = row22
    ? parseFloat(row22.price)
    : rate_24k
      ? Math.round(rate_24k * 0.916)
      : 0

  // Show the more meaningful of the two timestamps, falling back to now.
  const t24 = row24?.updated_at ? new Date(row24.updated_at).getTime() : 0
  const t22 = row22?.updated_at ? new Date(row22.updated_at).getTime() : 0
  const latest = Math.max(t24, t22)

  return ok(res, {
    rate_22k: Number.isFinite(rate_22k) ? rate_22k : 0,
    rate_24k: Number.isFinite(rate_24k) ? rate_24k : 0,
    updated_at: latest ? new Date(latest).toISOString() : null
  })
}
