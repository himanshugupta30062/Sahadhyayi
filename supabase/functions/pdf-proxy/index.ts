import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Allow-list of trusted upstream hosts for PDF fetches.
const ALLOWED_HOST_SUFFIXES = [
  'gutenberg.org',
  'archive.org',
  'wikisource.org',
  'wikimedia.org',
  'standardebooks.org',
  'openlibrary.org',
  'loc.gov',
  'sahadhyayi.com',
  'supabase.co',
]

// Block private / loopback / link-local IPv4 ranges and IPv6 equivalents.
function isPrivateOrLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0') return true

  // IPv6
  if (h.includes(':')) {
    if (h === '::1' || h === '::') return true
    if (h.startsWith('fc') || h.startsWith('fd')) return true // ULA
    if (h.startsWith('fe80')) return true // link-local
    return true // be conservative — disallow raw IPv6 literals
  }

  // IPv4
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)]
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true // link-local / AWS IMDS
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a >= 224) return true // multicast / reserved
  return false
}

function isHostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some((suffix) => h === suffix || h.endsWith('.' + suffix))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pdfUrl = url.searchParams.get('url')

    if (!pdfUrl) {
      return new Response('Missing url parameter', { status: 400, headers: corsHeaders })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(pdfUrl)
    } catch {
      return new Response('Invalid URL', { status: 400, headers: corsHeaders })
    }

    // Only allow http(s)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return new Response('Unsupported protocol', { status: 400, headers: corsHeaders })
    }

    // Block private/loopback/link-local targets (SSRF protection)
    if (isPrivateOrLoopbackHost(parsedUrl.hostname)) {
      return new Response('Disallowed host', { status: 403, headers: corsHeaders })
    }

    // Allow-list trusted upstream hosts only
    if (!isHostAllowed(parsedUrl.hostname)) {
      return new Response('Host not allowed', { status: 403, headers: corsHeaders })
    }

    const response = await fetch(parsedUrl.toString(), {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sahadhyayi/1.0)',
        'Accept': 'application/pdf, */*',
      },
    })

    // Reject redirects to avoid bypassing the allow-list via 3xx
    if (response.status >= 300 && response.status < 400) {
      return new Response('Redirects not allowed', { status: 403, headers: corsHeaders })
    }

    if (!response.ok) {
      return new Response(`Failed to fetch PDF: ${response.status}`, {
        status: response.status,
        headers: corsHeaders,
      })
    }

    const upstreamType = (response.headers.get('content-type') || '').toLowerCase()
    if (!upstreamType.includes('pdf') && !upstreamType.includes('octet-stream')) {
      return new Response('Upstream is not a PDF', { status: 415, headers: corsHeaders })
    }

    const pdfData = await response.arrayBuffer()

    return new Response(pdfData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('PDF proxy error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
