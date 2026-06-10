module.exports = {
  merchantId: process.env.PHONEPE_MERCHANT_ID,
  saltKey: process.env.PHONEPE_SALT_KEY,
  saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
  baseUrl: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  endpoints: {
    pay: '/pg/v1/pay',
    status: (merchantId, txnId) => `/pg/v1/status/${merchantId}/${txnId}`
  }
}
