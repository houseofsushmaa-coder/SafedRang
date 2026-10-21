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
    const { email, fullName, orderId } = await req.json()

    if (!email) {
      throw new Error('email is required')
    }

    // Use service role key to manage users server-side
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      // User already exists — just send them a magic link to sign in
      userId = existingUser.id
    } else {
      // Create a new user account (no password — they'll use magic link)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Mark email as confirmed immediately
        user_metadata: {
          full_name: fullName || email.split('@')[0],
          name: fullName || email.split('@')[0],
          role: 'customer',
          signup_source: 'checkout',
        },
        app_metadata: {
          role: 'customer',
        },
      })

      if (createError) {
        console.error('User creation error:', createError)
        throw new Error(createError.message)
      }

      userId = newUser.user?.id ?? ''
    }

    // Send magic link so they can access their account / order
    const siteUrl = Deno.env.get('SITE_URL') || 'https://safedrang.com'
    const redirectTo = orderId
      ? `${siteUrl}/account/orders?highlight=${orderId}`
      : `${siteUrl}/account`

    const { error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (otpError) {
      // Non-fatal: account was created, magic link failed
      console.warn('Magic link generation failed:', otpError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser: !existingUser,
        userId,
        message: existingUser
          ? 'Magic link sent to existing account'
          : 'Account created and magic link sent',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('provision-customer error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
