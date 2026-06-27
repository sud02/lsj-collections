/**
 * Create or reset an admin account for the LSJ admin portal.
 *
 * The `admin` table seed rows ship with PLAINTEXT passwords, which the login
 * endpoint refuses to authenticate. Run this once to set a real, bcrypt-hashed
 * credential.
 *
 *   node scripts/create-admin.js <email> <password> [role]
 *
 * role defaults to "admin". Existing rows (matched by email) are updated;
 * otherwise a new row is inserted and activated.
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('../src/config/db')

async function main() {
  const [, , emailArg, passwordArg, roleArg] = process.argv
  const email = (emailArg || '').toLowerCase().trim()
  const password = passwordArg || ''
  const role = (roleArg || 'admin').trim()

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [role]')
    process.exit(1)
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Error: invalid email address')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('Error: password must be at least 8 characters')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 10)

  const [existing] = await db.query('SELECT id FROM admin WHERE email = ? LIMIT 1', [email])

  if (existing.length) {
    await db.query(
      'UPDATE admin SET password = ?, role = ?, status = 1, updated_at = NOW() WHERE id = ?',
      [hash, role, existing[0].id]
    )
    console.log(`✓ Updated admin "${email}" (id ${existing[0].id}), role="${role}", active.`)
  } else {
    const [r] = await db.query(
      'INSERT INTO admin (email, password, role, status, created_at) VALUES (?, ?, ?, 1, NOW())',
      [email, hash, role]
    )
    console.log(`✓ Created admin "${email}" (id ${r.insertId}), role="${role}", active.`)
  }

  await db.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
