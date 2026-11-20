import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { checkRateLimit, getClientIp } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, Content-Disposition, ETag, Last-Modified",
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
  "hariomgroup.org",
] as const;

// Explicitly blocked TLDs and patterns that are commonly abused for SSRF
const BLOCKED_HOST_PATTERNS = [
  "metadata.google.internal",
  "metadata.azure.com",
  "metadata",
  "localhost",
  "local",
  "test",
  "internal",
  "corp",
  "dev",
  "stage",
  "staging",
  "prod",
  "production",
] as const;

// Limit each streamed response/chunk, not the total size of a range-capable PDF.
// PDF.js requests byte ranges, allowing large books to be read without buffering
// the complete file in a single Edge Function invocation.
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 30000;

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0") return true;

  if (h.includes(":")) {
    if (h === "::1" || h === "::") return true;
    if (h.startsWith("fc") || h.startsWith("fd")) return true;
    if (h.startsWith("fe80")) return true;
    return true;
  }

  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number.parseInt(m[1], 10), Number.parseInt(m[2], 10)];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
  }
  return false;
}

function isHostBlocked(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return BLOCKED_HOST_PATTERNS.some(
    (pattern) => h === pattern || h.endsWith("." + pattern) || h.includes("." + pattern + "."),
  );
}

function isHostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (isHostBlocked(h)) return false;
  if (h.endsWith(".edu")) return true;
  return ALLOWED_HOST_SUFFIXES.some((suffix) => h === suffix || h.endsWith("." + suffix));
}

function validateUrl(url: URL): { valid: boolean; error?: string } {
  if (url.protocol !== "https:") return { valid: false, error: "Only HTTPS URLs are allowed" };
  if (url.username || url.password) return { valid: false, error: "URLs with credentials are not allowed" };
  if (url.hash) return { valid: false, error: "URL fragments are not allowed" };
  if (!url.hostname) return { valid: false, error: "Missing hostname" };
  if (url.hostname.length > 253) return { valid: false, error: "Hostname too long" };

  if (url.port) {
    const port = Number.parseInt(url.port, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) return { valid: false, error: "Invalid port" };
    if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) {
      return { valid: false, error: "Non-standard ports are not allowed" };
    }
  }
  return { valid: true };
}

async function getRateLimitIdentifier(req: Request, supabase: any): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) return `user:${user.id}`;
      } catch {
        // Fall through to IP-based limiting.
      }
    }
  }
  return `ip:${getClientIp(req)}`;
}

function jsonError(message: string, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "HEAD") return jsonError("Method not allowed", 405, { Allow: "GET, HEAD, OPTIONS" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) return jsonError("Service not configured", 503);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const identifier = await getRateLimitIdentifier(req, supabase);
    const rateCheck = await checkRateLimit(supabase, identifier, "pdf-proxy", 30, 5);
    if (!rateCheck.allowed) {
      return jsonError("Rate limit exceeded. Please wait before fetching more PDFs.", rateCheck.status, {
        "Retry-After": String(rateCheck.status === 429 ? 300 : 30),
      });
    }

    const requestUrl = new URL(req.url);
    const pdfUrl = requestUrl.searchParams.get("url");
    if (!pdfUrl) return jsonError("Missing url parameter", 400);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(pdfUrl);
    } catch {
      return jsonError("Invalid URL", 400);
    }

    const urlValidation = validateUrl(parsedUrl);
    if (!urlValidation.valid) return jsonError(urlValidation.error || "Invalid URL", 400);
    if (isPrivateOrLoopbackHost(parsedUrl.hostname)) return jsonError("Disallowed host: private or loopback address", 403);
    if (!isHostAllowed(parsedUrl.hostname)) return jsonError("Host not allowed: domain not in allow-list", 403);

    const requestedRange = req.headers.get("range");
    let currentUrl = parsedUrl;
    let response: Response | null = null;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const redirectValidation = validateUrl(currentUrl);
      if (!redirectValidation.valid) {
        return jsonError(`Redirect validation failed: ${redirectValidation.error}`, 403);
      }
      if (isPrivateOrLoopbackHost(currentUrl.hostname) || !isHostAllowed(currentUrl.hostname)) {
        return jsonError("Redirect destination not allowed", 403);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const upstreamHeaders = new Headers({
          "User-Agent": "Mozilla/5.0 (compatible; Sahadhyayi/1.0; +https://sahadhyayi.com)",
          "Accept": "application/pdf, application/epub+zip, application/octet-stream;q=0.9, */*;q=0.8",
        });
        if (requestedRange) upstreamHeaders.set("Range", requestedRange);

        response = await fetch(currentUrl.toString(), {
          method: req.method,
          redirect: "manual",
          headers: upstreamHeaders,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === MAX_REDIRECTS) {
          return jsonError("Too many redirects or missing location header", 502);
        }
        try {
          currentUrl = new URL(location, currentUrl);
        } catch {
          return jsonError("Invalid redirect destination", 502);
        }
        continue;
      }
      break;
    }

    if (!response) return jsonError("PDF source did not respond", 502);
    if (!response.ok && response.status !== 416) {
      return jsonError(`Failed to fetch PDF: ${response.status}`, response.status >= 500 ? 502 : response.status);
    }

    const contentLength = response.headers.get("content-length");
    const parsedLength = contentLength ? Number.parseInt(contentLength, 10) : 0;

    // If an upstream host ignores a byte-range request and returns 200 OK,
    // allow streaming if the file is within MAX_RESPONSE_SIZE.
    // If it exceeds MAX_RESPONSE_SIZE and does not support range requests, reject safely.
    if (requestedRange && response.status === 200 && parsedLength > MAX_RESPONSE_SIZE) {
      return jsonError("The PDF source does not support byte-range streaming and exceeds size limits.", 413);
    }

    if (contentLength && !Number.isNaN(parsedLength) && parsedLength > MAX_RESPONSE_SIZE && response.status !== 206) {
      return jsonError("Response chunk too large", 413);
    }

    const requestedFormat = (requestUrl.searchParams.get("format") || "").toLowerCase();
    const pathFormat = currentUrl.pathname.toLowerCase().endsWith(".epub") ? "epub" : "pdf";
    const fileFormat = requestedFormat || pathFormat;
    if (fileFormat !== "pdf" && fileFormat !== "epub") return jsonError("Unsupported book format", 400);

    const upstreamType = (response.headers.get("content-type") || "").toLowerCase();
    const isPdf = upstreamType.includes("pdf") || upstreamType.includes("octet-stream");
    const isEpub = upstreamType.includes("epub") || upstreamType.includes("zip") || upstreamType.includes("octet-stream");
    if (fileFormat === "pdf" && !isPdf) return jsonError("Upstream is not a valid PDF file", 415);
    if (fileFormat === "epub" && !isEpub) return jsonError("Upstream is not a valid EPUB file", 415);

    const requestedFilename = requestUrl.searchParams.get("filename") || `sahadhyayi-book.${fileFormat}`;
    const safeFilename = requestedFilename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 120);
    const filename = safeFilename.toLowerCase().endsWith(`.${fileFormat}`)
      ? safeFilename
      : `${safeFilename || "sahadhyayi-book"}.${fileFormat}`;
    const shouldDownload = requestUrl.searchParams.get("download") === "1";

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set("Content-Type", fileFormat === "pdf" ? "application/pdf" : "application/epub+zip");
    responseHeaders.set("Content-Disposition", shouldDownload ? `attachment; filename="${filename}"` : "inline");
    responseHeaders.set("Cache-Control", "public, max-age=3600");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("Referrer-Policy", "no-referrer");

    // Preserve byte-range semantics so PDF.js can request only the portions it needs.
    // In particular, 206 + Content-Range must not be rewritten to 200.
    const passthroughHeaders = ["accept-ranges", "content-range", "content-length", "etag", "last-modified"];
    for (const header of passthroughHeaders) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }
    if (!responseHeaders.has("Accept-Ranges")) responseHeaders.set("Accept-Ranges", "bytes");

    let responseBody: ReadableStream<Uint8Array> | null = null;
    if (req.method !== "HEAD" && response.body) {
      const reader = response.body.getReader();
      let bytesStreamed = 0;
      responseBody = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              reader.releaseLock();
              return;
            }
            // Keep a hard cap even when an upstream omits Content-Length.
            // For byte-range responses this counts only the requested chunk.
            bytesStreamed += value.byteLength;
            if (bytesStreamed > MAX_RESPONSE_SIZE) {
              await reader.cancel("PDF response chunk exceeded the configured limit");
              controller.error(new Error("Response chunk too large"));
              return;
            }
            controller.enqueue(value);
          } catch (error) {
            controller.error(error);
          }
        },
        async cancel(reason) {
          await reader.cancel(reason);
        },
      });
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return jsonError(error instanceof Error && error.name === "AbortError" ? "PDF source timed out" : "Internal server error", 500);
  }
});
