
# Fix Google Analytics CSP Blocking Issue

## Problem Summary
The Content Security Policy (CSP) in `index.html` is blocking the Google Tag Manager script (`https://www.googletagmanager.com/gtag/js`). This is causing script loading failures that may prevent the site from fully loading on `sahadhyayi.com`.

## Root Cause
Line 77 of `index.html` has a CSP that doesn't include Google's domains in the `script-src` directive.

## Solution

### Step 1: Update CSP in index.html
Modify the Content-Security-Policy meta tag to include Google Analytics domains:

**Current:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://static.cloudflareinsights.com
```

**Updated:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.google-analytics.com
```

Also update the `connect-src` directive to allow Google Analytics API calls:

**Current:**
```
connect-src 'self' https://*.supabase.co ws: wss:
```

**Updated:**
```
connect-src 'self' https://*.supabase.co ws: wss: https://www.google-analytics.com https://analytics.google.com
```

### Step 2: Update 404.html (optional but recommended)
The `404.html` file also loads Google Tag Manager but has no CSP, so it should work. However, for consistency, consider removing the gtag script from the 404 page since it's just a redirect page.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `index.html` (line 77) | Update CSP meta tag to allow Google domains |

### Complete Updated CSP

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co ws: wss: https://www.google-analytics.com https://analytics.google.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.google-analytics.com">
```

### Alternative: Remove CSP Meta Tag
Since the comment on line 76 states "CSP is normally set via HTTP headers in server.js", and this meta tag is just a "fallback for static preview only", you could also consider removing the CSP meta tag entirely and relying solely on the server-side CSP headers (which presumably already allow Google Analytics).

---

## Expected Outcome
After this fix:
1. Google Tag Manager script will load without CSP violations
2. No JavaScript errors from blocked scripts
3. The React app should initialize properly
4. The loader should hide once the app loads

## Note
If the site still doesn't load after this fix, the issue is likely DNS-related (as discussed earlier) rather than code-related. This fix ensures that once the correct HTML is served, Google Analytics won't cause blocking errors.
