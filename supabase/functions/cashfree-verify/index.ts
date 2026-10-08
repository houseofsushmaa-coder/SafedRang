import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()
    
    if (!order_id) {
      throw new Error('order_id is required')
    }

    const appId = Deno.env.get('VITE_CASHFREE_APP_ID')
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')
    const env = Deno.env.get('VITE_CASHFREE_ENV') || 'SANDBOX'
    
    const apiUrl = env === 'PRODUCTION' 
      ? `https://api.cashfree.com/pg/orders/${order_id}` 
      : `https://sandbox.cashfree.com/pg/orders/${order_id}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-version': '2022-09-01',
        'x-client-id': appId!,
        'x-client-secret': secretKey!
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify Cashfree order')
    }

    // Update order in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const statusMap: Record<string, string> = {
      'PAID': 'PAID',
      'ACTIVE': 'PENDING',
      'EXPIRED': 'FAILED'
    }

    const paymentStatus = statusMap[data.order_status] || data.order_status

    await supabaseClient
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', order_id)

    return new Response(
      JSON.stringify({ order_status: paymentStatus }),
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
