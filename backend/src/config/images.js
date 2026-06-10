const BASE = (process.env.CDN_URL || '').replace(/\/+$/, '')
const API_BASE = (process.env.API_URL || '').replace(/\/+$/, '')

const isLocal = (filename) => filename.startsWith('local-')

const build = (folder) => (filename) => {
  if (!filename || typeof filename !== 'string') return null
  const clean = filename.trim()
  if (!clean) return null
  if (/^https?:\/\//i.test(clean)) return clean
  if (isLocal(clean)) return `${API_BASE}/uploads/${folder}/${clean}`
  return `${BASE}/${folder}/${clean}`
}

const productMultiple = (csv) => {
  if (!csv || typeof csv !== 'string') return []
  return csv.split(',')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((f) => {
      if (/^https?:\/\//i.test(f)) return f
      if (isLocal(f)) return `${API_BASE}/uploads/product/${f}`
      return `${BASE}/product/${f}`
    })
}

module.exports = {
  product: build('product'),
  subcategory: build('subcategory'),
  category: build('category'),
  advertisement: build('advertisements'),
  partner: build('partners'),
  feature: build('feature'),
  customization: build('customizations'),
  testimonial: build('testimonial'),
  review: build('review'),
  video: build('product/videos'),
  productMultiple
}
