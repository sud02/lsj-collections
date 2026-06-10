const crypto = require('crypto')
const axios = require('axios')
const cfg = require('../config/phonepe')
const logger = require('../utils/logger')

function buildChecksum(base64Payload, endpoint) {
  const hash = crypto
    .createHash('sha256')
    .update(base64Payload + endpoint + cfg.saltKey)
    .digest('hex')
  return `${hash}###${cfg.saltIndex}`
}

exports.buildChecksum = buildChecksum

exports.initiatePayment = async ({ order, mobile }) => {
  const merchantTransactionId = `LSJ_${order.id}_${Date.now()}`
  const amount = Math.round(Number(order.grandtotal) * 100)

  const payload = {
    merchantId: cfg.merchantId,
    merchantTransactionId,
    merchantUserId: `USER_${order.user_id}`,
    amount,
    redirectUrl: `${process.env.FRONTEND_URL}/order-success/${order.id}`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${process.env.API_URL}/api/payment/callback`,
    mobileNumber: mobile,
    paymentInstrument: { type: 'PAY_PAGE' }
  }

  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64')
  const checksum = buildChecksum(base64, cfg.endpoints.pay)

  logger.info('PhonePe payment initiated', {
    order_id: order.id,
    transaction_id: merchantTransactionId,
    amount
  })

  const { data } = await axios.post(
    `${cfg.baseUrl}${cfg.endpoints.pay}`,
    { request: base64 },
    {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'X-VERIFY': checksum
      },
      timeout: 30000
    }
  )

  if (!data?.success) {
    const err = new Error(data?.message || 'PhonePe initiation failed')
    err.status = 502
    err.code = 'PHONEPE_INIT_FAILED'
    throw err
  }

  return {
    transactionId: merchantTransactionId,
    redirectUrl: data.data.instrumentResponse.redirectInfo.url,
    raw: data
  }
}

exports.verifyCallback = (requestB64, xVerifyHeader) => {
  if (!requestB64 || !xVerifyHeader) return false
  const expected =
    crypto.createHash('sha256').update(requestB64 + cfg.saltKey).digest('hex') +
    `###${cfg.saltIndex}`
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(xVerifyHeader))
}

exports.checkStatus = async (merchantTransactionId) => {
  const endpoint = cfg.endpoints.status(cfg.merchantId, merchantTransactionId)
  const checksum =
    crypto.createHash('sha256').update(endpoint + cfg.saltKey).digest('hex') +
    `###${cfg.saltIndex}`

  const { data } = await axios.get(`${cfg.baseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': cfg.merchantId
    },
    timeout: 30000
  })

  return data
}
