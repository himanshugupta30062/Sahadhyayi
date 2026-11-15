import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { checkRateLimit, getClientIp } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allow-list of trusted upstream hosts for PDF fetches.
// Only exact domain matches or subdomains of these are allowed.
const ALLOWED_HOST_SUFFIXES = [
  "gutenberg.org",
  "archive.org",
  "wikisource.org",
  "wikimedia.org",
  "standardebooks.org",
  "openlibrary.org",
  "loc.gov",
  "sahadhyayi.com",
  "supabase.co",
  "oapen.org",
  "google.com",
  "googleusercontent.com",
  "ncert.nic.in",
  "gitapress.org",
  "umn.edu",
  "github.io",
  "githubusercontent.com",
] as const;

// Explicitly blocked TLDs and patterns that are commonly abused for SSRF
const BLOCKED_HOST_PATTERNS = [
  // Cloud metadata services
  "metadata.google.internal",
  "metadata.azure.com",
  "metadata",
  // Local development
  "localhost",
  "local",
  "test",
  "internal",
  // Common internal domains
  "corp",
  "dev",
  "stage",
  "staging",
  "prod",
  "production",
] as const;

// Maximum response size to prevent memory exhaustion (50MB)
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024;
// Maximum redirect hops
const MAX_REDIRECTS = 5;
// Request timeout per hop
const FETCH_TIMEOUT_MS = 30000;

/**
 * Check if hostname is a private/loopback/link-local address (SSRF protection)
 */
function isPrivateOrLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0") return true;

  // IPv6 literals
  if (h.includes(":")) {
    if (h === "::1" || h === "::") return true;
    if (h.startsWith("fc") || h.startsWith("fd")) return true; // ULA
    if (h.startsWith("fe80")) return true; // link-local
    return true; // be conservative — disallow raw IPv6 literals
  }

  // IPv4 literals
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number.parseInt(m[1], 10), Number.parseInt(m[2], 10)];
    if (a === 10) return true;                    // 10.0.0.0/8
    if (a === 127) return true;                   // 127.0.0.0/8
    if (a === 0) return true;                     // 0.0.0.0/8
    if (a === 169 && b === 254) return true;      // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;      // 192.168.0.0/16
    if (a >= 224) return true;                    // multicast/reserved
  }
  return false;
}

/**
 * Check if hostname matches blocked patterns
 */
function isHostBlocked(hostname: string): boolean {
  const h = hostname.toLowerCase();
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (h === pattern || h.endsWith("." + pattern) || h.includes("." + pattern + ".")) {
      return true;
    }
  }
  return false;
}

/**
 * Strict host validation - only allow explicitly allowed hosts
 */
function isHostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();

  // First check blocked patterns
  if (isHostBlocked(h)) return false;

  // Then check allowed suffixes
  return ALLOWED_HOST_SUFFIXES.some((suffix) => h === suffix || h.endsWith("." + suffix));
}

/**
 * Validate URL more strictly
 */
function validateUrl(url: URL): { valid: boolean; error?: string } {
  // Only HTTPS allowed (HTTP is a security risk)
  if (url.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are allowed" };
  }

  // No credentials in URL
  if (url.username || url.password) {
    return { valid: false, error: "URLs with credentials are not allowed" };
  }

  // No fragment
  if (url.hash) {
    return { valid: false, error: "URL fragments are not allowed" };
  }

  // Hostname must be present
  if (!url.hostname) {
    return { valid: false, error: "Missing hostname" };
  }

  // Hostname length check
  if (url.hostname.length > 253) {
    return { valid: false, error: "Hostname too long" };
  }

  // Port restrictions - only standard ports
  if (url.port) {
    const port = Number.parseInt(url.port, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      return { valid: false, error: "Invalid port" };
    }
    // Only allow standard HTTP/HTTPS ports
    if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) {
      return { valid: false, error: "Non-standard ports are not allowed" };
    }
  }

  return { valid: true };
}

/**
 * Get user identifier for rate limiting (user ID if authenticated, else IP)
 */
async function getRateLimitIdentifier(req: Request, supabase: any): Promise<string> {
  // Try to get user ID from auth header
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) return `user:${user.id}`;
      } catch {
        // Fall through to IP-based limiting
      }
    }
  }
  // Fallback to IP
  return `ip:${getClientIp(req)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting per user/IP
    const identifier = await getRateLimitIdentifier(req, supabase);
    const rateCheck = await checkRateLimit(supabase, identifier, "pdf-proxy", 30, 5); // 30 requests per 5 minutes

    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please wait before fetching more PDFs.",
        retryAfter: rateCheck.status === 429 ? 300 : 30,
      }), {
        status: rateCheck.status,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rateCheck.status === 429 ? 300 : 30) },
      });
    }

    const requestUrl = new URL(req.url);
    const pdfUrl = requestUrl.searchParams.get("url");

    if (!pdfUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(pdfUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strict URL validation
    const urlValidation = validateUrl(parsedUrl);
    if (!urlValidation.valid) {
      return new Response(JSON.stringify({ error: urlValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block private/loopback/link-local targets (SSRF protection)
    if (isPrivateOrLoopbackHost(parsedUrl.hostname)) {
      return new Response(JSON.stringify({ error: "Disallowed host: private or loopback address" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow-list trusted upstream hosts only
    if (!isHostAllowed(parsedUrl.hostname)) {
      return new Response(JSON.stringify({ error: "Host not allowed: domain not in allow-list" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Follow redirects with validation at each hop
    let currentUrl = parsedUrl;
    let response: Response | null = null;
    let totalBytes = 0;
    const contentLengthHeader = req.headers.get("content-length");

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      // Validate each redirect destination
      const redirectValidation = validateUrl(currentUrl);
      if (!redirectValidation.valid) {
        return new Response(JSON.stringify({ error: `Redirect validation failed: ${redirectValidation.error}` }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (isPrivateOrLoopbackHost(currentUrl.hostname) || !isHostAllowed(currentUrl.hostname)) {
        return new Response(JSON.stringify({ error: "Redirect destination not allowed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch with timeout and manual redirect handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        response = await fetch(currentUrl.toString(), {
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Sahadhyayi/1.0; +https://sahadhyayi.com)",
            "Accept": "application/pdf, application/epub+zip, application/octet-stream;q=0.9, */*;q=0.8",
            "Range": req.headers.get("range") || "", // Support range requests
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Check response size limit via Content-Length header
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        const size = Number.parseInt(contentLength, 10);
        if (!Number.isNaN(size) && size > MAX_RESPONSE_SIZE) {
          return new Response(JSON.stringify({ error: "Response too large" }), {
            status: 413,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        totalBytes = size;
      }

      // Handle redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === MAX_REDIRECTS) {
          return new Response(JSON.stringify({ error: "Too many redirects or missing location header" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        try {
          currentUrl = new URL(location, currentUrl);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid redirect destination" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        continue;
      }

      break;
    }

    if (!response) {
      return new Response(JSON.stringify({ error: "PDF source did not respond" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch PDF: ${response.status}` }), {
        status: response.status >= 500 ? 502 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate content type
    const requestedFormat = (requestUrl.searchParams.get("format") || "").toLowerCase();
    const pathFormat = currentUrl.pathname.toLowerCase().endsWith(".epub") ? "epub" : "pdf";
    const fileFormat = requestedFormat || pathFormat;

    if (fileFormat !== "pdf" && fileFormat !== "epub") {
      return new Response(JSON.stringify({ error: "Unsupported book format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstreamType = (response.headers.get("content-type") || "").toLowerCase();
    const isPdf = upstreamType.includes("pdf") || upstreamType.includes("octet-stream");
    const isEpub = upstreamType.includes("epub") || upstreamType.includes("zip") || upstreamType.includes("octet-stream");

    // Allow octet-stream but verify magic bytes for PDFs
    if (fileFormat === "pdf" && !isPdf && !upstreamType.includes("octet-stream")) {
      return new Response(JSON.stringify({ error: "Upstream is not a valid PDF file" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fileFormat === "epub" && !isEpub) {
      return new Response(JSON.stringify({ error: "Upstream is not a valid EPUB file" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize filename
    const requestedFilename = requestUrl.searchParams.get("filename") || `sahadhyayi-book.${fileFormat}`;
    const safeFilename = requestedFilename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 120);
    const filename = safeFilename.toLowerCase().endsWith(`.${fileFormat}`)
      ? safeFilename
      : `${safeFilename || "sahadhyayi-book"}.${fileFormat}`;
    const shouldDownload = requestUrl.searchParams.get("download") === "1";

    // Stream the response with size limiting
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error("No response body"));
          return;
        }

        let bytesRead = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            bytesRead += value.length;
            if (bytesRead > MAX_RESPONSE_SIZE) {
              controller.error(new Error("Response size limit exceeded"));
              break;
            }

            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": fileFormat === "pdf" ? "application/pdf" : "application/epub+zip",
        "Content-Disposition": shouldDownload
          ? `attachment; filename="${filename}"`
          : "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});