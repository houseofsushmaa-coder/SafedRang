// Charging online orders in the shopper's currency (Cashfree international payments).
// The catalogue is priced in INR; the server converts with a live rate so the browser
// can never choose the amount. If Cashfree doesn't accept a currency for this account,
// the order is charged in INR instead.

/** Currencies offered at checkout (must match frontend/src/data/countries.js). */
export const PAYMENT_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR',
  'SGD', 'MYR', 'JPY', 'KRW', 'HKD', 'CHF', 'BDT', 'PKR', 'LKR', 'NPR',
]

const ZERO_DECIMAL = new Set(['JPY', 'KRW'])

export const normaliseCurrency = (c: unknown) => {
  const code = String(c ?? '').toUpperCase().trim()
  return PAYMENT_CURRENCIES.includes(code) ? code : 'INR'
}

let cache: { at: number; rates: Record<string, number> } | null = null

/** INR → currency rates (cached for 30 minutes per function instance). */
export async function inrRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return cache.rates
  const res = await fetch('https://api.exchangerate-api.com/v4/latest/INR')
  if (!res.ok) throw new Error(`exchange rate service returned ${res.status}`)
  const body = await res.json()
  if (!body?.rates || typeof body.rates !== 'object') throw new Error('exchange rate service sent no rates')
  cache = { at: Date.now(), rates: body.rates }
  return body.rates
}

/** Converts an INR amount; returns null if no usable rate. */
export async function convertFromInr(amountInr: number, currency: string) {
  if (currency === 'INR') return { amount: amountInr, rate: 1 }
  const rate = Number((await inrRates())[currency])
  if (!Number.isFinite(rate) || rate <= 0) return null
  const raw = amountInr * rate
  const amount = ZERO_DECIMAL.has(currency) ? Math.round(raw) : Math.round(raw * 100) / 100
  if (amount <= 0) return null
  return { amount, rate }
}
