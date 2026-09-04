const mysql = require('mysql2/promise')
const logger = require('../utils/logger')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: false,
  timezone: 'Z'
})

/**
 * Keep the two environments on their own data.
 *
 * Production must use the live database; development must not. Getting this
 * backwards is silent and expensive in both directions — a local test writing a
 * real customer row, or worse, production writing orders into the dev database
 * where nobody would ever find them.
 */
const { isDevDatabase, isProductionRuntime } = require('../utils/environment')

const checkDatabaseEnvironment = () => {
  const host = String(process.env.DB_HOST || '')
  const name = String(process.env.DB_NAME || '')
  const isProd = isProductionRuntime()
  const looksDev = isDevDatabase()

  if (isProd && looksDev) {
    // Fail fast rather than serve customers against throwaway data. On Render a
    // crashed deploy is not promoted, so the previous release keeps running.
    logger.error(
      'Refusing to start: NODE_ENV=production but DB_NAME looks like a development ' +
      'database. Point DB_NAME at the live database, or unset NODE_ENV=production.',
      { host, db: name }
    )
    process.exit(1)
  }

  if (!isProd && !looksDev) {
    logger.warn(
      '⚠  Connected to the LIVE database in development — every sign-up and order ' +
      'you create here is a real customer record. Run scripts/clone-to-dev.js and ' +
      'point DB_NAME at the dev database.',
      { host, db: name }
    )
  }
}

pool.getConnection()
  .then((conn) => {
    logger.info('MySQL connected', { host: process.env.DB_HOST, db: process.env.DB_NAME })
    checkDatabaseEnvironment()
    conn.release()
  })
  .catch((err) => {
    logger.error('MySQL initial probe failed — server stays up, /health will report 503', {
      message: err.message,
      code: err.code,
      hint: err.code === 'ER_ACCESS_DENIED_ERROR'
        ? 'Whitelist your current IP in Hostinger → Remote MySQL'
        : undefined
    })
  })

module.exports = pool
