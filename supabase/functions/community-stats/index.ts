
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Count registered users from the profiles table
    const { count: signups, error: signupError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (signupError) throw signupError

    // Count recorded website visits
    const { count: visits, error: visitError } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true })

    if (visitError) throw visitError

    const stats = {
      totalSignups: signups ?? 0,
      totalVisits: visits ?? 0,
      lastUpdated: new Date().toISOString()
    }

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching community stats:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch community statistics'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
