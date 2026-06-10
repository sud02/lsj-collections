const path = require('path')

const buildPublicUrl = (folder, filename) => {
  if (!filename) return null
  const apiUrl = (process.env.API_URL || '').replace(/\/+$/, '')
  return `${apiUrl}/uploads/${folder}/${filename}`
}

exports.fileToResponse = (file, folder) => {
  if (!file) return null
  return {
    filename: file.filename,
    original_name: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    folder,
    path: path.relative(process.cwd(), file.path),
    url: buildPublicUrl(folder, file.filename)
  }
}

exports.buildPublicUrl = buildPublicUrl
