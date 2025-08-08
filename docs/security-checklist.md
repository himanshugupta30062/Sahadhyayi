# Security Acceptance Checklist

- [ ] initializeSecurity() runs once on app mount (verified in console or breakpoint).
- [ ] Responses include CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy headers.
- [ ] Browser devtools show CSP active; violations are reported to `/csp-report`.
- [ ] File upload endpoint rejects disallowed MIME types and files exceeding size limit with `{ error: 'UPLOAD_VALIDATION' }`.
- [ ] Rich-text inputs are sanitized before persistence.
- [ ] `TRUSTED_DOMAINS` list only includes domains actively used by the app.
