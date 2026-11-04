// Order emails: who gets what, when — and sending them.
//
// Provider (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY                       → sends through resend.com (recommended), or
//   SMTP_HOST, SMTP_USER, SMTP_PASS [, SMTP_PORT=465] → sends through your own mailbox (e.g. Hostinger)
// Everything else (admin addresses, sender, which emails are on) is set in Admin → Settings → Emails.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { adminEmail, customerEmail, EmailOrder, OrderEvent, RenderedEmail, StoreInfo } from './emailTemplates.ts'

export type { OrderEvent }

export interface EmailConfig {
  adminEmails: string[]
  fromName: string
  fromEmail: string
  replyTo: string
  events: Record<OrderEvent, { customer: boolean; admin: boolean }>
}

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  adminEmails: [],
  fromName: 'Safed Rang',
  fromEmail: '',
  replyTo: '',
  events: {
    order_placed: { customer: true, admin: true },
    shipped: { customer: true, admin: false },
    out_for_delivery: { customer: true, admin: false },
    delivered: { customer: true, admin: false },
    cancelled: { customer: true, admin: true },
    returned: { customer: true, admin: true },
  },
}

/** Fulfilment status → the email it triggers. */
export const STATUS_EVENT: Record<string, OrderEvent> = {
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

const isEmail = (s: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s ?? '').trim())
const parse = (v: unknown) => {
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

export function providerStatus() {
  const resend = Deno.env.get('RESEND_API_KEY') ?? ''
  if (resend && !/^(change[_ ]?me|placeholder)$/i.test(resend)) return { provider: 'resend' as const, ready: true }
  if (Deno.env.get('SMTP_HOST') && Deno.env.get('SMTP_USER') && Deno.env.get('SMTP_PASS')) return { provider: 'smtp' as const, ready: true }
  return { provider: null, ready: false }
}

export async function loadEmailSetup(db: SupabaseClient) {
  const { data } = await db.from('settings').select('group, key, value').in('group', ['email', 'general'])
  const raw = new Map((data ?? []).map((r: any) => [`${r.group}.${r.key}`, parse(r.value)]))
  const text = (k: string) => {
    const v: any = raw.get(k)
    return String((v && typeof v === 'object' ? v.text : v) ?? '').trim()
  }
  const saved: any = raw.get('email.config') ?? {}
  const config: EmailConfig = {
    ...DEFAULT_EMAIL_CONFIG,
    ...saved,
    adminEmails: (Array.isArray(saved.adminEmails) ? saved.adminEmails : []).filter(isEmail),
    events: Object.fromEntries(
      Object.entries(DEFAULT_EMAIL_CONFIG.events).map(([k, d]) => [k, { ...d, ...(saved.events?.[k] ?? {}) }])
    ) as EmailConfig['events'],
  }
  const store: StoreInfo = {
    name: text('general.site_name') || 'Safed Rang',
    siteUrl: (Deno.env.get('SITE_URL') || 'https://safedrang.com').replace(/\/$/, ''),
    supportEmail: text('general.store_email'),
    supportPhone: text('general.store_phone'),
  }
  if (!config.adminEmails.length && isEmail(store.supportEmail)) config.adminEmails = [store.supportEmail]
  return { config, store }
}

function sender(config: EmailConfig, store: StoreInfo) {
  const fromEmail = config.fromEmail || Deno.env.get('EMAIL_FROM') || Deno.env.get('SMTP_USER') || 'orders@safedrang.com'
  const fromName = (config.fromName || store.name || 'Safed Rang').replace(/[<>"]/g, '')
  const replyTo = isEmail(config.replyTo) ? config.replyTo : isEmail(store.supportEmail) ? store.supportEmail : undefined
  return { from: `${fromName} <${fromEmail}>`, replyTo }
}

/** Sends one email. Throws with a readable message on failure. */
export async function sendEmail(to: string[], mail: RenderedEmail, config: EmailConfig, store: StoreInfo) {
  const { provider } = providerStatus()
  const { from, replyTo } = sender(config, store)
  if (provider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: mail.subject, html: mail.html, text: mail.text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(`Resend: ${body?.message || res.statusText}`)
    }
    return
  }
  if (provider === 'smtp') {
    const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')
    const port = Number(Deno.env.get('SMTP_PORT') || 465)
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST')!,
        port,
        tls: port === 465,
        auth: { username: Deno.env.get('SMTP_USER')!, password: Deno.env.get('SMTP_PASS')! },
      },
    })
    try {
      await client.send({ from, to, replyTo, subject: mail.subject, content: mail.text, html: mail.html })
    } finally {
      await client.close().catch(() => {})
    }
    return
  }
  throw new Error('Email is not set up yet — add RESEND_API_KEY (or SMTP_*) in Supabase → Edge Functions → Secrets.')
}

const upper = (v: unknown) => String(v ?? '').toUpperCase()

export function toEmailOrder(order: any): EmailOrder {
  const a = order.shipping_address || order.shippingAddress || {}
  const items = (Array.isArray(order.items) ? order.items : []).map((i: any) => ({
    title: String(i.title || i.name || 'Handcrafted piece'),
    quantity: Math.max(1, Number(i.quantity) || 1),
    price: Number(i.price) || 0,
    image: i.image || i.images?.[0] || null,
    selectedSize: i.selectedSize || null,
  }))
  const subtotal = Number(order.subtotal) || items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
  const shipping = Number(order.shipping_charge ?? order.shippingCharge ?? 0) || 0
  return {
    id: order.id,
    createdAt: order.created_at || order.createdAt,
    customerName: order.customer_name || a.name || '',
    customerEmail: order.customer_email || a.email || '',
    customerPhone: order.customer_phone || a.phone || '',
    address: a,
    items,
    subtotal,
    shipping,
    total: Number(order.total ?? order.total_amount) || subtotal + shipping,
    isCod: upper(order.payment_method || order.paymentMethod) === 'COD',
    isPaid: upper(order.payment_status || order.paymentStatus) === 'PAID',
    courier: order.shiprocket?.courier ?? null,
    awb: order.shiprocket?.awb ?? null,
    trackingUrl: order.shiprocket?.tracking_url ?? null,
  }
}

/** Lets the response go back right away while the email finishes sending. */
export function inBackground(task: Promise<unknown>) {
  const rt = (globalThis as any).EdgeRuntime
  if (rt?.waitUntil) {
    rt.waitUntil(task)
    return Promise.resolve()
  }
  return task.then(() => undefined)
}

type Outcome ='sent' | 'already_sent' | 'off' | 'no_recipient' | `error: ${string}`

/**
 * Sends the customer and/or admin email for an order event. Never throws —
 * an email problem must not break checkout or a status change.
 * Each (audience, event) is sent once per order; pass force to resend.
 */
export async function notifyOrderEvent(
  db: SupabaseClient,
  orderId: string,
  event: OrderEvent,
  opts: { force?: boolean; only?: 'customer' | 'admin' } = {}
): Promise<{ customer: Outcome; admin: Outcome }> {
  const result: { customer: Outcome; admin: Outcome } = { customer: 'off', admin: 'off' }
  try {
    const { data: order } = await db.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (!order) return { customer: 'error: order not found', admin: 'error: order not found' }
    const { config, store } = await loadEmailSetup(db)
    const toggles = config.events[event] ?? { customer: false, admin: false }
    const log: Record<string, string> = { ...(order.email_log ?? {}) }
    const o = toEmailOrder(order)

    const jobs: { who: 'customer' | 'admin'; to: string[]; mail: () => RenderedEmail }[] = []
    if (toggles.customer && opts.only !== 'admin') {
      jobs.push({ who: 'customer', to: isEmail(o.customerEmail) ? [o.customerEmail] : [], mail: () => customerEmail(event, o, store) })
    }
    if (toggles.admin && opts.only !== 'customer') {
      jobs.push({ who: 'admin', to: config.adminEmails, mail: () => adminEmail(event, o, store) })
    }

    let changed = false
    for (const job of jobs) {
      const key = `${job.who}:${event}`
      if (log[key] && !opts.force) {
        result[job.who] = 'already_sent'
        continue
      }
      if (!job.to.length) {
        result[job.who] = 'no_recipient'
        continue
      }
      try {
        await sendEmail(job.to, job.mail(), config, store)
        result[job.who] = 'sent'
        log[key] = new Date().toISOString()
        changed = true
      } catch (err) {
        result[job.who] = `error: ${(err as Error).message}`
        console.error(`Email ${key} for ${orderId} failed:`, (err as Error).message)
      }
    }
    if (changed) {
      const { error } = await db.from('orders').update({ email_log: log }).eq('id', orderId)
      if (error) console.warn('Could not record email_log (run supabase/order_emails_setup.sql):', error.message)
    }
  } catch (err) {
    console.error('notifyOrderEvent failed:', (err as Error).message)
  }
  return result
}
