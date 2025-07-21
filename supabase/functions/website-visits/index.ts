
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VisitData {
  userAgent?: string;
  page?: string;
}

interface ParsedUserAgent {
  browser: string;
  version: string;
  os: string;
  device: string;
}

// Function to parse user agent string into readable format
function parseUserAgent(userAgent: string): ParsedUserAgent {
  let browser = 'Unknown';
  let version = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1].split('.')[0] : 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1].split('.')[0] : 'Unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    version = match ? match[1].split('.')[0] : 'Unknown';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    version = match ? match[1].split('.')[0] : 'Unknown';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
    const match = userAgent.match(/(Opera|OPR)\/([0-9.]+)/);
    version = match ? match[2].split('.')[0] : 'Unknown';
  }

  // Operating System detection
  if (userAgent.includes('Windows NT 10.0')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows NT 6.3')) {
    os = 'Windows 8.1';
  } else if (userAgent.includes('Windows NT 6.2')) {
    os = 'Windows 8';
  } else if (userAgent.includes('Windows NT 6.1')) {
    os = 'Windows 7';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X ([0-9_]+)/);
    if (match) {
      const macVersion = match[1].replace(/_/g, '.');
      os = `macOS ${macVersion}`;
    } else {
      os = 'macOS';
    }
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android ([0-9.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
    device = 'Mobile';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
    device = 'Tablet';
  }

  // Device type detection
  if (userAgent.includes('Mobile') && !userAgent.includes('iPad')) {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    device = 'Tablet';
  }

  return { browser, version, os, device };
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
    
    // Parse user agent for better display
    const parsedUA = body.userAgent ? parseUserAgent(body.userAgent) : null;
    const userAgentDisplay = parsedUA 
      ? `${parsedUA.browser} ${parsedUA.version} on ${parsedUA.os} (${parsedUA.device})`
      : body.userAgent || 'Unknown';
    
    console.log('Parsed User Agent:', userAgentDisplay);
    
    // Record the visit using the updated function
    const { error } = await supabase.rpc('record_website_visit', {
      ip_addr: ipAddress === '0.0.0.0' ? null : ipAddress,
      user_agent_string: userAgentDisplay,
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
      userAgent: userAgentDisplay
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        ip: ipAddress,
        country: countryCode,
        userAgent: userAgentDisplay
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
