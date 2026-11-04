import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import {
  adminClient, cashfreeBase, cashfreeHeaders, corsHeaders, errorResponse, json,
  priceCart, provisionCustomer, requestUserId, validateCustomer,
} from "../_shared/orders.ts"
import { convertFromInr, normaliseCurrency } from "../_shared/currency.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderDetails, customerDetails, currencySelected } = await req.json()
    const db = adminClient()

    // Amount is computed server-side; any client-sent amount is ignored.
    const customer = validateCustomer(customerDetails)
    const { items, subtotal } = await priceCart(db, orderDetails?.items)

    const orderId = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    const siteUrl = req.headers.get('origin') || Deno.env.get('SITE_URL') || 'https://safedrang.com'
    const phoneDigits = customer.phone.replace(/\D/g, '')

    // ── Which currency to charge in ──
    // The shopper's choice, converted from INR on the server with a live rate.
    // Falls back to INR if the rate is unavailable, the database can't record it,
    // or Cashfree doesn't accept that currency for this account.
    let currency = normaliseCurrency(currencySelected)
    let charge = { amount: subtotal, rate: 1 }
    let fallbackReason = ''
    if (currency !== 'INR') {
      const { error: colError } = await db.from('orders').select('charge_currency').limit(1)
      if (colError) {
        fallbackReason = 'multi-currency columns missing (run supabase/multi_currency_setup.sql)'
      } else {
        try {
          const converted = await convertFromInr(subtotal, currency)
          if (converted) charge = converted
          else fallbackReason = `no exchange rate for ${currency}`
        } catch (err) {
          fallbackReason = `exchange rate unavailable: ${(err as Error).message}`
        }
      }
      if (fallbackReason) {
        console.warn(`Charging ${orderId} in INR instead of ${currency}: ${fallbackReason}`)
        currency = 'INR'
        charge = { amount: subtotal, rate: 1 }
      }
    }

    const createCashfreeOrder = (orderCurrency: string, amount: number) =>
      fetch(`${cashfreeBase()}/orders`, {
        method: 'POST',
        headers: cashfreeHeaders(),
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: orderCurrency,
          customer_details: {
            customer_id: `cust_${phoneDigits || Date.now()}`,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: phoneDigits.length > 10 && phoneDigits.startsWith('91') ? phoneDigits.slice(-10) : phoneDigits,
          },
          order_meta: {
            return_url: `${siteUrl}/payment/verify?order_id=${orderId}`,
            notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
          },
        }),
      })

    let response = await createCashfreeOrder(currency, charge.amount)
    let data = await response.json()
    if (!response.ok && currency !== 'INR') {
      // e.g. the currency isn't enabled on this Cashfree account — charge in INR instead.
      console.warn(`Cashfree refused ${currency} for ${orderId}:`, JSON.stringify(data).slice(0, 300))
      fallbackReason = `Cashfree did not accept ${currency}`
      currency = 'INR'
      charge = { amount: subtotal, rate: 1 }
      response = await createCashfreeOrder('INR', subtotal)
      data = await response.json()
    }
    if (!response.ok) {
      console.error('Cashfree order creation failed:', data)
      return json({ error: 'Our payment partner could not start the payment. Please try again in a moment.' }, 502)
    }

    const userId = (await requestUserId(db, req)) ?? (await provisionCustomer(db, customer.email, customer.name)).userId
    const address = { ...customer.address, name: customer.name, phone: customer.phone, email: customer.email }
    const now = new Date().toISOString()

    const { error: dbError } = await db.from('orders').insert({
      id: orderId,
      order_id: orderId,
      orderNumber: orderId,
      subtotal,
      shipping_charge: 0,
      shippingCharge: 0,
      total: subtotal,
      total_amount: subtotal,
      payment_method: 'CASHFREE',
      paymentMethod: 'CASHFREE',
      payment_status: 'PENDING',
      paymentStatus: 'PENDING',
      order_status: 'PROCESSING',
      orderStatus: 'PROCESSING',
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone,
      shipping_address: address,
      shippingAddress: address,
      billingAddress: address,
      items,
      currency_selected: normaliseCurrency(currencySelected),
      // What Cashfree is actually charging (verified against when the payment comes back).
      ...(currency !== 'INR' ? { charge_currency: currency, charge_amount: charge.amount, fx_rate: charge.rate } : {}),
      user_id: userId,
      created_at: now,
      updated_at: now,
    })
    if (dbError) {
      // Without a stored order we could not reconcile the payment — do not let the shopper pay.
      console.error('Failed to save order:', dbError)
      return json({ error: 'We could not save your order. Please try again.' }, 500)
    }

    return json({
      payment_session_id: data.payment_session_id,
      order_id: orderId,
      amount: subtotal,
      charge_currency: currency,
      charge_amount: charge.amount,
      currency_fallback: fallbackReason ? true : undefined,
      items,
    })
  } catch (error) {
    return errorResponse(error)
  }
})
