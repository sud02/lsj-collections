// PhonePe Standard Checkout v2 (OAuth-based).
// Set PHONEPE_ENV=production to use live hosts; defaults to sandbox/UAT.
const ENV = (process.env.PHONEPE_ENV || 'sandbox').toLowerCase()
const isProd = ENV === 'production' || ENV === 'prod' || ENV === 'live'

module.exports = {
  env: isProd ? 'production' : 'sandbox',

  clientId: process.env.PHONEPE_CLIENT_ID,
  clientSecret: process.env.PHONEPE_CLIENT_SECRET,
  clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
  merchantId: process.env.PHONEPE_MERCHANT_ID,

  // You choose these; the same pair is set on the PhonePe dashboard webhook.
  webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME,
  webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD,

  // In prod the OAuth token comes from identity-manager, other APIs from /pg.
  // In sandbox everything lives under the single pg-sandbox host.
  authBaseUrl: isProd
    ? 'https://api.phonepe.com/apis/identity-manager'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  apiBaseUrl: isProd
    ? 'https://api.phonepe.com/apis/pg'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox',

  endpoints: {
    token: '/v1/oauth/token',
    pay: '/checkout/v2/pay',
    orderStatus: (merchantOrderId) => `/checkout/v2/order/${merchantOrderId}/status`,
    refund: '/payments/v2/refund'
  }
}
