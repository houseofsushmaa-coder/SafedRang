// Admin-only: sends a Safed Rang order to Shiprocket.
// (Named "courier-…" because Shiprocket refuses webhook/API URLs containing "shiprocket" or "sr".)
//
// POST { action: "check" }                       → is Shiprocket configured and can we log in?
// POST { action: "preview", orderId }            → suggested weight / box for the order
// POST { action: "create", orderId, weight, length, breadth, height }
import { adminClient, corsHeaders, json } from '../_shared/orders.ts'
import {
  ShiprocketError,
  defaultBox,
  defaultWeightKg,
  istDate,
  shiprocketConfig,
  shiprocketLogin,
  shiprocketRequest,
  tenDigitPhone,
} from '../_shared/shiprocket.ts'

const upper = (v: unknown) => String(v ?? '').toUpperCase()

async function requireAdmin(db: ReturnType<typeof adminClient>, req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return false
  const { data } = await db.auth.getUser(token)
  const userId = data?.user?.id
  if (!userId) return false
  const { data: profile } = await db.from('profiles').select('role').eq('id', userId).maybeSingle()
  return ['admin', 'super_admin', 'manager'].includes(String(profile?.role ?? ''))
}

async function suggestParcel(db: ReturnType<typeof adminClient>, items: any[]) {
  const ids = items.map((i) => i.productId).filter(Boolean)
  const { data: products } = ids.length
    ? await db.from('products').select('id, weight, category_name, sku, hsnCode').in('id', ids)
    : { data: [] as any[] }
  const byId = new Map((products ?? []).map((p: any) => [p.id, p]))
  let weight = 0
  for (const item of items) {
    const p: any = byId.get(item.productId)
    const each = Number(p?.weight) > 0 ? Number(p.weight) : defaultWeightKg(p?.category_name)
    weight += each * Math.max(1, Number(item.quantity) || 1)
  }
  weight = Math.max(0.1, Math.round(weight * 100) / 100)
  return { weight, ...defaultBox(weight), byId }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const db = adminClient()
  try {
    if (!(await requireAdmin(db, req))) return json({ error: 'Admins only.' }, 403)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')

    if (action === 'check') {
      const cfg = shiprocketConfig()
      if (cfg.missing.length) return json({ ok: false, pickup: cfg.pickup, error: `Missing: ${cfg.missing.join(', ')}` })
      await shiprocketLogin()
      return json({ ok: true, pickup: cfg.pickup })
    }

    const orderId = String(body.orderId ?? '')
    if (!orderId) return json({ error: 'orderId is required.' }, 400)
    const { data: order, error: readError } = await db.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (readError) throw readError
    if (!order) return json({ error: 'Order not found.' }, 404)

    const items: any[] = Array.isArray(order.items) ? order.items : []
    const parcel = await suggestParcel(db, items)

    if (action === 'preview') {
      const { byId: _ignored, ...suggestion } = parcel
      return json({ suggestion, shiprocket: order.shiprocket ?? null })
    }

    if (action !== 'create') return json({ error: 'Unknown action.' }, 400)

    // ── Guards: never ship something that shouldn't go out ──
    const status = upper(order.order_status || order.orderStatus)
    const payStatus = upper(order.payment_status || order.paymentStatus)
    const isCod = upper(order.payment_method || order.paymentMethod) === 'COD'
    if (['CANCELLED', 'RETURNED'].includes(status)) return json({ error: 'This order is cancelled or returned.' }, 400)
    if (!isCod && payStatus !== 'PAID') return json({ error: 'This online order is not paid yet, so it cannot be shipped.' }, 400)
    if (order.shiprocket?.shiprocket_order_id) {
      return json({ error: `Already in Shiprocket (order ${order.shiprocket.shiprocket_order_id}).` }, 409)
    }
    if (!items.length) return json({ error: 'This order has no items recorded.' }, 400)

    const addr = order.shipping_address || order.shippingAddress || {}
    const phone = tenDigitPhone(addr.phone || order.customer_phone)
    if (phone.length !== 10) return json({ error: 'The customer phone number is not a valid 10-digit number.' }, 400)
    if (!/^[1-9]\d{5}$/.test(String(addr.pincode ?? ''))) return json({ error: 'The shipping PIN code is not valid.' }, 400)

    const name = String(addr.name || order.customer_name || 'Customer').trim()
    const [firstName, ...rest] = name.split(/\s+/)
    const num = (v: unknown, fallback: number) => (Number(v) > 0 ? Number(v) : fallback)
    const weight = num(body.weight, parcel.weight)
    const length = num(body.length, parcel.length)
    const breadth = num(body.breadth, parcel.breadth)
    const height = num(body.height, parcel.height)

    const subTotal = items.reduce((s, i) => s + Number(i.price || 0) * Math.max(1, Number(i.quantity) || 1), 0)
    const shippingCharges = Number(order.shipping_charge ?? order.shippingCharge ?? 0) || 0

    const { pickup } = shiprocketConfig()
    const payload = {
      order_id: order.id,
      order_date: istDate(order.created_at || order.createdAt),
      pickup_location: pickup,
      channel_id: '',
      comment: 'Safed Rang — handcrafted in Lucknow',
      billing_customer_name: firstName,
      billing_last_name: rest.join(' ') || '.',
      billing_address: String(addr.address || '').slice(0, 190),
      billing_address_2: String(addr.apartment || '').slice(0, 190),
      billing_city: addr.city,
      billing_pincode: String(addr.pincode),
      billing_state: addr.state,
      billing_country: addr.country || 'India',
      billing_email: addr.email || order.customer_email || '',
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items.map((i) => {
        const p: any = parcel.byId.get(i.productId)
        return {
          name: String(i.title || i.name || 'Handcrafted piece').slice(0, 190) + (i.selectedSize ? ` (${i.selectedSize})` : ''),
          sku: String(i.sku || p?.sku || i.productId || 'SR-ITEM').slice(0, 50),
          units: Math.max(1, Number(i.quantity) || 1),
          selling_price: Number(i.price || 0),
          discount: 0,
          tax: 0,
          hsn: p?.hsnCode || '',
        }
      }),
      payment_method: isCod && payStatus !== 'PAID' ? 'COD' : 'Prepaid',
      shipping_charges: shippingCharges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: subTotal,
      length,
      breadth,
      height,
      weight,
    }

    const token = await shiprocketLogin()
    const created = await shiprocketRequest(token, '/orders/create/adhoc', payload)

    const shiprocket = {
      shiprocket_order_id: created.order_id ?? null,
      shipment_id: created.shipment_id ?? null,
      awb: created.awb_code || null,
      courier: created.courier_name || null,
      status: created.status || 'NEW',
      pickup_location: pickup,
      weight,
      box: `${length}x${breadth}x${height}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updates: Record<string, unknown> = { shiprocket, updated_at: new Date().toISOString() }
    if (['PENDING', 'CONFIRMED', 'PROCESSING'].includes(status)) {
      updates.order_status = 'PACKED'
      updates.orderStatus = 'PACKED'
    }
    const { error: saveError } = await db.from('orders').update(updates).eq('id', order.id)
    if (saveError) console.error('Saved in Shiprocket but could not update the order:', saveError)

    return json({ ok: true, shiprocket })
  } catch (err) {
    if (err instanceof ShiprocketError) return json({ error: err.message }, 502)
    console.error(err)
    return json({ error: 'Could not reach Shiprocket. Please try again.' }, 500)
  }
})
