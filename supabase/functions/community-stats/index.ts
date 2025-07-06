
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    // For now, we'll return mock data that simulates real statistics
    // In production, these would come from actual database queries
    const baseSignups = 15847;
    const baseVisits = 125000;
    
    // Simulate some growth - add random increments based on time
    const now = Date.now();
    const daysSinceEpoch = Math.floor(now / (1000 * 60 * 60 * 24));
    const signupIncrement = Math.floor(daysSinceEpoch * 2.5); // ~2-3 signups per day
    const visitIncrement = Math.floor(daysSinceEpoch * 45); // ~40-50 visits per day
    
    const stats = {
      totalSignups: baseSignups + signupIncrement,
      totalVisits: baseVisits + visitIncrement,
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error fetching community stats:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch community statistics',
      totalSignups: 15847,  // fallback values
      totalVisits: 125000
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
