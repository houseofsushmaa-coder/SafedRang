import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import {
  adminClient, cashfreeBase, cashfreeHeaders, confirmPaidOrder, corsHeaders, errorResponse, json, sendAccountLink, UserError,
} from "../_shared/orders.ts"

// Called by the storefront after Cashfree redirects back. The payment status is
// always read from Cashfree's API — never from the redirect URL.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()
    if (!order_id || typeof order_id !== 'string') throw new UserError('order_id is required')

    const response = await fetch(`${cashfreeBase()}/orders/${encodeURIComponent(order_id)}`, {
      method: 'GET',
      headers: cashfreeHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('Cashfree verify failed:', data)
      return json({ error: 'We could not confirm your payment yet. Please refresh in a moment.' }, 502)
    }

    const db = adminClient()

    if (data.order_status === 'PAID') {
      const result = await confirmPaidOrder(db, order_id, Number(data.order_amount))
      if (result.status === 'PAID' && result.order) {
        const { data: row } = await db.from('orders').select('customer_email, user_id').eq('id', order_id).maybeSingle()
        if (result.transitioned && row?.customer_email) await sendAccountLink(db, row.customer_email, order_id)
        return json({
          order_status: 'PAID',
          order_amount: Number(result.order.total),
          items: result.order.items ?? [],
          email: row?.customer_email ?? null,
        })
      }
      return json({ order_status: result.status })
    }

    // ACTIVE = payment not finished yet (e.g. pending UPI approval); EXPIRED = abandoned/failed.
    const status = data.order_status === 'ACTIVE' ? 'PENDING' : 'FAILED'
    if (status === 'FAILED') {
      await db.from('orders')
        .update({ payment_status: 'FAILED', paymentStatus: 'FAILED', updated_at: new Date().toISOString() })
        .eq('id', order_id)
        .neq('payment_status', 'PAID')
    }
    return json({ order_status: status })
  } catch (error) {
    return errorResponse(error)
  }
})
