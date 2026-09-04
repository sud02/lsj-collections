#!/usr/bin/env node
/**
 * Move legacy images onto Cloudinary.
 *
 * Rows created by the old PHP admin store a bare filename, served from
 * https://lsjcollections.com/panels/admin/<folder>/<filename>. That path no
 * longer exists — the domain now serves the Next.js app from Vercel — so those
 * images 404 for every visitor. New uploads already go to Cloudinary and store
 * a full https URL, which is what this brings the rest in line with.
 *
 * The files themselves are still on the Hostinger account; only the hostname
 * stopped pointing there. --from-origin fetches each one straight from the
 * origin server by IP, sending the Host header the old vhost expects. Its
 * Let's Encrypt certificate expired when the domain moved (Hostinger can no
 * longer complete HTTP-01 validation for a name it doesn't serve), so
 * certificate validation is disabled for that host only. These are public
 * catalogue images from a pinned IP, and every response is checked to be an
 * image before it is uploaded.
 *
 * Alternatively recover the files by hand (hPanel → File Manager →
 * public_html/panels/admin/<folder>) and point --dir at a folder holding them.
 *
 * Usage:
 *   node scripts/migrate-images-to-cloudinary.js --from-origin            # dry run
 *   node scripts/migrate-images-to-cloudinary.js --from-origin --commit
 *   node scripts/migrate-images-to-cloudinary.js --from-origin --commit --resume
 *
 * Dry run by default: it reports what it would upload and what it cannot
 * reach, and writes nothing to Cloudinary or the database. Rows already
 * holding an https URL are skipped, so a rerun resumes a part-finished run.
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
const resume = process.argv.includes('--resume')
const fromOrigin = process.argv.includes('--from-origin')

// The old vhost, addressed directly. Overridable if the account ever moves.
const ORIGIN_IP = process.env.LEGACY_ORIGIN_IP || '193.203.184.148'
const ORIGIN_HOST = process.env.LEGACY_ORIGIN_HOST || 'lsjcollections.com'
const ORIGIN_ROOT = process.env.LEGACY_ORIGIN_ROOT || '/panels/admin'

/**
 * Every column that still holds a bare filename, with the origin folder it was
 * served from (mirrors src/config/images.js) and where the file goes on
 * Cloudinary. `csv` marks columns holding a comma-separated list.
 */
const TARGETS = [
  { table: 'products',       column: 'featured_image',    folder: 'product' },
  { table: 'products',       column: 'additional_images', folder: 'product', csv: true },
  { table: 'categories',     column: 'image',             folder: 'category' },
  { table: 'sub_categories', column: 'image',             folder: 'subcategory' },
  { table: 'advertisements', column: 'image',             folder: 'advertisements' },
  { table: 'partners',       column: 'image',             folder: 'partners' },
  { table: 'testimonials',   column: 'image',             folder: 'testimonial' },
  // Historical order records — keeps past orders showing what was bought.
  { table: 'order_products', column: 'product_image',     folder: 'product' }
]

const isLegacy = (v) =>
  typeof v === 'string' && v.trim() !== '' && !/^https?:\/\//i.test(v.trim())

const splitCsv = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean)

/** Fetch one legacy file from the origin server. Resolves null if it isn't there. */
const fetchFromOrigin = (filename, folder) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: ORIGIN_IP,
        servername: ORIGIN_HOST,
        // Expired certificate on a vhost the hostname no longer points at.
        rejectUnauthorized: false,
        path: `${ORIGIN_ROOT}/${folder}/${encodeURIComponent(filename)}`,
        headers: { Host: ORIGIN_HOST },
        timeout: 30000
      },
      (res) => {
        if (res.statusCode !== 200 || !/^image\//.test(res.headers['content-type'] || '')) {
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

const cache = new Map() // `${folder}/${filename}` -> uploaded URL
const missingNames = new Set()
let uploaded = 0
let missing = 0

const onDisk = dir && fs.existsSync(dir) ? new Set(fs.readdirSync(dir)) : new Set()

/** Resolve one legacy filename to a Cloudinary URL, uploading it if needed. */
const resolveFile = async (filename, folder) => {
  const key = `${folder}/${filename}`
  if (cache.has(key)) return cache.get(key)

  let buffer = null
  if (onDisk.has(filename)) {
    buffer = fs.readFileSync(path.join(dir, filename))
  } else if (fromOrigin) {
    try {
      buffer = await fetchFromOrigin(filename, folder)
    } catch {
      buffer = null
    }
  }

  if (!buffer) {
    missing += 1
    missingNames.add(key)
    return null
  }

  if (!commit) {
    uploaded += 1
    cache.set(key, '(would upload)')
    return '(would upload)'
  }

  // Cloudinary intermittently answers 5xx during a long run. Retry with backoff
  // rather than abandoning a part-finished migration.
  let url = null
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      url = await storage.uploadBuffer(buffer, folder)
      break
    } catch (err) {
      if (attempt === 4) throw err
      const wait = attempt * 3000
      console.log(`      retry ${attempt}/3 in ${wait / 1000}s — ${err.message}`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }

  uploaded += 1
  cache.set(key, url)
  return url
}

;(async () => {
  if (!dir && !fromOrigin) {
    console.error('Pass --from-origin, or --dir <folder of recovered image files>')
    process.exit(1)
  }
  if (dir && !fs.existsSync(dir)) {
    console.error(`Folder not found: ${dir}`)
    process.exit(1)
  }
  if (!storage.hasCloudinary()) {
    console.error('Cloudinary is not configured — set CLOUDINARY_URL (or the three CLOUDINARY_* vars).')
    process.exit(1)
  }

  console.log(`\nDatabase: ${process.env.DB_NAME}${commit ? '' : '   (dry run)'}\n`)

  // Snapshot every column we are about to overwrite. The filenames are the only
  // record of what each row pointed at, so a rollback needs them on disk first.
  if (commit && !resume) {
    const snapshot = {}
    for (const { table, column } of TARGETS) {
      const [rows] = await db.query(`SELECT id, \`${column}\` AS value FROM \`${table}\``)
      snapshot[`${table}.${column}`] = rows
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = path.join(__dirname, `image-backup-${process.env.DB_NAME}-${stamp}.json`)
    fs.writeFileSync(file, JSON.stringify(snapshot, null, 1))
    console.log(`Backup of current image columns → ${file}\n`)
  }

  for (const target of TARGETS) {
    const { table, column, folder, csv } = target
    const [rows] = await db.query(
      `SELECT id, \`${column}\` AS value FROM \`${table}\``
    )
    const pending = rows.filter((r) =>
      csv ? splitCsv(r.value).some(isLegacy) : isLegacy(r.value)
    )
    if (!pending.length) {
      console.log(`${table}.${column} — nothing to do`)
      continue
    }

    console.log(`${table}.${column} — ${pending.length} row${pending.length === 1 ? '' : 's'}`)

    for (const row of pending) {
      let next
      if (csv) {
        const parts = []
        for (const f of splitCsv(row.value)) {
          if (!isLegacy(f)) { parts.push(f); continue }
          const url = await resolveFile(f, folder)
          if (url) parts.push(url)
        }
        next = parts.join(',')
      } else {
        next = await resolveFile(row.value.trim(), folder)
      }

      if (!commit || !next) continue
      await db.query(
        `UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ?`,
        [next, row.id]
      )
    }
    console.log(`  done`)
  }

  console.log(`\n${commit ? 'Migrated' : 'Dry run'}: ${uploaded} file${uploaded === 1 ? '' : 's'} ` +
              `${commit ? 'uploaded' : 'ready to upload'}, ${missing} unavailable.`)
  if (missingNames.size) {
    console.log('\nCould not be retrieved:')
    ;[...missingNames].slice(0, 20).forEach((n) => console.log('  ' + n))
  }
  if (!commit) console.log('\nNothing was changed. Re-run with --commit to apply.\n')

  process.exit(0)
})().catch((err) => {
  console.error('\nMigration failed:', err.message)
  process.exit(1)
})
