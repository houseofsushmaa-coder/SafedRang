// First-party visitor analytics: the storefront sends small batches of events
// (page views, product views, add to cart, checkout, purchase…) and this stores
// them with the visitor's IP, device and traffic source in public.site_events.
// Public endpoint (deploy with --no-verify-jwt); it only ever inserts.
import { adminClient, corsHeaders, json } from '../_shared/orders.ts'

const ALLOWED_EVENTS = new Set([
  'page_view', 'view_item', 'view_item_list', 'select_item', 'search', 'add_to_wishlist',
  'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info',
  'add_payment_info', 'purchase', 'filter_apply', 'sort_change', 'whatsapp_click',
])
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http/i

const str = (v: unknown, max = 300) => {
  const s = String(v ?? '').trim()
  return s ? s.slice(0, max) : null
}
const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && Math.abs(n) < 1e9 ? n : null
}

function device(ua: string) {
  const d = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? 'Tablet' : /mobi|iphone|android/i.test(ua) ? 'Mobile' : 'Desktop'
  const os = /iphone|ipad|ios/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other'
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet'
    : /instagram/i.test(ua) ? 'Instagram' : /fban|fbav/i.test(ua) ? 'Facebook' : /chrome|crios/i.test(ua) ? 'Chrome'
    : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other'
  return { device: d, os, browser }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: true })

  try {
    const ua = req.headers.get('user-agent') ?? ''
    if (!ua || BOT.test(ua)) return json({ ok: true, skipped: 'bot' })

    // sendBeacon posts text/plain, so parse the raw body ourselves.
    const raw = await req.text()
    if (raw.length > 50_000) return json({ ok: false }, 413)
    const body = JSON.parse(raw || '{}')
    const ctx = body?.ctx ?? {}
    const events = (Array.isArray(body?.events) ? body.events : []).slice(0, 25)
    if (!events.length) return json({ ok: true })

    const visitorId = str(ctx.vid, 64)
    const sessionId = str(ctx.sid, 64)
    if (!visitorId || !sessionId) return json({ ok: false }, 400)

    const ip =
      (req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        '').trim() || null
    const country = str(req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country'), 8)
    const { device: dev, os, browser } = device(ua)

    const rows = events
      .filter((e: any) => ALLOWED_EVENTS.has(String(e?.name)))
      .map((e: any) => ({
        created_at: e.ts && Math.abs(Date.now() - Number(e.ts)) < 6 * 3600 * 1000 ? new Date(Number(e.ts)).toISOString() : new Date().toISOString(),
        visitor_id: visitorId,
        session_id: sessionId,
        event: String(e.name),
        path: str(e.path, 300),
        page_title: str(e.title, 200),
        product_id: str(e.productId, 80),
        product_title: str(e.productTitle, 200),
        value: num(e.value),
        quantity: num(e.quantity),
        order_id: str(e.orderId, 80),
        search_term: str(e.searchTerm, 120),
        referrer: str(ctx.ref, 300),
        utm_source: str(ctx.utm_source, 80),
        utm_medium: str(ctx.utm_medium, 80),
        utm_campaign: str(ctx.utm_campaign, 120),
        ip,
        country,
        timezone: str(ctx.tz, 60),
        language: str(ctx.lang, 20),
        screen: str(ctx.screen, 20),
        device: dev,
        os,
        browser,
        user_agent: str(ua, 400),
      }))
    if (!rows.length) return json({ ok: true })

    const { error } = await adminClient().from('site_events').insert(rows)
    if (error) {
      console.error('site_events insert failed:', error.message)
      return json({ ok: false }, 500)
    }
    return json({ ok: true, stored: rows.length })
  } catch (err) {
    console.error('site-visit error:', (err as Error).message)
    return json({ ok: false }, 400)
  }
})
