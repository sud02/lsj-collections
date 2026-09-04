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
 * The original files are not on the web any more, so recover them first
 * (Hostinger hPanel → File Manager → the old public_html/panels/admin/product)
 * and point --dir at the folder.
 *
 * Usage:
 *   node scripts/migrate-images-to-cloudinary.js --dir ~/legacy-images          # dry run
 *   node scripts/migrate-images-to-cloudinary.js --dir ~/legacy-images --commit
 *
 * Dry run by default: it reports what it would upload and which files are
 * missing, and writes nothing to Cloudinary or the database.
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const db = require('../src/config/db')
const storage = require('../src/services/storage.service')

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i !== -1 ? process.argv[i + 1] : null
}

const dir = arg('--dir')
const commit = process.argv.includes('--commit')

const isLegacy = (v) => v && !/^https?:\/\//i.test(v.trim())
const split = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean)

;(async () => {
  if (!dir) {
    console.error('Missing --dir <folder of recovered image files>')
    process.exit(1)
  }
  if (!fs.existsSync(dir)) {
    console.error(`Folder not found: ${dir}`)
    process.exit(1)
  }
  if (!storage.hasCloudinary || !storage.hasCloudinary()) {
    console.error('Cloudinary is not configured — set CLOUDINARY_URL (or the three CLOUDINARY_* vars).')
    process.exit(1)
  }

  const onDisk = new Set(fs.readdirSync(dir))
  const cache = new Map() // filename -> uploaded URL, so shared files upload once

  const [products] = await db.query(
    'SELECT id, product_name, featured_image, additional_images FROM products'
  )

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
      if (!onDisk.has(filename)) {
        missing += 1
        missingNames.add(filename)
        return null
      }
      if (!commit) {
        cache.set(filename, '(would upload)')
        uploaded += 1
        return '(would upload)'
      }
      const buffer = fs.readFileSync(path.join(dir, filename))
      const url = await storage.uploadBuffer(buffer, 'product')
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
              `${missing} missing from --dir.`)

  if (missingNames.size) {
    console.log('\nNot found on disk (first 20):')
    ;[...missingNames].slice(0, 20).forEach((n) => console.log('  ' + n))
  }
  if (!commit) console.log('\nNothing was changed. Re-run with --commit to apply.\n')

  process.exit(0)
})().catch((err) => {
  console.error('\nMigration failed:', err.message)
  process.exit(1)
})
