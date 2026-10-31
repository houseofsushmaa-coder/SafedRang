import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import {
  adminClient, corsHeaders, decrementStock, errorResponse, json,
  getCodRules, priceCart, provisionCustomer, requestUserId, sendAccountLink, UserError, validateCustomer,
} from "../_shared/orders.ts"

// Cash-on-delivery orders are created here (not from the browser) so price,
// stock and the COD fee come from the server.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items: cartItems, customerDetails, currencySelected } = await req.json()
    const db = adminClient()

    const customer = validateCustomer(customerDetails)
    const isIndia = customer.address.country_code === 'IN' || customer.address.country.toLowerCase() === 'india'
    if (!isIndia) throw new UserError('Cash on Delivery is available for India only. Please pay online.')

    const cod = await getCodRules(db)
    if (!cod.enabled) throw new UserError('Cash on Delivery is currently unavailable. Please pay online.')

    const { items, subtotal } = await priceCart(db, cartItems)
    const total = subtotal + cod.fee

    let userId = await requestUserId(db, req)
    let isNewUser = false
    if (!userId) {
      const provisioned = await provisionCustomer(db, customer.email, customer.name)
      userId = provisioned.userId
      isNewUser = provisioned.isNewUser
    }

    const orderId = `SR_COD_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`
    const address = { ...customer.address, name: customer.name, phone: customer.phone, email: customer.email }
    const now = new Date().toISOString()

    const { error } = await db.from('orders').insert({
      id: orderId,
      order_id: orderId,
      orderNumber: orderId,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: address,
      shippingAddress: address,
      billingAddress: address,
      items,
      subtotal,
      shipping_charge: cod.fee,
      shippingCharge: cod.fee,
      total,
      total_amount: total,
      payment_method: 'COD',
      paymentMethod: 'COD',
      payment_status: 'PENDING',
      paymentStatus: 'PENDING',
      order_status: 'PROCESSING',
      orderStatus: 'PROCESSING',
      currency_selected: currencySelected || 'INR',
      user_id: userId,
      created_at: now,
      updated_at: now,
    })
    if (error) {
      console.error('COD insert failed:', error)
      return json({ error: 'We could not save your order. Please try again.' }, 500)
    }

    // A COD order is a firm commitment, so reserve the stock now.
    await decrementStock(db, items)
    await sendAccountLink(db, customer.email, orderId)

    return json({ order_id: orderId, total, items, isNewUser })
  } catch (error) {
    return errorResponse(error)
  }
})
