// Shiprocket tracking webhook → updates the order's fulfilment status.
// Set up in Shiprocket → Settings → API → Webhooks with this function's URL and the
// same token as the SHIPROCKET_WEBHOOK_TOKEN secret (sent by Shiprocket as "x-api-key").
//
// Status only ever moves forward. Return-to-origin (RTO) events are recorded but do not
// change the order: mark it "Returned" in the admin so the stock goes back.
import { adminClient, json } from '../_shared/orders.ts'
import { inBackground, notifyOrderEvent, STATUS_EVENT } from '../_shared/notify.ts'

const upper = (v: unknown) => String(v ?? '').toUpperCase().trim()

const RANK: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 1,
  PACKED: 2,
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
}

/** Shiprocket's free-text status → our fulfilment status (or null = record only). */
function mapStatus(raw: string): string | null {
  const s = upper(raw)
  if (!s || s.includes('RTO') || s.includes('RETURN') || s.includes('CANCEL') || s.includes('LOST') || s.includes('DAMAGE')) return null
  if (s.includes('UNDELIVERED')) return null
  if (s.includes('DELIVERED')) return 'DELIVERED'
  if (s.includes('OUT FOR DELIVERY')) return 'OUT_FOR_DELIVERY'
  if (
    s.includes('PICKED UP') ||
    s.includes('IN TRANSIT') ||
    s.includes('SHIPPED') ||
    s.includes('REACHED') ||
    s.includes('DESTINATION') ||
    s.includes('MISROUTED')
  ) {
    return 'SHIPPED'
  }
  return null
}

Deno.serve(async (req) => {
  // Shiprocket checks the URL with a request when you save it; always answer 200.
  if (req.method !== 'POST') return json({ ok: true })

  const expected = Deno.env.get('SHIPROCKET_WEBHOOK_TOKEN') ?? ''
  const given = req.headers.get('x-api-key') ?? ''
  const placeholder = /^(change[_ ]?me|placeholder)$/i.test(expected)
  if (!expected || placeholder || given !== expected) {
    console.warn('courier-webhook: bad or missing x-api-key')
    return json({ ok: false, error: 'unauthorised' }, 401)
  }

  try {
    const event = await req.json().catch(() => null)
    if (!event) return json({ ok: true })

    const db = adminClient()
    const awb = String(event.awb ?? event.awb_code ?? '').trim()
    const channelOrderId = String(event.order_id ?? event.channel_order_id ?? '').trim()
    const currentStatus = String(event.current_status ?? event.shipment_status ?? '').trim()

    let order: any = null
    if (channelOrderId) {
      const { data } = await db.from('orders').select('*').eq('id', channelOrderId).maybeSingle()
      order = data
    }
    if (!order && awb) {
      const { data } = await db.from('orders').select('*').eq('shiprocket->>awb', awb).maybeSingle()
      order = data
    }
    if (!order) {
      console.warn('courier-webhook: no order for', channelOrderId || awb)
      return json({ ok: true })
    }

    const now = new Date().toISOString()
    const shiprocket = {
      ...(order.shiprocket ?? {}),
      awb: awb || order.shiprocket?.awb || null,
      courier: event.courier_name || order.shiprocket?.courier || null,
      status: currentStatus || order.shiprocket?.status || null,
      etd: event.etd || order.shiprocket?.etd || null,
      tracking_url: awb ? `https://shiprocket.co/tracking/${awb}` : order.shiprocket?.tracking_url || null,
      updated_at: now,
    }
    const updates: Record<string, unknown> = { shiprocket, updated_at: now }

    const current = upper(order.order_status || order.orderStatus || 'PENDING')
    const next = mapStatus(currentStatus)
    const locked = ['CANCELLED', 'RETURNED'].includes(current)
    if (next && !locked && (RANK[next] ?? -1) > (RANK[current] ?? -1)) {
      updates.order_status = next
      updates.orderStatus = next
      // Cash collected by the courier.
      const isCod = upper(order.payment_method || order.paymentMethod) === 'COD'
      if (next === 'DELIVERED' && isCod && upper(order.payment_status) !== 'PAID') {
        updates.payment_status = 'PAID'
        updates.paymentStatus = 'PAID'
      }
    }

    const { error } = await db.from('orders').update(updates).eq('id', order.id)
    if (error) console.error('courier-webhook: update failed', error)
    // Tell the customer (shipped / out for delivery / delivered) — once per status.
    const moved = updates.order_status as string | undefined
    if (!error && moved && STATUS_EVENT[moved]) await inBackground(notifyOrderEvent(db, order.id, STATUS_EVENT[moved]))
    return json({ ok: true })
  } catch (err) {
    console.error('courier-webhook error', err)
    // 200 so Shiprocket doesn't keep retrying a payload we can't read.
    return json({ ok: true })
  }
})
