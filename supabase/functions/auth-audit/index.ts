import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const allowedEvents = new Set([
  'sign_in_attempted', 'sign_in_succeeded', 'sign_in_failed',
  'signup_submitted', 'signup_failed', 'account_created',
])
const allowedMethods = new Set(['password', 'oauth', 'unknown'])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) return new Response(JSON.stringify({ error: 'Audit unavailable' }), { status: 503, headers: corsHeaders })

    const body = await req.json().catch(() => null)
    if (!body || !allowedEvents.has(body.event_type)) return new Response(JSON.stringify({ error: 'Invalid event' }), { status: 400, headers: corsHeaders })
    const authMethod = allowedMethods.has(body.auth_method) ? body.auth_method : 'unknown'
    const requiresIdentity = body.event_type === 'sign_in_succeeded' || body.event_type === 'account_created'
    let userId: string | null = null

    if (requiresIdentity) {
      const authorization = req.headers.get('authorization') || ''
      if (!authorization.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Authenticated session required' }), { status: 401, headers: corsHeaders })
      const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
      const { data, error } = await admin.auth.getUser(authorization.slice(7).trim())
      if (error || !data.user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders })
      userId = data.user.id
      const claimedUserId = typeof body.user_id === 'string' ? body.user_id : null
      if (claimedUserId && claimedUserId !== userId) return new Response(JSON.stringify({ error: 'Identity mismatch' }), { status: 403, headers: corsHeaders })
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const errorCode = typeof body.error_code === 'string' && /^[a-z0-9_.-]{1,80}$/i.test(body.error_code)
      ? body.error_code : null
    const { error } = await admin.from('auth_audit_events').insert({
      event_type: body.event_type,
      auth_method: authMethod,
      user_id: userId,
      error_code: requiresIdentity ? null : errorCode,
    })
    if (error) {
      console.error('Auth audit insert failed', { code: error.code })
      return new Response(JSON.stringify({ error: 'Could not record audit event' }), { status: 500, headers: corsHeaders })
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('Auth audit request failed', { name: error instanceof Error ? error.name : 'UnknownError' })
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders })
  }
})
