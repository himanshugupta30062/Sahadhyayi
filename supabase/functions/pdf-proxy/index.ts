import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(pdfUrl)
    } catch {
      return new Response('Invalid URL', { status: 400, headers: corsHeaders })
    }

    // Fetch the PDF from the external source (server-side, no CORS issues)
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sahadhyayi/1.0)',
        'Accept': 'application/pdf, */*',
      },
    })

    if (!response.ok) {
      return new Response(`Failed to fetch PDF: ${response.status}`, {
        status: response.status,
        headers: corsHeaders,
      })
    }

    const contentType = response.headers.get('content-type') || 'application/pdf'
    const pdfData = await response.arrayBuffer()

    return new Response(pdfData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('PDF proxy error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
