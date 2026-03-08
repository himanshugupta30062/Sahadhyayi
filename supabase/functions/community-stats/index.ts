
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
    // Count actual auth users (service role can access auth.users)
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1, page: 1 })
    
    // The listUsers response doesn't give total easily, so use a direct count
    // Actually we need to count all users - let's query the profiles count + auth users
    const { count: authUserCount, error: authError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Fallback: also try the RPC which counts profiles
    let totalSignups = 0
    if (authError) {
      const { data: rpcData } = await supabase.rpc('get_total_users_count')
      totalSignups = Number(rpcData) || 0
    } else {
      // Use auth.users count via admin API for accurate number
      try {
        // Paginate to count all users
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
        totalSignups = total > 0 ? total : (authUserCount || 0)
      } catch {
        totalSignups = authUserCount || 0
      }
    }

    // Get total website visits
    const { data: visits, error: visitError } = await supabase.rpc('get_website_visit_count')
    if (visitError) throw visitError

    // Get last 24 hours visits
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: last24hCount, error: last24hError } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true })
      .gte('visited_at', twentyFourHoursAgo)

    // Get top countries by visit count
    const { data: countryData, error: countryError } = await supabase
      .from('website_visits')
      .select('country_code')
      .not('country_code', 'is', null)
      .not('country_code', 'eq', 'LOCAL')

    // Aggregate countries manually since we can't GROUP BY via postgrest easily
    const countryCounts: Record<string, number> = {}
    if (countryData) {
      for (const row of countryData) {
        const cc = row.country_code
        if (cc) {
          countryCounts[cc] = (countryCounts[cc] || 0) + 1
        }
      }
    }

    const topCountries = Object.entries(countryCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

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
