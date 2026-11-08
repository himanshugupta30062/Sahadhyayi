# Reading DNA rate-limit hardening

The generate-reading-dna Edge Function now distinguishes quota denial from rate-limit infrastructure failure:
- RPC returning false => HTTP 429 with RATE_LIMIT_EXCEEDED.
- RPC error, thrown exception, or non-boolean result => HTTP 503 RATE_LIMIT_UNAVAILABLE.
- Rate-limit errors are logged without exposing internal details to clients.
- Retry-After is supplied for both outcomes.

This prevents Reading DNA generation from bypassing the usage cap when its database-backed limiter is unavailable.