import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { adminClient, confirmPaidOrder, json, sendAccountLink } from "../_shared/orders.ts"

// Cashfree signs webhooks as base64(HMAC-SHA256(timestamp + rawBody, clientSecret)).
async function isValidSignature(rawBody: string, timestamp: string, signature: string) {
  const secret = Deno.env.get('CASHFREE_SECRET_KEY') ?? ''
  if (!secret) return false
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + rawBody))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const signature = req.headers.get('x-webhook-signature') ?? ''
    const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
    const rawBody = await req.text()

    if (!signature || !timestamp || !(await isValidSignature(rawBody, timestamp, signature))) {
      console.warn('Rejected webhook with missing/invalid signature')
      return json({ error: 'Invalid signature' }, 401)
    }

    const payload = JSON.parse(rawBody)
    const orderId = payload?.data?.order?.order_id
    const paymentStatus = payload?.data?.payment?.payment_status
    const paidAmount = Number(payload?.data?.payment?.payment_amount ?? payload?.data?.order?.order_amount)

    if (orderId && paymentStatus === 'SUCCESS') {
      const db = adminClient()
      const result = await confirmPaidOrder(db, orderId, paidAmount)
      if (result.transitioned) {
        const { data: row } = await db.from('orders').select('customer_email').eq('id', orderId).maybeSingle()
        if (row?.customer_email) await sendAccountLink(db, row.customer_email, orderId)
      }
    }

    return json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return json({ error: 'Webhook processing failed' }, 500)
  }
})
