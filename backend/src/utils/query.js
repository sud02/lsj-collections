const db = require('../config/db')

exports.query = (sql, params = []) => db.query(sql, params)

exports.first = async (sql, params = []) => {
  const [rows] = await db.query(sql, params)
  return rows[0] || null
}

exports.many = async (sql, params = []) => {
  const [rows] = await db.query(sql, params)
  return rows
}

exports.exists = async (sql, params = []) => {
  const [rows] = await db.query(sql, params)
  return rows.length > 0
}

exports.transaction = async (fn) => {
  const conn = await db.getConnection()
  await conn.beginTransaction()
  try {
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
