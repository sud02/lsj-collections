const admin = require('../config/firebase')

exports.verifyIdToken = async (idToken) => {
  if (!admin || !admin.apps.length) {
    const err = new Error('Firebase Admin not configured')
    err.code = 'FIREBASE_NOT_CONFIGURED'
    err.status = 500
    throw err
  }
  return admin.auth().verifyIdToken(idToken)
}
