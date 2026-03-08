
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Count users
    let totalSignups = 0
    try {
      let page = 1
      let total = 0
      let hasMore = true
      while (hasMore) {
        const { data } = await supabase.auth.admin.listUsers({ perPage: 1000, page })
        if (data?.users && data.users.length > 0) {
          total += data.users.length
          if (data.users.length < 1000) hasMore = false
          page++
        } else {
          hasMore = false
        }
      }
      totalSignups = total
    } catch {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      totalSignups = count || 0
    }

    // Total visits
    const { data: visits } = await supabase.rpc('get_website_visit_count')

    // Last 24h visits
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: last24hCount } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true })
      .gte('visited_at', twentyFourHoursAgo)

    // Top countries - use efficient DB function instead of fetching all rows
    const { data: countryData } = await supabase.rpc('get_top_visitor_countries', { limit_count: 15 })

    const topCountries = (countryData || []).map((row: any) => ({
      code: row.country_code,
      count: Number(row.visit_count),
    }))

    const stats = {
      totalSignups,
      totalVisits: Number(visits) || 0,
      last24hVisits: last24hCount || 0,
      topCountries,
      lastUpdated: new Date().toISOString()
    }

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching community stats:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch community statistics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
