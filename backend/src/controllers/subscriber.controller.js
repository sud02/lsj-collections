const { z } = require('zod')
const db = require('../config/db')
const email = require('../services/email.service')
const logger = require('../utils/logger')
const { ok } = require('../utils/response')

exports.subscribeSchema = z.object({
  email: z.string().email()
})

exports.subscribe = async (req, res) => {
  const { email: addr } = req.body

  const [existing] = await db.query(
    'SELECT id FROM subscriptions WHERE email = ? LIMIT 1',
    [addr]
  )
  if (existing.length) {
    return ok(res, { message: 'Already subscribed', id: existing[0].id })
  }

  const [result] = await db.query(
    'INSERT INTO subscriptions (email, subscribed_at) VALUES (?, NOW())',
    [addr]
  )

  email
    .sendSubscriberNotification({ email: addr })
    .catch((err) => logger.error('Subscriber email failed', { message: err.message }))

  return ok(res, { id: result.insertId, message: 'Subscribed to newsletter' }, 201)
}
