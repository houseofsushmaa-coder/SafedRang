// Admin-only order email actions.
// POST { action: "status" }                         → which provider is set up
// POST { action: "send", orderId, event, force? }   → send that order's email(s) for an event
// POST { action: "test", to? }                      → send sample customer + admin emails
import { adminClient, corsHeaders, json } from '../_shared/orders.ts'
import { EVENT_LABELS, adminEmail, customerEmail, EmailOrder } from '../_shared/emailTemplates.ts'
import { loadEmailSetup, notifyOrderEvent, OrderEvent, providerStatus, sendEmail } from '../_shared/notify.ts'

async function isAdmin(db: ReturnType<typeof adminClient>, req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data } = await db.auth.getUser(token)
  const user = data?.user
  if (!user) return null
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return ['admin', 'super_admin', 'manager'].includes(String(profile?.role ?? '')) ? user : null
}

const SAMPLE: EmailOrder = {
  id: 'SR_TEST_0001',
  createdAt: new Date().toISOString(),
  customerName: 'Ananya Sharma',
  customerEmail: 'customer@example.com',
  customerPhone: '+91 98765 43210',
  address: { name: 'Ananya Sharma', address: '12 Hazratganj Road', apartment: 'Flat 4B', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', country: 'India' },
  items: [{ title: 'Surili Raag chikankari georgette saree', quantity: 1, price: 12499, image: null }],
  subtotal: 12499,
  shipping: 0,
  total: 12499,
  isCod: false,
  isPaid: true,
  courier: 'Delhivery',
  awb: '1234567890123',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const db = adminClient()
  try {
    const user = await isAdmin(db, req)
    if (!user) return json({ error: 'Admins only.' }, 403)
    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')

    if (action === 'status') {
      const { config } = await loadEmailSetup(db)
      return json({ ...providerStatus(), adminEmails: config.adminEmails })
    }

    if (action === 'send') {
      const event = String(body.event ?? '') as OrderEvent
      if (!(event in EVENT_LABELS)) return json({ error: 'Unknown email type.' }, 400)
      if (!body.orderId) return json({ error: 'orderId is required.' }, 400)
      const result = await notifyOrderEvent(db, String(body.orderId), event, { force: Boolean(body.force) })
      return json({ ok: true, result })
    }

    if (action === 'test') {
      if (!providerStatus().ready) return json({ error: 'Email is not set up yet — add RESEND_API_KEY (or SMTP_*) in Supabase → Edge Functions → Secrets.' }, 400)
      const { config, store } = await loadEmailSetup(db)
      const to = String(body.to || user.email || '').trim()
      if (!to) return json({ error: 'No address to send the test to.' }, 400)
      const event = (String(body.event || 'order_placed') as OrderEvent) in EVENT_LABELS ? (String(body.event || 'order_placed') as OrderEvent) : 'order_placed'
      const c = customerEmail(event, SAMPLE, store)
      const a = adminEmail(event, SAMPLE, store)
      await sendEmail([to], { ...c, subject: `[TEST] ${c.subject}` }, config, store)
      await sendEmail([to], { ...a, subject: `[TEST] ${a.subject}` }, config, store)
      return json({ ok: true, to })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message || 'Email action failed.' }, 500)
  }
})
