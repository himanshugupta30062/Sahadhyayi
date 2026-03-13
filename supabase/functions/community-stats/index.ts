
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

    // Top countries
    const { data: countryData } = await supabase.rpc('get_top_visitor_countries', { limit_count: 15 })

    const topCountries = (countryData || []).map((row: any) => ({
      code: row.country_code,
      count: Number(row.visit_count),
    }))

    // Fetch device/browser/OS/city breakdowns from website_visits
    // We'll query the last 10,000 rows for breakdown stats
    const { data: visitRows } = await supabase
      .from('website_visits')
      .select('browser, os, device_type, city, region')
      .not('browser', 'is', null)
      .order('visited_at', { ascending: false })
      .limit(10000)

    const browserCounts: Record<string, number> = {}
    const osCounts: Record<string, number> = {}
    const deviceCounts: Record<string, number> = {}
    const cityCounts: Record<string, number> = {}

    for (const row of (visitRows || [])) {
      if (row.browser) browserCounts[row.browser] = (browserCounts[row.browser] || 0) + 1
      if (row.os) osCounts[row.os] = (osCounts[row.os] || 0) + 1
      if (row.device_type) deviceCounts[row.device_type] = (deviceCounts[row.device_type] || 0) + 1
      if (row.city && row.city !== 'Unknown') {
        const label = row.region ? `${row.city}, ${row.region}` : row.city
        cityCounts[label] = (cityCounts[label] || 0) + 1
      }
    }

    const toSorted = (obj: Record<string, number>, limit = 10) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }))

    const stats = {
      totalSignups,
      totalVisits: Number(visits) || 0,
      last24hVisits: last24hCount || 0,
      topCountries,
      topBrowsers: toSorted(browserCounts, 6),
      topOS: toSorted(osCounts, 6),
      deviceTypes: toSorted(deviceCounts, 5),
      topCities: toSorted(cityCounts, 10),
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
