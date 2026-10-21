import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderDetails, customerDetails } = await req.json()
    
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
        return_url: `${req.headers.get('origin')}/payment/verify?order_id=${orderId}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`
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

    // ── Provision customer account (create/find user) ──────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find or create user by email
    let userId: string | null = null
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === customerDetails.email.toLowerCase()
      )

      if (existingUser) {
        userId = existingUser.id
      } else {
        const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
          email: customerDetails.email,
          email_confirm: true,
          user_metadata: {
            full_name: customerDetails.name,
            name: customerDetails.name,
            role: 'customer',
            signup_source: 'checkout',
          },
          app_metadata: { role: 'customer' },
        })
        userId = newUser?.user?.id ?? null
      }
    } catch (userErr: any) {
      console.warn('User provisioning failed (non-fatal):', userErr.message)
    }

    // ── Save order to Supabase ─────────────────────────────────────────────
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { error: dbError } = await supabaseAnon.from('orders').insert({
      id: orderId,
      order_id: orderId,
      orderNumber: orderId,
      subtotal: orderDetails.amount,
      total: orderDetails.amount,
      total_amount: orderDetails.amount,
      payment_method: 'CASHFREE',
      paymentMethod: 'CASHFREE',
      payment_status: 'PENDING',
      paymentStatus: 'PENDING',
      order_status: 'PROCESSING',
      orderStatus: 'PROCESSING',
      customer_email: customerDetails.email,
      customer_name: customerDetails.name,
      customer_phone: customerDetails.phone,
      shipping_address: customerDetails.address,
      shippingAddress: customerDetails.address,
      billingAddress: customerDetails.address,
      items: orderDetails.items,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Failed to save order to Supabase:", dbError)
    }

    return new Response(
      JSON.stringify({ 
        payment_session_id: data.payment_session_id,
        order_id: orderId,
        user_provisioned: !!userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
