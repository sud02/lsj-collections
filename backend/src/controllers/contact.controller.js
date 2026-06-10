const { z } = require('zod')
const db = require('../config/db')
const email = require('../services/email.service')
const logger = require('../utils/logger')
const { ok } = require('../utils/response')

exports.createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(255)
})

exports.create = async (req, res) => {
  const { name, email: senderEmail, subject, message } = req.body

  const [result] = await db.query(
    `INSERT INTO contact (name, email, subject, message, submitted_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [name, senderEmail, subject, message]
  )

  email
    .sendContactNotification({ name, email: senderEmail, subject, message })
    .catch((err) => logger.error('Contact email failed', { message: err.message }))

  return ok(res, { id: result.insertId, message: 'Thank you for contacting us.' }, 201)
}
