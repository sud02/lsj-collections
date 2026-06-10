const { ok, badRequest } = require('../utils/response')
const { fileToResponse } = require('../services/upload.service')

const handle = (folder) => (req, res) => {
  if (!req.file) return badRequest(res, 'No file uploaded', 'NO_FILE')
  return ok(res, fileToResponse(req.file, folder), 201)
}

exports.reviewImage = handle('review')
exports.customizationImage = handle('customization')
