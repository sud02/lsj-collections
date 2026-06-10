const { Resend } = require('resend')
const logger = require('../utils/logger')

const apiKey = process.env.RESEND_API_KEY
const FROM = `${process.env.MAIL_FROM_NAME || 'LSJ Collections'} <${process.env.MAIL_FROM || 'orders@lsjcollections.com'}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@lsjcollections.com'

let resend = null
if (apiKey && apiKey.startsWith('re_')) {
  resend = new Resend(apiKey)
} else {
  logger.warn('Resend API key not configured — emails will be skipped')
}

const send = async ({ to, subject, html, replyTo }) => {
  if (!resend) {
    logger.warn('Email skipped (Resend not configured)', { to, subject })
    return { skipped: true }
  }
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      reply_to: replyTo
    })
    logger.info('Email sent', { to, subject, id: result?.data?.id })
    return result
  } catch (err) {
    logger.error('Email send failed', { to, subject, message: err.message })
    return { error: err.message }
  }
}

const escape = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

exports.sendOrderConfirmation = async ({ order, items }) => {
  if (!order?.billing_email) return { skipped: true, reason: 'no email' }

  const itemsRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escape(i.product_name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number(i.product_price).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number(i.product_actual_price).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  const html = `
  <!DOCTYPE html>
  <html><body style="font-family:Arial,sans-serif;background:#fafafa;padding:24px;color:#222;">
    <div style="max-width:640px;margin:auto;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      <div style="background:#8B0000;color:#fff;padding:20px 24px;">
        <h1 style="margin:0;font-size:22px;">Order #${order.id} confirmed</h1>
        <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Thank you for shopping with LSJ Collections</p>
      </div>
      <div style="padding:24px;">
        <p>Hi ${escape(order.billing_name)},</p>
        <p>We've received your order. Here's a summary:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f7f1e8;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Price</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <table style="width:100%;margin-top:8px;font-size:14px;">
          <tr><td>Subtotal</td><td style="text-align:right;">₹${Number(order.subtotal).toFixed(2)}</td></tr>
          <tr><td>GST (18%)</td><td style="text-align:right;">₹${Number(order.gst).toFixed(2)}</td></tr>
          ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right;">- ₹${Number(order.discount).toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight:bold;font-size:16px;border-top:2px solid #222;">
            <td style="padding-top:8px;">Grand total</td>
            <td style="text-align:right;padding-top:8px;">₹${Number(order.grandtotal).toFixed(2)}</td>
          </tr>
        </table>
        <h3 style="margin-top:24px;">Shipping address</h3>
        <p style="margin:0;line-height:1.5;">
          ${escape(order.shipping_name || order.billing_name)}<br>
          ${escape(order.shipping_address1 || order.billing_address1)}<br>
          ${order.shipping_address2 || order.billing_address2 ? `${escape(order.shipping_address2 || order.billing_address2)}<br>` : ''}
          ${escape(order.shipping_city || order.billing_city)}, ${escape(order.shipping_state || order.billing_state)} - ${escape(order.shipping_pincode || order.billing_pincode)}<br>
          Mobile: ${escape(order.shipping_mobile || order.billing_mobile)}
        </p>
        <p style="margin-top:24px;color:#666;font-size:13px;">
          Questions? Reply to this email or contact us at ${escape(ADMIN_EMAIL)}.
        </p>
      </div>
      <div style="background:#f7f1e8;padding:14px;text-align:center;font-size:12px;color:#666;">
        © ${new Date().getFullYear()} LSJ Collections, Tirupati
      </div>
    </div>
  </body></html>`

  return send({
    to: order.billing_email,
    subject: `Order #${order.id} confirmed — LSJ Collections`,
    html
  })
}

exports.sendContactNotification = async ({ name, email, subject, message }) => {
  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${escape(name)}</p>
    <p><strong>Email:</strong> ${escape(email)}</p>
    <p><strong>Subject:</strong> ${escape(subject)}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;">${escape(message)}</p>`

  return send({
    to: ADMIN_EMAIL,
    subject: `New contact: ${subject}`,
    html,
    replyTo: email
  })
}

exports.sendSubscriberNotification = async ({ email }) => {
  return send({
    to: ADMIN_EMAIL,
    subject: 'New newsletter subscriber',
    html: `<p>New subscriber: <strong>${escape(email)}</strong></p>`
  })
}
