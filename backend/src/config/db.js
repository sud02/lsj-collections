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

pool.getConnection()
  .then((conn) => {
    logger.info('MySQL connected', { host: process.env.DB_HOST, db: process.env.DB_NAME })
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
