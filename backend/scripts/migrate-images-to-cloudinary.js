#!/usr/bin/env node
/**
 * Move legacy product images onto Cloudinary.
 *
 * Product rows created by the old PHP admin store a bare filename, served from
 * https://lsjcollections.com/panels/admin/product/<filename>. That path no
 * longer exists — the domain now serves the Next.js app from Vercel — so those
 * images 404 for every visitor. New uploads already go to Cloudinary and store
 * a full https URL, which is what this brings the rest in line with.
 *
 * The files themselves are still on the Hostinger account — only the hostname
 * stopped pointing there — so --from-origin fetches each one straight from the
 * origin server by IP, sending the Host header the old vhost expects. Its
 * Let's Encrypt certificate expired when the domain moved (Hostinger can no
 * longer complete HTTP-01 validation for a name it doesn't serve), so
 * certificate validation is disabled for that host only. These are public
 * catalogue images fetched from a pinned IP, and every response is checked to
 * be an image before it is uploaded.
 *
 * Alternatively recover the files by hand (hPanel → File Manager →
 * public_html/panels/admin/product) and point --dir at the folder.
 *
 * Usage:
 *   node scripts/migrate-images-to-cloudinary.js --from-origin            # dry run
 *   node scripts/migrate-images-to-cloudinary.js --from-origin --commit
 *   node scripts/migrate-images-to-cloudinary.js --dir ~/legacy-images --commit
 *
 * Dry run by default: it reports what it would upload and what it cannot
 * reach, and writes nothing to Cloudinary or the database.
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const https = require('https')
const db = require('../src/config/db')
const storage = require('../src/services/storage.service')

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i !== -1 ? process.argv[i + 1] : null
}

const dir = arg('--dir')
const commit = process.argv.includes('--commit')
const fromOrigin = process.argv.includes('--from-origin')

// The old vhost, addressed directly. Overridable if the account ever moves.
const ORIGIN_IP = process.env.LEGACY_ORIGIN_IP || '193.203.184.148'
const ORIGIN_HOST = process.env.LEGACY_ORIGIN_HOST || 'lsjcollections.com'
const ORIGIN_PATH = process.env.LEGACY_ORIGIN_PATH || '/panels/admin/product'

/** Fetch one legacy file from the origin server. Resolves null if it isn't there. */
const fetchFromOrigin = (filename) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: ORIGIN_IP,
        servername: ORIGIN_HOST,
        // Expired certificate on a vhost the hostname no longer points at.
        rejectUnauthorized: false,
        path: `${ORIGIN_PATH}/${encodeURIComponent(filename)}`,
        headers: { Host: ORIGIN_HOST },
        timeout: 30000
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          return resolve(null)
        }
        if (!/^image\//.test(res.headers['content-type'] || '')) {
          res.resume()
          return resolve(null)
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      }
    )
    req.on('timeout', () => req.destroy(new Error('origin timeout')))
    req.on('error', reject)
    req.end()
  })

const isLegacy = (v) => v && !/^https?:\/\//i.test(v.trim())
const split = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean)

;(async () => {
  if (!dir && !fromOrigin) {
    console.error('Pass --from-origin, or --dir <folder of recovered image files>')
    process.exit(1)
  }
  if (dir && !fs.existsSync(dir)) {
    console.error(`Folder not found: ${dir}`)
    process.exit(1)
  }
  if (!storage.hasCloudinary || !storage.hasCloudinary()) {
    console.error('Cloudinary is not configured — set CLOUDINARY_URL (or the three CLOUDINARY_* vars).')
    process.exit(1)
  }

  const onDisk = dir ? new Set(fs.readdirSync(dir)) : new Set()
  const cache = new Map() // filename -> uploaded URL, so shared files upload once

  const [products] = await db.query(
    'SELECT id, product_name, featured_image, additional_images FROM products'
  )

  // Snapshot the columns we are about to overwrite. The filenames are the only
  // record of what each product pointed at, so a rollback needs them on disk
  // before the first UPDATE.
  if (commit && !process.argv.includes('--resume')) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backup = path.join(__dirname, `image-backup-${process.env.DB_NAME}-${stamp}.json`)
    fs.writeFileSync(
      backup,
      JSON.stringify(
        products.map(({ id, featured_image, additional_images }) => ({
          id, featured_image, additional_images
        })),
        null,
        1
      )
    )
    console.log(`Backup of current image columns → ${backup}\n`)
  }

  let needed = 0
  let uploaded = 0
  let missing = 0
  const missingNames = new Set()

  for (const p of products) {
    const featured = isLegacy(p.featured_image) ? p.featured_image.trim() : null
    const extras = split(p.additional_images).filter(isLegacy)
    if (!featured && !extras.length) continue

    const resolve = async (filename) => {
      needed += 1
      if (cache.has(filename)) return cache.get(filename)

      let buffer = null
      if (dir && onDisk.has(filename)) {
        buffer = fs.readFileSync(path.join(dir, filename))
      } else if (fromOrigin) {
        try {
          buffer = await fetchFromOrigin(filename)
        } catch (err) {
          buffer = null
        }
      }

      if (!buffer) {
        missing += 1
        missingNames.add(filename)
        return null
      }
      if (!commit) {
        cache.set(filename, '(would upload)')
        uploaded += 1
        return '(would upload)'
      }
      // Cloudinary occasionally answers 5xx under a sustained upload run.
      // Retry with backoff rather than abandoning a part-finished migration.
      let url = null
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
          url = await storage.uploadBuffer(buffer, 'product')
          break
        } catch (err) {
          if (attempt === 4) throw err
          const wait = attempt * 2000
          console.log(`    retry ${attempt}/3 in ${wait / 1000}s — ${err.message}`)
          await new Promise((r) => setTimeout(r, wait))
        }
      }
      cache.set(filename, url)
      uploaded += 1
      return url
    }

    const newFeatured = featured ? await resolve(featured) : null
    const newExtras = []
    for (const e of extras) {
      const url = await resolve(e)
      if (url) newExtras.push(url)
    }

    if (!commit) continue

    const sets = []
    const vals = []
    if (newFeatured) { sets.push('featured_image = ?'); vals.push(newFeatured) }
    if (newExtras.length) { sets.push('additional_images = ?'); vals.push(newExtras.join(',')) }
    if (!sets.length) continue

    vals.push(p.id)
    await db.query(`UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, vals)
    console.log(`  ✓ ${String(p.id).padStart(4)}  ${p.product_name.slice(0, 40)}`)
  }

  console.log(`\n${commit ? 'Migrated' : 'Dry run'}: ${needed} legacy references, ` +
              `${uploaded} file${uploaded === 1 ? '' : 's'} ${commit ? 'uploaded' : 'ready to upload'}, ` +
              `${missing} unavailable.`)

  if (missingNames.size) {
    console.log('\nCould not be retrieved (first 20):')
    ;[...missingNames].slice(0, 20).forEach((n) => console.log('  ' + n))
  }
  if (!commit) console.log('\nNothing was changed. Re-run with --commit to apply.\n')

  process.exit(0)
})().catch((err) => {
  console.error('\nMigration failed:', err.message)
  process.exit(1)
})
