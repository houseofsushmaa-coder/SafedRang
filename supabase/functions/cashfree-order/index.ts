import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderDetails, customerDetails } = await req.json()
    
    // Call Cashfree API
    const appId = Deno.env.get('VITE_CASHFREE_APP_ID')
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')
    const env = Deno.env.get('VITE_CASHFREE_ENV') || 'SANDBOX'
    
    const apiUrl = env === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders'

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    
    const cashfreePayload = {
      order_id: orderId,
      order_amount: orderDetails.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone || "9999999999"
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/payment/verify?order_id=${orderId}`
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-api-version': '2022-09-01',
        'Content-Type': 'application/json',
        'x-client-id': appId!,
        'x-client-secret': secretKey!
      },
      body: JSON.stringify(cashfreePayload)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Cashfree order')
    }

    // Save order to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { error: dbError } = await supabaseClient.from('orders').insert({
      id: orderId,
      total_amount: orderDetails.amount,
      payment_status: 'PENDING',
      customer_email: customerDetails.email,
      customer_name: customerDetails.name,
      customer_phone: customerDetails.phone,
      shipping_address: customerDetails.address,
      items: orderDetails.items
    })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ 
        payment_session_id: data.payment_session_id,
        order_id: orderId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
