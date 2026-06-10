const admin = require('firebase-admin')
const logger = require('../utils/logger')

let initialized = false

function initFirebase() {
  if (initialized) return admin
  if (admin.apps.length) {
    initialized = true
    return admin
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !rawKey) {
    logger.warn('Firebase Admin not configured — phone-login will be unavailable')
    return null
  }

  const privateKey = rawKey.replace(/\\n/g, '\n')
  if (!privateKey.includes('BEGIN PRIVATE KEY') || privateKey.includes('...')) {
    logger.warn('FIREBASE_PRIVATE_KEY looks like a placeholder — phone-login will be unavailable')
    return null
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    })
    initialized = true
    logger.info('Firebase Admin initialised', { projectId })
    return admin
  } catch (err) {
    logger.error('Firebase Admin init failed — phone-login will be unavailable', {
      message: err.message
    })
    return null
  }
}

initFirebase()

module.exports = admin
