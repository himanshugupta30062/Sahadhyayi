# Rate-limit fail-closed behavior

The shared Supabase Edge Function rate limiter now denies requests when its RPC, identifier, endpoint, or Supabase configuration is unavailable. It returns HTTP 503 with `RATE_LIMIT_UNAVAILABLE` (and a short Retry-After) rather than treating an infrastructure failure as permission to proceed.

## Rationale
A fail-open limiter can silently disable abuse controls during database incidents. This is especially risky for AI generation, email, upload, and other costly endpoints.

## Rollout notes
- This behavior may temporarily reject protected requests during Supabase rate-limit outages.
- Monitor 503 `RATE_LIMIT_UNAVAILABLE` responses and database RPC health.
- Do not retry expensive operations automatically without bounded backoff.
- Review endpoint callers for graceful 503 handling.
- Unit tests should cover allowed, 429 limited, RPC error, thrown exception, missing identifier, and missing Supabase configuration.
