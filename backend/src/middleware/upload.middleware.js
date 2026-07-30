const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { v4: uuid } = require('uuid')

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'))
  }
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'))
  }
  cb(null, true)
}

const buildStorage = (folder) => {
  const dir = path.join(process.cwd(), 'uploads', folder)
  fs.mkdirSync(dir, { recursive: true })
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `local-${Date.now()}-${uuid()}${ext}`)
    }
  })
}

const buildUploader = (folder, maxFiles = 1) =>
  multer({
    storage: buildStorage(folder),
    fileFilter,
    limits: { fileSize: MAX_SIZE, files: maxFiles }
  })

exports.reviewUpload = buildUploader('review').single('image')
exports.testimonialUpload = buildUploader('testimonial').single('image')
exports.customizationUpload = buildUploader('customization').single('image')

// Admin product upload — featured + up to 8 additional images in one request.
// Uses in-memory storage so the controller can stream buffers to Cloudinary
// (permanent hosting) instead of Railway's ephemeral disk.
const productMemoryUploader = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 9 }
})
exports.productUpload = productMemoryUploader.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'additional_images', maxCount: 8 }
])
exports.productSingleUpload = productMemoryUploader.single('image')
