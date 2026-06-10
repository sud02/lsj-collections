const bcrypt = require('bcryptjs')

const ROUNDS = 10

exports.hash = (plain) => bcrypt.hash(plain, ROUNDS)

exports.compare = (plain, hashed) => {
  if (!plain || !hashed) return Promise.resolve(false)
  return bcrypt.compare(plain, hashed)
}
