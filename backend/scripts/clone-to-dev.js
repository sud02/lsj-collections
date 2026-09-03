#!/usr/bin/env node
/**
 * Clone the production schema into a separate development database.
 *
 * Local development points at the live Hostinger DB by default, which means a
 * test sign-up or a test checkout writes a real customer row. This builds an
 * isolated dev database instead: every table's structure is copied, but only
 * catalogue tables carry their rows across. No customer ever appears in dev.
 *
 * Source is read with SELECT/SHOW only — it is never written to.
 *
 * Usage:
 *   DEV_DB_NAME=u529052488_lsjdev \
 *   DEV_DB_USER=... DEV_DB_PASSWORD=... [DEV_DB_HOST=...] \
 *   node scripts/clone-to-dev.js [--drop]
 *
 *   --drop   recreate tables that already exist in the target (dev only)
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

// Structure + rows. Reference data the storefront needs to function.
const COPY_DATA = new Set([
  'categories',
  'sub_categories',
  'products',
  'product_variations',
  'attributes',
  'ornaments',
  'features',
  'partners',
  'advertisements',
  'coupons'
])

// Structure only. Customer-generated or personally identifying.
const STRUCTURE_ONLY = new Set([
  'users',
  'orders',
  'order_products',
  'cart',
  'wishlist',
  'ratings',
  'testimonials',
  'contact',
  'subscriptions',
  'admin' // seed with scripts/create-admin.js against the dev DB instead
])

const BATCH = 200

const required = (name) => {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing ${name}. See the usage comment at the top of this file.`)
    process.exit(1)
  }
  return v
}

;(async () => {
  const drop = process.argv.includes('--drop')

  const srcName = required('DB_NAME')
  const devName = required('DEV_DB_NAME')

  if (srcName === devName) {
    console.error('DEV_DB_NAME is the same as DB_NAME — refusing to clone a database onto itself.')
    process.exit(1)
  }

  const src = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: srcName,
    connectTimeout: 15000
  })

  const dev = await mysql.createConnection({
    host: process.env.DEV_DB_HOST || process.env.DB_HOST,
    port: +(process.env.DEV_DB_PORT || process.env.DB_PORT || 3306),
    user: required('DEV_DB_USER'),
    password: required('DEV_DB_PASSWORD'),
    database: devName,
    connectTimeout: 15000,
    multipleStatements: false
  })

  console.log(`\nsource → ${srcName}   target → ${devName}\n`)

  const [tables] = await src.query(
    'SELECT TABLE_NAME n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
    [srcName]
  )

  await dev.query('SET FOREIGN_KEY_CHECKS = 0')

  let created = 0
  let skipped = 0
  let copied = 0

  for (const { n: table } of tables) {
    const [[{ 'Create Table': ddl }]] = await src.query(`SHOW CREATE TABLE \`${table}\``)

    if (drop) await dev.query(`DROP TABLE IF EXISTS \`${table}\``)

    const [existing] = await dev.query(
      'SELECT COUNT(*) c FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [devName, table]
    )

    if (existing[0].c) {
      console.log(`  = ${table.padEnd(20)} exists, left alone`)
      skipped += 1
      continue
    }

    await dev.query(ddl)
    created += 1

    if (!COPY_DATA.has(table)) {
      const why = STRUCTURE_ONLY.has(table) ? 'structure only (customer data)' : 'structure only (unlisted)'
      console.log(`  + ${table.padEnd(20)} ${why}`)
      continue
    }

    const [rows] = await src.query(`SELECT * FROM \`${table}\``)
    if (!rows.length) {
      console.log(`  + ${table.padEnd(20)} no rows to copy`)
      continue
    }

    const cols = Object.keys(rows[0])
    const colList = cols.map((c) => `\`${c}\``).join(', ')

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      const placeholders = chunk.map(() => `(${cols.map(() => '?').join(', ')})`).join(', ')
      const values = chunk.flatMap((r) => cols.map((c) => r[c]))
      await dev.query(`INSERT INTO \`${table}\` (${colList}) VALUES ${placeholders}`, values)
    }

    copied += rows.length
    console.log(`  + ${table.padEnd(20)} ${rows.length} rows copied`)
  }

  await dev.query('SET FOREIGN_KEY_CHECKS = 1')

  console.log(`\n${created} tables created, ${skipped} left alone, ${copied} catalogue rows copied.`)
  console.log('Customer tables (users, orders, cart, wishlist, contact, subscriptions) are empty by design.\n')
  console.log('Next: point backend/.env at the dev database, then restart the server.\n')

  await src.end()
  await dev.end()
})().catch((err) => {
  console.error('\nClone failed:', err.message)
  process.exit(1)
})
