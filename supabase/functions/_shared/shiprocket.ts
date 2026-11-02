// Shiprocket API helpers. Credentials live only in Supabase secrets:
//   SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_PICKUP_LOCATION, SHIPROCKET_WEBHOOK_TOKEN
const API = 'https://apiv2.shiprocket.in/v1/external'

export class ShiprocketError extends Error {}

const PLACEHOLDER = /^(change[_ ]?me|placeholder|your[_ ]|xxx)/i

export function shiprocketConfig() {
  const email = Deno.env.get('SHIPROCKET_EMAIL') ?? ''
  const password = Deno.env.get('SHIPROCKET_PASSWORD') ?? ''
  const pickup = Deno.env.get('SHIPROCKET_PICKUP_LOCATION') ?? 'Primary'
  const missing: string[] = []
  if (!email) missing.push('SHIPROCKET_EMAIL')
  if (!password || PLACEHOLDER.test(password)) missing.push('SHIPROCKET_PASSWORD')
  return { email, password, pickup, missing }
}

export async function shiprocketLogin(): Promise<string> {
  const { email, password, missing } = shiprocketConfig()
  if (missing.length) {
    throw new ShiprocketError(`Shiprocket is not set up yet — add ${missing.join(' and ')} in Supabase → Edge Functions → Secrets.`)
  }
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body?.token) {
    throw new ShiprocketError(
      res.status === 400 || res.status === 401 || res.status === 403
        ? 'Shiprocket rejected the API login. Check SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD (use the API user, not your main login).'
        : `Shiprocket login failed (${res.status}).`
    )
  }
  return body.token as string
}

export async function shiprocketRequest(token: string, path: string, payload: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Shiprocket returns { message, errors: { field: [msg] } } on validation errors.
    const fieldErrors = body?.errors && typeof body.errors === 'object'
      ? Object.entries(body.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
      : ''
    throw new ShiprocketError(`Shiprocket: ${body?.message || res.statusText}${fieldErrors ? ` (${fieldErrors})` : ''}`)
  }
  return body
}

/**
 * The pickup location name Shiprocket knows. Uses SHIPROCKET_PICKUP_LOCATION when it
 * matches (case-insensitive); if the account has exactly one pickup address, uses that.
 */
export async function resolvePickup(token: string, configured: string): Promise<string> {
  const res = await fetch(`${API}/settings/company/pickup`, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json().catch(() => ({}))
  const list: any[] = body?.data?.shipping_address ?? []
  const names = list.map((a) => String(a?.pickup_location ?? '')).filter(Boolean)
  if (!names.length) {
    throw new ShiprocketError('No pickup address found in Shiprocket. Add one in Shiprocket → Settings → Pickup Addresses.')
  }
  const match = names.find((n) => n.trim().toLowerCase() === configured.trim().toLowerCase())
  if (match) return match
  if (names.length === 1) return names[0]
  throw new ShiprocketError(
    `Pickup location "${configured}" doesn't exist in Shiprocket. Set the SHIPROCKET_PICKUP_LOCATION secret to one of: ${names.map((n) => `"${n}"`).join(', ')}`
  )
}

/** Default parcel weight (kg) per piece when a product has no weight set. */
export function defaultWeightKg(category: string | null | undefined): number {
  const c = String(category ?? '').toLowerCase()
  if (c.includes('saree') || c.includes('kurta') || c.includes('lehenga') || c.includes('suit')) return 0.8
  if (c.includes('dupatta') || c.includes('stole')) return 0.4
  if (c.includes('blouse')) return 0.25
  return 0.2
}

/** A sensible box for the total weight (cm). Editable in the admin before sending. */
export function defaultBox(weightKg: number) {
  if (weightKg <= 0.3) return { length: 20, breadth: 15, height: 5 }
  if (weightKg <= 1) return { length: 30, breadth: 25, height: 5 }
  if (weightKg <= 2.5) return { length: 35, breadth: 30, height: 10 }
  return { length: 40, breadth: 35, height: 15 }
}

/** Indian mobile number as the 10 digits Shiprocket expects. */
export const tenDigitPhone = (raw: unknown) => String(raw ?? '').replace(/\D/g, '').slice(-10)

/** Shiprocket's "YYYY-MM-DD HH:mm" in India time. */
export function istDate(iso: string | null | undefined) {
  const d = new Date(iso || Date.now())
  const ist = new Date(d.getTime() + 5.5 * 3600 * 1000)
  return ist.toISOString().slice(0, 16).replace('T', ' ')
}
