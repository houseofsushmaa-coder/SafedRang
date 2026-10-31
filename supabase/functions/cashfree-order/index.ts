import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import {
  adminClient, cashfreeBase, cashfreeHeaders, corsHeaders, errorResponse, json,
  priceCart, provisionCustomer, requestUserId, validateCustomer,
} from "../_shared/orders.ts"

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

    const response = await fetch(`${cashfreeBase()}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: subtotal,
        order_currency: 'INR',
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
    const data = await response.json()
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
      currency_selected: currencySelected || 'INR',
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
      items,
    })
  } catch (error) {
    return errorResponse(error)
  }
})
