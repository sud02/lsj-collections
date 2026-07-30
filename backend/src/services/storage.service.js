const cloudinary = require('cloudinary').v2

// Prefer the single CLOUDINARY_URL connection string (copy-paste from the dashboard,
// nothing to mistype). Fall back to the three separate vars if that isn't set.
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true }) // SDK auto-parses CLOUDINARY_URL
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })
}

const hasCloudinary = () =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  )

/**
 * Upload an image buffer to Cloudinary and return its permanent https URL.
 * @param {Buffer} buffer  file bytes (from multer memoryStorage)
 * @param {string} folder  logical folder, e.g. "product"
 * @returns {Promise<string>} secure_url stored directly in the DB
 */
const uploadBuffer = (buffer, folder = 'product') =>
  new Promise((resolve, reject) => {
    if (!hasCloudinary()) {
      return reject(new Error('Image storage is not configured (missing CLOUDINARY_* env vars)'))
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: `lsj/${folder}`, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    )
    stream.end(buffer)
  })

module.exports = { cloudinary, hasCloudinary, uploadBuffer }
