const { z } = require('zod')
const db = require('../config/db')
const phonepe = require('../services/phonepe.service')
const email = require('../services/email.service')
const logger = require('../utils/logger')
const { ok, notFound, fail, badRequest } = require('../utils/response')

exports.initiateSchema = z.object({
  order_id: z.number().int().positive()
})

exports.initiate = async (req, res) => {
  const { order_id } = req.body
  const userId = String(req.user.id)

  const [rows] = await db.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [order_id, userId]
  )
  if (!rows.length) return notFound(res, 'Order not found')

  const order = rows[0]

  if (order.payment_status === 'paid') {
    return badRequest(res, 'Order already paid', 'ALREADY_PAID')
  }

  const { transactionId, redirectUrl } = await phonepe.initiatePayment({
    order: { ...order, grandtotal: parseFloat(order.grandtotal) || 0 },
    mobile: order.billing_mobile
  })

  await db.query(
    `UPDATE orders SET payment_reference = ?, payment_status = 'pending' WHERE id = ?`,
    [transactionId, order.id]
  )

  return ok(res, { transaction_id: transactionId, redirect_url: redirectUrl })
}

exports.callback = async (req, res) => {
  const xVerify = req.headers['x-verify']
  const requestB64 = req.body?.response

  if (!requestB64 || !xVerify) {
    logger.warn('PhonePe callback missing data')
    return fail(res, 400, 'Invalid callback payload', 'INVALID_PAYLOAD')
  }

  if (!phonepe.verifyCallback(requestB64, xVerify)) {
    logger.warn('PhonePe callback signature mismatch')
    return fail(res, 400, 'Invalid signature', 'INVALID_SIGNATURE')
  }

  let decoded
  try {
    decoded = JSON.parse(Buffer.from(requestB64, 'base64').toString('utf8'))
  } catch (err) {
    return fail(res, 400, 'Invalid callback body', 'DECODE_FAILED')
  }

  const transactionId = decoded?.data?.merchantTransactionId
  const code = decoded?.code
  const state = decoded?.data?.state

  logger.info('PhonePe callback received', { transactionId, code, state })

  if (!transactionId) return fail(res, 400, 'Missing transaction ID', 'NO_TXN_ID')

  const [orders] = await db.query(
    'SELECT * FROM orders WHERE payment_reference = ? LIMIT 1',
    [transactionId]
  )
  if (!orders.length) return notFound(res, 'Order not found')

  const order = orders[0]
  const isSuccess = code === 'PAYMENT_SUCCESS' || state === 'COMPLETED'

  const newPaymentStatus = isSuccess ? 'paid' : 'failed'
  const newOrderStatus = isSuccess ? 'confirmed' : 'pending'

  await db.query(
    `UPDATE orders
     SET payment_status = ?, order_status = ?, payment_mode = 'phonepe',
         payment_amount = ?, payment_id = ?, payment_date = NOW()
     WHERE id = ?`,
    [
      newPaymentStatus,
      newOrderStatus,
      parseFloat(order.grandtotal) || 0,
      decoded?.data?.transactionId || transactionId,
      order.id
    ]
  )

  if (isSuccess) {
    await db.query('DELETE FROM cart WHERE user_id = ?', [String(order.user_id)])

    try {
      const [items] = await db.query(
        `SELECT * FROM order_products WHERE order_id = ?`,
        [order.order_id]
      )
      await email.sendOrderConfirmation({
        order: {
          ...order,
          billing_name: order.billing_fullname,
          shipping_name: order.shipping_fullname,
          payment_status: newPaymentStatus,
          order_status: newOrderStatus
        },
        items
      })
    } catch (err) {
      logger.error('Order confirmation email failed', { order_id: order.id, message: err.message })
    }
  }

  return ok(res, { success: isSuccess, order_id: order.id, status: newPaymentStatus })
}

exports.checkStatus = async (req, res) => {
  const { txnId } = req.params
  if (!txnId) return badRequest(res, 'Missing transaction ID')

  const data = await phonepe.checkStatus(txnId)

  const [orders] = await db.query(
    'SELECT id, payment_status, order_status FROM orders WHERE payment_reference = ?',
    [txnId]
  )

  return ok(res, { phonepe: data, order: orders[0] || null })
}
