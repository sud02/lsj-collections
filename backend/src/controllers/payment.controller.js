const { z } = require('zod')
const db = require('../config/db')
const phonepe = require('../services/phonepe.service')
const email = require('../services/email.service')
const logger = require('../utils/logger')
const { ok, notFound, fail, badRequest } = require('../utils/response')

exports.initiateSchema = z.object({
  order_id: z.number().int().positive()
})

// Applies a resolved payment state to an order exactly once (idempotent):
// updates status, and on first success clears the cart + emails the customer.
async function finalizeOrder(order, isSuccess, phonepeTxnId) {
  if (order.payment_status === 'paid') return // already processed

  const newPaymentStatus = isSuccess ? 'paid' : 'failed'
  const newOrderStatus = isSuccess ? 'confirmed' : 'pending'

  await db.query(
    `UPDATE orders
       SET payment_status = ?, order_status = ?, payment_mode = 'phonepe',
           payment_amount = ?, payment_id = ?, payment_date = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [newPaymentStatus, newOrderStatus, parseFloat(order.grandtotal) || 0, phonepeTxnId || null, order.id]
  )

  if (isSuccess) {
    await db.query('DELETE FROM cart WHERE user_id = ?', [String(order.user_id)])
    try {
      const [items] = await db.query('SELECT * FROM order_products WHERE order_id = ?', [order.order_id])
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
  return newPaymentStatus
}

// POST /payment/initiate — create a PhonePe checkout and return its URL.
exports.initiate = async (req, res) => {
  const { order_id } = req.body
  const userId = String(req.user.id)

  const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [order_id, userId])
  if (!rows.length) return notFound(res, 'Order not found')
  const order = rows[0]

  if (order.payment_status === 'paid') return badRequest(res, 'Order already paid', 'ALREADY_PAID')

  const amountPaise = Math.round((parseFloat(order.grandtotal) || 0) * 100)
  if (amountPaise <= 0) return badRequest(res, 'Invalid order amount', 'BAD_AMOUNT')

  // Unique per attempt so a retry never collides with a used merchantOrderId.
  const merchantOrderId = `LSJ-${order.id}-${Date.now()}`
  const redirectUrl = `${process.env.FRONTEND_URL}/order-success/${order.id}`

  const data = await phonepe.createPayment({ merchantOrderId, amountPaise, redirectUrl })

  await db.query(
    `UPDATE orders SET payment_reference = ?, payment_status = 'pending', updated_at = NOW() WHERE id = ?`,
    [merchantOrderId, order.id]
  )

  return ok(res, { merchant_order_id: merchantOrderId, redirect_url: data.redirectUrl })
}

// POST /payment/callback — PhonePe server-to-server webhook (v2).
exports.callback = async (req, res) => {
  if (!phonepe.verifyWebhook(req.headers.authorization)) {
    logger.warn('PhonePe webhook auth failed')
    return fail(res, 401, 'Invalid webhook signature', 'INVALID_SIGNATURE')
  }

  const payload = req.body?.payload || req.body || {}
  const merchantOrderId = payload.merchantOrderId || payload.merchantTransactionId
  const state = payload.state || payload.status
  const phonepeTxnId = payload.orderId || payload.transactionId || null

  logger.info('PhonePe webhook received', { event: req.body?.event || req.body?.type, merchantOrderId, state })

  if (!merchantOrderId) return badRequest(res, 'Missing merchantOrderId', 'NO_ORDER_ID')

  const [orders] = await db.query('SELECT * FROM orders WHERE payment_reference = ? LIMIT 1', [merchantOrderId])
  if (!orders.length) {
    logger.warn('PhonePe webhook: order not found', { merchantOrderId })
    return ok(res, { received: true }) // 200 so PhonePe doesn't retry forever
  }

  const isSuccess = String(state).toUpperCase() === 'COMPLETED'
  await finalizeOrder(orders[0], isSuccess, phonepeTxnId)

  return ok(res, { received: true })
}

// GET /payment/status/:orderId — reconcile with PhonePe (fallback for the
// redirect page in case the webhook is delayed) and return the current state.
exports.checkStatus = async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10)
  if (!orderId) return badRequest(res, 'Missing order id')

  const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, String(req.user.id)])
  if (!rows.length) return notFound(res, 'Order not found')
  let order = rows[0]

  // If not yet resolved, ask PhonePe directly and reconcile.
  if (order.payment_status !== 'paid' && order.payment_reference) {
    try {
      const data = await phonepe.getOrderStatus(order.payment_reference)
      const state = String(data.state || '').toUpperCase()
      if (state === 'COMPLETED' || state === 'FAILED') {
        await finalizeOrder(order, state === 'COMPLETED', data.orderId || null)
        const [fresh] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId])
        order = fresh[0]
      }
    } catch (err) {
      logger.warn('PhonePe status check failed', { orderId, message: err.message })
    }
  }

  return ok(res, {
    order_id: order.id,
    payment_status: order.payment_status,
    order_status: order.order_status
  })
}
