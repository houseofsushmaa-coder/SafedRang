import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('x-webhook-timestamp')
    
    if (!signature || !timestamp) {
      throw new Error('Missing signature headers')
    }

    const rawBody = await req.text()
    const payload = JSON.parse(rawBody)

    const orderId = payload?.data?.order?.order_id
    const orderStatus = payload?.data?.payment?.payment_status

    if (orderId && orderStatus === 'SUCCESS') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // Update order payment status
      const { data: orderRow } = await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'PAID',
          paymentStatus: 'PAID',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('customer_email, customer_name')
        .single()

      // Send magic link to customer for seamless account access
      if (orderRow?.customer_email) {
        const siteUrl = Deno.env.get('SITE_URL') || 'https://safedrang.com'
        try {
          await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: orderRow.customer_email,
            options: {
              redirectTo: `${siteUrl}/account/orders`,
            },
          })
        } catch (linkErr: any) {
          console.warn('Magic link send failed (non-fatal):', linkErr.message)
        }
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
