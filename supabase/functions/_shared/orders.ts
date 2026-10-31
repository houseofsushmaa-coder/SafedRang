// Shared order logic for Safed Rang edge functions.
// The database — never the browser — is the source of truth for price and stock.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_COD_FEE_INR = 39
const MAX_QTY_PER_LINE = 10
const MAX_LINES = 30

/** Errors whose message is safe to show to the shopper. */
export class UserError extends Error {}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

export const errorResponse = (err: unknown) => {
  if (err instanceof UserError) return json({ error: err.message }, 400)
  console.error(err)
  return json({ error: 'Something went wrong while placing your order. Please try again.' }, 500)
}

export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  })

/** COD rules from the admin-controlled `settings` table (Admin → Settings → Shipping). */
export async function getCodRules(db: SupabaseClient) {
  const { data } = await db.from('settings').select('key, value').eq('group', 'shipping').in('key', ['cod_charge', 'cod_enabled'])
  const byKey = new Map((data ?? []).map((r: any) => [r.key, typeof r.value === 'string' ? JSON.parse(r.value) : r.value]))
  const fee = Number(byKey.get('cod_charge')?.amount)
  return {
    enabled: byKey.get('cod_enabled')?.enabled !== false,
    fee: Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_COD_FEE_INR,
  }
}

export interface CartLineInput {
  productId: string
  quantity: number
  selectedSize?: string | null
}

export interface PricedLine {
  productId: string
  title: string
  sku: string
  quantity: number
  price: number
  selectedSize: string | null
  image: string | null
}

const isOut = (status: unknown) => {
  const s = String(status ?? '').toLowerCase()
  return s === 'out of stock' || s === 'sold out'
}

/** Re-prices the cart from the products table and validates availability. */
export async function priceCart(db: SupabaseClient, input: unknown) {
  if (!Array.isArray(input) || input.length === 0) throw new UserError('Your bag is empty.')
  if (input.length > MAX_LINES) throw new UserError('Too many items in one order.')

  // Merge duplicate product/size lines so stock is checked against the combined quantity.
  const merged = new Map<string, CartLineInput>()
  for (const raw of input as CartLineInput[]) {
    const productId = String(raw?.productId ?? '')
    const quantity = Number(raw?.quantity)
    const selectedSize = raw?.selectedSize ? String(raw.selectedSize) : null
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new UserError('Your bag contains an invalid item. Please refresh and try again.')
    }
    const key = `${productId}::${selectedSize ?? ''}`
    const prev = merged.get(key)
    merged.set(key, { productId, selectedSize, quantity: (prev?.quantity ?? 0) + quantity })
  }

  const ids = [...new Set([...merged.values()].map((l) => l.productId))]
  const { data: products, error } = await db
    .from('products')
    .select('id, name, sku, price, salePrice, stock, stock_status, status, is_archived, product_type, variations, image_url')
    .in('id', ids)
  if (error) throw error
  const byId = new Map((products ?? []).map((p: any) => [String(p.id), p]))

  const items: PricedLine[] = []
  for (const line of merged.values()) {
    const p: any = byId.get(line.productId)
    if (!p) throw new UserError('An item in your bag is no longer available. Please remove it and try again.')
    const name = p.name || 'This piece'
    if (p.is_archived || ['ARCHIVED', 'DRAFT'].includes(String(p.status).toUpperCase()) || isOut(p.stock_status)) {
      throw new UserError(`${name} is no longer available.`)
    }
    if (line.quantity > MAX_QTY_PER_LINE) throw new UserError(`Please contact us to order more than ${MAX_QTY_PER_LINE} of ${name}.`)

    const sale = Number(p.salePrice)
    let unit = sale > 0 ? sale : Number(p.price)
    let available = Number(p.stock ?? 0)

    const variations = Array.isArray(p.variations) ? p.variations : []
    if (p.product_type === 'variable' && variations.length > 0) {
      const v = variations.find((x: any) => String(x.size) === line.selectedSize)
      if (!v) throw new UserError(`Please choose a size for ${name}.`)
      unit += Number(v.priceModifier || 0)
      available = Number(v.stock ?? 0)
    }

    if (!(unit > 0)) throw new UserError(`${name} cannot be purchased online right now. Please contact us.`)
    if (available < line.quantity) {
      throw new UserError(
        available <= 0
          ? `${name}${line.selectedSize ? ` (${line.selectedSize})` : ''} has just sold out.`
          : `Only ${available} of ${name}${line.selectedSize ? ` (${line.selectedSize})` : ''} available.`,
      )
    }

    items.push({
      productId: String(p.id),
      title: name,
      sku: p.sku || '',
      quantity: line.quantity,
      price: Math.round(unit * 100) / 100,
      selectedSize: line.selectedSize ?? null,
      image: p.image_url || null,
    })
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100
  return { items, subtotal }
}

export interface CustomerInput {
  name: string
  email: string
  phone: string
  address: { address: string; apartment?: string; city: string; state: string; pincode: string; country: string; country_code?: string }
}

/** Validates and normalises shopper details; throws UserError with a readable message. */
export function validateCustomer(c: any): CustomerInput {
  const name = String(c?.name ?? '').trim()
  const email = String(c?.email ?? '').trim().toLowerCase()
  const phone = String(c?.phone ?? '').replace(/[^\d+]/g, '')
  const a = c?.address ?? {}
  const address = {
    address: String(a.address ?? '').trim(),
    apartment: String(a.apartment ?? '').trim(),
    city: String(a.city ?? '').trim(),
    state: String(a.state ?? '').trim(),
    pincode: String(a.pincode ?? '').trim(),
    country: String(a.country ?? '').trim() || 'India',
    country_code: String(a.country_code ?? '').trim() || undefined,
  }
  if (!name) throw new UserError('Please enter your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new UserError('Please enter a valid email address.')
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) throw new UserError('Please enter a valid phone number.')
  if (!address.address || !address.city || !address.state || !address.pincode) {
    throw new UserError('Please complete your shipping address.')
  }
  const isIndia = address.country_code === 'IN' || address.country.toLowerCase() === 'india'
  if (isIndia && !/^[1-9]\d{5}$/.test(address.pincode)) throw new UserError('Please enter a valid 6-digit PIN code.')
  return { name, email, phone, address }
}

/** Returns the signed-in user id from the request's JWT, or null for guests. */
export async function requestUserId(db: SupabaseClient, req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data } = await db.auth.getUser(token)
  return data?.user?.id ?? null
}

/**
 * Finds or creates a customer account for the checkout email.
 * Never throws — an order must not fail because account provisioning did.
 */
export async function provisionCustomer(db: SupabaseClient, email: string, fullName: string) {
  try {
    const { data: profile } = await db.from('profiles').select('id').ilike('email', email).maybeSingle()
    if (profile?.id) return { userId: profile.id as string, isNewUser: false }

    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, name: fullName, signup_source: 'checkout' },
      app_metadata: { role: 'customer' },
    })
    if (error) {
      console.warn('createUser failed (non-fatal):', error.message)
      return { userId: null, isNewUser: false }
    }
    return { userId: data.user?.id ?? null, isNewUser: true }
  } catch (err) {
    console.warn('provisionCustomer failed (non-fatal):', (err as Error).message)
    return { userId: null, isNewUser: false }
  }
}

/** Emails the customer a one-time sign-in link to their orders page. Non-fatal. */
export async function sendAccountLink(db: SupabaseClient, email: string, orderId: string) {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://safedrang.com'
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/account/orders?highlight=${encodeURIComponent(orderId)}` },
  })
  if (error) console.warn('Sign-in link email failed (non-fatal):', error.message)
}

/** Decrements stock for confirmed order lines. Call exactly once per order. */
export async function decrementStock(db: SupabaseClient, items: PricedLine[]) {
  for (const item of items ?? []) {
    try {
      const { data: p } = await db
        .from('products')
        .select('id, stock, product_type, variations')
        .eq('id', item.productId)
        .maybeSingle()
      if (!p) continue
      const qty = Number(item.quantity) || 0
      const variations = Array.isArray(p.variations) ? p.variations : []
      if (p.product_type === 'variable' && variations.length > 0 && item.selectedSize) {
        const next = variations.map((v: any) =>
          String(v.size) === item.selectedSize ? { ...v, stock: Math.max(0, Number(v.stock || 0) - qty) } : v,
        )
        const total = next.reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0)
        await db.from('products').update({ variations: next, stock: total }).eq('id', p.id)
      } else {
        const remaining = Math.max(0, Number(p.stock || 0) - qty)
        const patch: Record<string, unknown> = { stock: remaining }
        if (remaining === 0) patch.stock_status = 'Out of Stock'
        await db.from('products').update(patch).eq('id', p.id)
      }
    } catch (err) {
      console.error(`Stock decrement failed for ${item.productId}:`, (err as Error).message)
    }
  }
}

/**
 * Marks an online order PAID if Cashfree confirms full payment.
 * Idempotent: stock is decremented only by the call that performs the transition.
 */
export async function confirmPaidOrder(db: SupabaseClient, orderId: string, paidAmount: number) {
  const { data: order } = await db.from('orders').select('id, total, items, payment_status').eq('id', orderId).maybeSingle()
  if (!order) return { status: 'NOT_FOUND' as const, order: null, transitioned: false }
  if (order.payment_status === 'PAID') return { status: 'PAID' as const, order, transitioned: false }

  if (Math.abs(Number(order.total) - Number(paidAmount)) > 0.01) {
    console.error(`Amount mismatch on ${orderId}: expected ${order.total}, paid ${paidAmount}`)
    await db.from('orders').update({ payment_status: 'AMOUNT_MISMATCH', paymentStatus: 'AMOUNT_MISMATCH', updated_at: new Date().toISOString() }).eq('id', orderId)
    return { status: 'AMOUNT_MISMATCH' as const, order, transitioned: false }
  }

  const { data: updated } = await db
    .from('orders')
    .update({ payment_status: 'PAID', paymentStatus: 'PAID', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .neq('payment_status', 'PAID')
    .select('id')
  const transitioned = Boolean(updated && updated.length > 0)
  if (transitioned) await decrementStock(db, order.items as PricedLine[])
  return { status: 'PAID' as const, order, transitioned }
}

export const cashfreeBase = () =>
  (Deno.env.get('VITE_CASHFREE_ENV') || 'SANDBOX') === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'

export const cashfreeHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-api-version': '2022-09-01',
  'x-client-id': Deno.env.get('VITE_CASHFREE_APP_ID') ?? '',
  'x-client-secret': Deno.env.get('CASHFREE_SECRET_KEY') ?? '',
})
