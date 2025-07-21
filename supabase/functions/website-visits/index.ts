import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VisitData {
  userAgent?: string;
  page?: string;
}

// Function to get country code from IP using ipapi.co (free service)
async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'LOCAL'; // Local development
    }

    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      headers: {
        'User-Agent': 'Sahadhyayi-Analytics/1.0'
      }
    });
    
    if (response.ok) {
      const country = await response.text();
      return country.trim() || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting country from IP:', error);
    return null;
  }
}

// Function to extract real IP address from request
function getRealIP(request: Request): string {
  // Try various headers that might contain the real IP
  const headers = request.headers;
  
  // Cloudflare
  const cfConnectingIP = headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Other common headers
  const xForwardedFor = headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIP = headers.get('X-Real-IP');
  if (xRealIP) return xRealIP;
  
  const xClientIP = headers.get('X-Client-IP');
  if (xClientIP) return xClientIP;
  
  // Fallback - this might be the proxy IP
  return '0.0.0.0';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body: VisitData = await req.json();
    
    // Extract IP address from request
    const ipAddress = getRealIP(req);
    console.log('Extracted IP address:', ipAddress);
    
    // Get country code from IP
    const countryCode = await getCountryFromIP(ipAddress);
    console.log('Determined country code:', countryCode);
    
    // Record the visit using the updated function
    const { error } = await supabase.rpc('record_website_visit', {
      ip_addr: ipAddress === '0.0.0.0' ? null : ipAddress,
      user_agent_string: body.userAgent || null,
      page: body.page || null,
      country_code: countryCode
    });

    if (error) {
      console.error('Error recording visit:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to record visit' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Visit recorded successfully:', {
      ip: ipAddress,
      country: countryCode,
      page: body.page,
      userAgent: body.userAgent
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        ip: ipAddress,
        country: countryCode 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
