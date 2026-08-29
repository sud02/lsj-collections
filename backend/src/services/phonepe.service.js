const crypto = require('crypto')
const axios = require('axios')
const cfg = require('../config/phonepe')
const logger = require('../utils/logger')

// ── OAuth token (cached in-memory until shortly before expiry) ──
let cachedToken = null // { token, expiresAt: ms }

async function getAccessToken() {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.token

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_version: String(cfg.clientVersion),
    client_secret: cfg.clientSecret,
    grant_type: 'client_credentials'
  })

  const { data } = await axios.post(`${cfg.authBaseUrl}${cfg.endpoints.token}`, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000
  })

  const token = data.access_token
  if (!token) {
    const err = new Error('PhonePe token response missing access_token')
    err.code = 'PHONEPE_TOKEN_FAILED'
    throw err
  }
  // expires_at is epoch seconds; fall back to ~45 min if absent.
  const expiresAt = data.expires_at ? Number(data.expires_at) * 1000 : now + 45 * 60_000
  cachedToken = { token, expiresAt }
  return token
}

exports.getAccessToken = getAccessToken

const authHeader = (token) => ({ Authorization: `O-Bearer ${token}` })

// ── Create a hosted-checkout payment; returns { orderId, state, redirectUrl } ──
exports.createPayment = async ({ merchantOrderId, amountPaise, redirectUrl }) => {
  const token = await getAccessToken()
  const payload = {
    merchantOrderId,
    amount: amountPaise,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      merchantUrls: { redirectUrl }
    }
  }

  try {
    const { data } = await axios.post(`${cfg.apiBaseUrl}${cfg.endpoints.pay}`, payload, {
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      timeout: 30000
    })
    logger.info('PhonePe payment created', { merchantOrderId, orderId: data.orderId, state: data.state })
    return data
  } catch (e) {
    logger.error('PhonePe createPayment failed', {
      merchantOrderId, status: e.response?.status, data: e.response?.data
    })
    const err = new Error(e.response?.data?.message || 'PhonePe payment initiation failed')
    err.status = 502
    err.code = 'PHONEPE_INIT_FAILED'
    throw err
  }
}

// ── Order status; returns the raw v2 status object (has .state) ──
exports.getOrderStatus = async (merchantOrderId) => {
  const token = await getAccessToken()
  const { data } = await axios.get(
    `${cfg.apiBaseUrl}${cfg.endpoints.orderStatus(merchantOrderId)}`,
    { headers: authHeader(token), timeout: 30000 }
  )
  return data
}

// ── Webhook auth: PhonePe sends Authorization = SHA256("username:password") ──
exports.verifyWebhook = (authorizationHeader) => {
  if (!authorizationHeader || !cfg.webhookUsername || !cfg.webhookPassword) return false
  const expected = crypto
    .createHash('sha256')
    .update(`${cfg.webhookUsername}:${cfg.webhookPassword}`)
    .digest('hex')
  const provided = authorizationHeader.replace(/^SHA256=?/i, '').trim().toLowerCase()
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
  } catch {
    return false
  }
}
