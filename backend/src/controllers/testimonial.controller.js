const { z } = require('zod')
const db = require('../config/db')
const img = require('../config/images')
const { ok, badRequest } = require('../utils/response')

exports.createSchema = z.object({
  name: z.string().min(2).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().min(5).max(1000),
  subject: z.string().max(255).optional()
})

exports.list = async (_req, res) => {
  const [rows] = await db.query(
    `SELECT id, name, subject, message, rating, image, created_at
     FROM testimonials
     WHERE status = 1
     ORDER BY created_at DESC`
  )

  const decorated = rows.map((r) => ({
    id: r.id,
    name: r.name,
    rating: Number(r.rating) || 0,
    review: r.message,
    subject: r.subject,
    image_url: img.testimonial(r.image),
    created_at: r.created_at
  }))
  return ok(res, decorated)
}

exports.create = async (req, res) => {
  const parsed = exports.createSchema.safeParse({
    name: req.body?.name,
    rating: req.body?.rating,
    review: req.body?.review,
    subject: req.body?.subject
  })
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0].message, 'VALIDATION_ERROR')
  }
  const { name, rating, review, subject } = parsed.data
  const imageFile = req.file ? req.file.filename : null

  // Moderation is on by default — admin must approve via /admin/testimonials
  // before the entry appears publicly. Override with TESTIMONIAL_AUTO_APPROVE=true
  const autoApprove = process.env.TESTIMONIAL_AUTO_APPROVE === 'true'
  const [result] = await db.query(
    `INSERT INTO testimonials (name, subject, message, rating, image, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [name, subject || 'Testimonial', review, rating, imageFile, autoApprove ? 1 : 0]
  )

  return ok(
    res,
    {
      id: result.insertId,
      name,
      rating,
      review,
      subject,
      image: imageFile,
      image_url: imageFile ? img.testimonial(imageFile) : null,
      message: autoApprove
        ? 'Thank you for sharing your experience.'
        : 'Thank you for your testimonial. It will appear after approval.'
    },
    201
  )
}
