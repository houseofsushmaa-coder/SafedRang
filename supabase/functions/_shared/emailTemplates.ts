// Branded order emails. Table layout + inline styles so they render in Gmail,
// Outlook and phone mail apps. Every email also has a plain-text version.

export type OrderEvent =
  | 'order_placed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export const EVENT_LABELS: Record<OrderEvent, string> = {
  order_placed: 'Order placed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

const C = {
  ivory: '#faf5ec',
  card: '#ffffff',
  ink: '#2a211d',
  muted: '#8b7863',
  line: '#ece3d6',
  wine: '#6e1e2a',
  gold: '#ae8a54',
}

export interface EmailOrder {
  id: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: { name?: string; address?: string; apartment?: string; city?: string; state?: string; pincode?: string; country?: string; phone?: string }
  items: { title: string; quantity: number; price: number; image?: string | null; selectedSize?: string | null }[]
  subtotal: number
  shipping: number
  total: number
  isCod: boolean
  isPaid: boolean
  courier?: string | null
  awb?: string | null
  trackingUrl?: string | null
}

export interface StoreInfo {
  name: string
  siteUrl: string
  supportEmail: string
  supportPhone: string
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

const inr = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

const firstName = (o: EmailOrder) => (o.customerName || o.address.name || '').trim().split(/\s+/)[0] || 'there'

const dateIN = (iso: string) =>
  new Date(iso || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

const addressLines = (o: EmailOrder) =>
  [
    o.address.name || o.customerName,
    o.address.address,
    o.address.apartment,
    [o.address.city, o.address.state].filter(Boolean).join(', ') + (o.address.pincode ? ` ${o.address.pincode}` : ''),
    o.address.country && !/^india$/i.test(o.address.country) ? o.address.country : '',
    o.address.phone || o.customerPhone ? `Phone: ${o.address.phone || o.customerPhone}` : '',
  ].filter((l) => l && String(l).trim())

// ── Building blocks ──────────────────────────────────────────────────────────
const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
    <tr><td style="background:${C.wine};border-radius:3px;">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${esc(label)}</a>
    </td></tr>
  </table>`

const sectionTitle = (t: string) =>
  `<p style="margin:28px 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${C.gold};">${esc(t)}</p>`

const para = (html: string) =>
  `<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${C.ink};">${html}</p>`

const itemsTable = (o: EmailOrder) => {
  const rows = o.items
    .map(
      (i) => `
      <tr>
        <td width="64" style="padding:12px 0;border-bottom:1px solid ${C.line};vertical-align:top;">
          ${
            i.image
              ? `<img src="${esc(i.image)}" width="52" height="66" alt="" style="display:block;width:52px;height:66px;object-fit:cover;border-radius:2px;background:${C.ivory};">`
              : `<div style="width:52px;height:66px;background:${C.ivory};border-radius:2px;"></div>`
          }
        </td>
        <td style="padding:12px 10px;border-bottom:1px solid ${C.line};vertical-align:top;font-family:Helvetica,Arial,sans-serif;">
          <div style="font-size:14px;color:${C.ink};font-weight:bold;text-transform:capitalize;">${esc(i.title.replace(/"/g, ''))}</div>
          <div style="font-size:12px;color:${C.muted};margin-top:4px;">Qty ${i.quantity}${i.selectedSize ? ` · Size ${esc(i.selectedSize)}` : ''}</div>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};vertical-align:top;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:${C.ink};white-space:nowrap;">${inr(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('')
  const line = (label: string, value: string, bold = false) => `
      <tr>
        <td colspan="2" style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:${bold ? 15 : 13}px;color:${bold ? C.ink : C.muted};${bold ? 'font-weight:bold;' : ''}">${label}</td>
        <td align="right" style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:${bold ? 15 : 13}px;color:${C.ink};${bold ? 'font-weight:bold;' : ''}white-space:nowrap;">${value}</td>
      </tr>`
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows}
      <tr><td colspan="3" style="height:8px;"></td></tr>
      ${line('Subtotal', inr(o.subtotal))}
      ${line(o.isCod ? 'Cash on Delivery fee' : 'Shipping', o.shipping > 0 ? inr(o.shipping) : 'Free')}
      ${line('Total', inr(o.total), true)}
      ${line('Payment', o.isCod && !o.isPaid ? `Cash on Delivery — pay ${inr(o.total)} on arrival` : 'Paid online')}
    </table>`
}

const addressBlock = (o: EmailOrder) =>
  `<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:${C.ink};">${addressLines(o).map(esc).join('<br>')}</p>`

const trackingBlock = (o: EmailOrder) =>
  o.awb
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ivory};border:1px solid ${C.line};border-radius:4px;">
      <tr><td style="padding:16px 18px;font-family:Helvetica,Arial,sans-serif;">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Courier</div>
        <div style="font-size:15px;color:${C.ink};font-weight:bold;margin:2px 0 10px;">${esc(o.courier || 'Our courier partner')}</div>
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Tracking number (AWB)</div>
        <div style="font-size:15px;color:${C.ink};font-weight:bold;margin-top:2px;letter-spacing:0.5px;">${esc(o.awb)}</div>
      </td></tr>
    </table>`
    : ''

function layout(store: StoreInfo, opts: { preheader: string; eyebrow: string; heading: string; body: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.ivory};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ivory};">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
      <tr><td align="center" style="padding:0 0 22px;">
        <a href="${esc(store.siteUrl)}" style="text-decoration:none;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:6px;color:${C.ink};">SAFED RANG</span>
        </a>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:3px;color:${C.gold};margin-top:6px;">HANDCRAFTED IN LUCKNOW</div>
      </td></tr>
      <tr><td style="background:${C.card};border:1px solid ${C.line};border-top:3px solid ${C.wine};padding:36px 32px;">
        <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${C.gold};">${esc(opts.eyebrow)}</p>
        <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.3;color:${C.ink};">${esc(opts.heading)}</h1>
        ${opts.body}
      </td></tr>
      <tr><td align="center" style="padding:22px 16px 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:${C.muted};">
        Questions? Just reply to this email${store.supportPhone ? ` or call/WhatsApp ${esc(store.supportPhone)}` : ''}.<br>
        <a href="${esc(store.siteUrl)}" style="color:${C.wine};text-decoration:none;">${esc(store.siteUrl.replace(/^https?:\/\//, ''))}</a>
        &nbsp;·&nbsp; ${esc(store.name)}, Lucknow
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

const textFooter = (store: StoreInfo) =>
  `\n\nQuestions? Reply to this email${store.supportPhone ? ` or call/WhatsApp ${store.supportPhone}` : ''}.\n${store.name} — ${store.siteUrl}`

const textItems = (o: EmailOrder) =>
  o.items.map((i) => `- ${i.title.replace(/"/g, '')}${i.selectedSize ? ` (Size ${i.selectedSize})` : ''} × ${i.quantity} — ${inr(i.price * i.quantity)}`).join('\n') +
  `\nTotal: ${inr(o.total)} (${o.isCod && !o.isPaid ? 'Cash on Delivery' : 'Paid online'})`

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

// ── Customer emails ──────────────────────────────────────────────────────────
export function customerEmail(event: OrderEvent, o: EmailOrder, store: StoreInfo): RenderedEmail {
  const ordersUrl = `${store.siteUrl}/account/orders?highlight=${encodeURIComponent(o.id)}`
  const trackUrl = o.trackingUrl || (o.awb ? `https://shiprocket.co/tracking/${o.awb}` : ordersUrl)
  const name = esc(firstName(o))
  const ref = `#${o.id}`

  switch (event) {
    case 'order_placed': {
      const body =
        para(`Namaste ${name},`) +
        para(
          `Thank you for choosing Safed Rang. We've received your order <strong>${esc(ref)}</strong> placed on ${esc(dateIN(o.createdAt))}` +
            (o.isCod && !o.isPaid
              ? ` — please keep <strong>${inr(o.total)}</strong> ready to pay when it arrives.`
              : ` and your payment of <strong>${inr(o.total)}</strong> is confirmed.`)
        ) +
        para(`Your pieces are now being checked and packed by hand. We'll email you the tracking details as soon as it ships.`) +
        sectionTitle('Your order') +
        itemsTable(o) +
        sectionTitle('Delivering to') +
        addressBlock(o) +
        button(ordersUrl, 'View your order')
      return {
        subject: `Order confirmed — ${ref}`,
        html: layout(store, { preheader: `We've received your order ${ref}. We'll email you when it ships.`, eyebrow: 'Order confirmed', heading: 'Thank you for your order', body }),
        text: `Namaste ${firstName(o)},\n\nThank you for your order ${ref}. ${o.isCod && !o.isPaid ? `Please keep ${inr(o.total)} ready to pay on delivery.` : `Your payment of ${inr(o.total)} is confirmed.`} We'll email you when it ships.\n\n${textItems(o)}\n\nDelivering to:\n${addressLines(o).join('\n')}\n\nView your order: ${ordersUrl}${textFooter(store)}`,
      }
    }
    case 'shipped': {
      const body =
        para(`Namaste ${name},`) +
        para(`Good news — your order <strong>${esc(ref)}</strong> has left our Lucknow atelier and is on its way to you.`) +
        trackingBlock(o) +
        (o.awb ? button(trackUrl, 'Track your parcel') : '') +
        (o.isCod && !o.isPaid ? para(`<br>Please keep <strong>${inr(o.total)}</strong> ready to pay the courier on delivery.`) : '') +
        sectionTitle('In this parcel') +
        itemsTable(o) +
        sectionTitle('Delivering to') +
        addressBlock(o)
      return {
        subject: `Your order ${ref} has shipped`,
        html: layout(store, { preheader: `On its way${o.awb ? ` — tracking ${o.awb}` : ''}.`, eyebrow: 'Shipped', heading: 'Your order is on its way', body }),
        text: `Namaste ${firstName(o)},\n\nYour order ${ref} has shipped.${o.awb ? `\nCourier: ${o.courier || '—'}\nTracking (AWB): ${o.awb}\nTrack: ${trackUrl}` : ''}${o.isCod && !o.isPaid ? `\nPlease keep ${inr(o.total)} ready to pay on delivery.` : ''}\n\n${textItems(o)}${textFooter(store)}`,
      }
    }
    case 'out_for_delivery': {
      const body =
        para(`Namaste ${name},`) +
        para(`Your order <strong>${esc(ref)}</strong> is out for delivery and should reach you today.`) +
        (o.isCod && !o.isPaid
          ? para(`Please keep <strong>${inr(o.total)}</strong> ready in cash for the courier.`)
          : para(`It's already paid — nothing to pay at the door.`)) +
        trackingBlock(o) +
        (o.awb ? button(trackUrl, 'Track your parcel') : '')
      return {
        subject: `Arriving today — order ${ref}`,
        html: layout(store, { preheader: 'Your Safed Rang parcel is out for delivery.', eyebrow: 'Out for delivery', heading: 'Arriving today', body }),
        text: `Namaste ${firstName(o)},\n\nYour order ${ref} is out for delivery today.${o.isCod && !o.isPaid ? ` Please keep ${inr(o.total)} ready in cash.` : ' It is already paid.'}${o.awb ? `\nTrack: ${trackUrl}` : ''}${textFooter(store)}`,
      }
    }
    case 'delivered': {
      const body =
        para(`Namaste ${name},`) +
        para(`Your order <strong>${esc(ref)}</strong> has been delivered. We hope it brings you as much joy as our karigars put into making it.`) +
        para(
          `A few care tips: dry clean silk, organza and embellished pieces; store them folded in a muslin cloth, away from direct sunlight. Our <a href="${esc(store.siteUrl)}/care" style="color:${C.wine};">care guide</a> has more.`
        ) +
        para(`If anything isn't right, simply reply to this email and we'll help.`) +
        button(`${store.siteUrl}/shop`, 'Explore new arrivals')
      return {
        subject: `Delivered — order ${ref}`,
        html: layout(store, { preheader: 'Your Safed Rang order has been delivered.', eyebrow: 'Delivered', heading: 'Your order has arrived', body }),
        text: `Namaste ${firstName(o)},\n\nYour order ${ref} has been delivered. We hope you love it. Care guide: ${store.siteUrl}/care\nIf anything isn't right, just reply to this email.${textFooter(store)}`,
      }
    }
    case 'cancelled': {
      const body =
        para(`Namaste ${name},`) +
        para(`Your order <strong>${esc(ref)}</strong> has been cancelled.`) +
        (o.isPaid && !o.isCod
          ? para(`As you paid online, we'll process your refund to the original payment method and confirm by email once it's done.`)
          : para(`No payment was taken for this order.`)) +
        para(`If you didn't ask for this or have any questions, just reply to this email.`) +
        sectionTitle('Cancelled items') +
        itemsTable(o)
      return {
        subject: `Order ${ref} cancelled`,
        html: layout(store, { preheader: `Your order ${ref} has been cancelled.`, eyebrow: 'Order cancelled', heading: 'Your order has been cancelled', body }),
        text: `Namaste ${firstName(o)},\n\nYour order ${ref} has been cancelled.${o.isPaid && !o.isCod ? " We'll refund your online payment and confirm by email." : ' No payment was taken.'}\nQuestions? Reply to this email.${textFooter(store)}`,
      }
    }
    case 'returned': {
      const body =
        para(`Namaste ${name},`) +
        para(`We've received the return for your order <strong>${esc(ref)}</strong>.`) +
        (o.isPaid
          ? para(`Once the pieces have been checked, we'll process your refund and confirm by email.`)
          : para(`Since this order wasn't paid, there's nothing more you need to do.`)) +
        para(`Questions? Just reply to this email.`)
      return {
        subject: `Return received — order ${ref}`,
        html: layout(store, { preheader: `We've received the return for ${ref}.`, eyebrow: 'Return received', heading: 'We received your return', body }),
        text: `Namaste ${firstName(o)},\n\nWe've received the return for order ${ref}.${o.isPaid ? " We'll process your refund and confirm by email." : ''}${textFooter(store)}`,
      }
    }
  }
}

// ── Admin (store owner) emails ───────────────────────────────────────────────
export function adminEmail(event: OrderEvent, o: EmailOrder, store: StoreInfo): RenderedEmail {
  const adminUrl = `${store.siteUrl}/admin/orders?q=${encodeURIComponent(o.id)}`
  const pay = o.isCod && !o.isPaid ? 'Cash on Delivery' : 'Paid online'
  const headings: Record<OrderEvent, string> = {
    order_placed: `New order — ${inr(o.total)}`,
    shipped: 'Order shipped',
    out_for_delivery: 'Order out for delivery',
    delivered: 'Order delivered',
    cancelled: 'Order cancelled',
    returned: 'Order returned',
  }
  const body =
    para(
      `<strong>${esc(o.customerName || o.address.name || 'Customer')}</strong>` +
        `<br><span style="color:${C.muted};font-size:13px;">${esc(o.customerEmail)}${o.customerPhone ? ` · ${esc(o.customerPhone)}` : ''}</span>`
    ) +
    para(`Order <strong>#${esc(o.id)}</strong> · ${esc(pay)}${o.awb ? ` · AWB ${esc(o.awb)}` : ''}`) +
    sectionTitle('Items') +
    itemsTable(o) +
    sectionTitle('Ship to') +
    addressBlock(o) +
    button(adminUrl, 'Open in admin')
  return {
    subject: `[Safed Rang] ${headings[event]} · #${o.id}`,
    html: layout(store, { preheader: `${headings[event]} · ${o.customerName} · ${pay}`, eyebrow: EVENT_LABELS[event], heading: headings[event], body }),
    text: `${headings[event]}\n\nOrder #${o.id} · ${pay}\n${o.customerName} · ${o.customerEmail} · ${o.customerPhone}\n\n${textItems(o)}\n\nShip to:\n${addressLines(o).join('\n')}\n\nAdmin: ${adminUrl}`,
  }
}
