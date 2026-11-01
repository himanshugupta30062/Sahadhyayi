import { createClient } from "npm:@supabase/supabase-js@2.112.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://sahadhyayi.com'

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPlaceholderEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return ['example.com', 'example.org', 'example.net', 'test.com', 'invalid'].includes(domain) ||
    domain.endsWith('.test') || domain.endsWith('.invalid') || domain.endsWith('.example');
}

function escapeHtml(value: unknown): string {
  return String(value ?? 'Reader')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return new Response(JSON.stringify({ error: 'Expected a JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'A valid recipient email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (isPlaceholderEmail(email)) {
      return new Response(JSON.stringify({ error: 'Placeholder email domains are not accepted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = typeof body.user_id === 'string' ? body.user_id.trim() : ''
    if (!isUuid(userId)) {
      return new Response(JSON.stringify({ error: 'A valid registered user is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Welcome email service is missing Supabase environment configuration')
      return new Response(JSON.stringify({ error: 'Welcome email service unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: authLookup, error: authLookupError } = await admin.auth.admin.getUserById(userId)
    const registeredUser = authLookup?.user
    if (authLookupError || !registeredUser || registeredUser.email?.toLowerCase() !== email) {
      return new Response(JSON.stringify({ error: 'Recipient does not match a registered user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // This endpoint is only for signup, not a general-purpose mail relay.
    // Reject older accounts to make it harder to abuse the public function URL.
    const createdAt = registeredUser.created_at ? Date.parse(registeredUser.created_at) : Number.NaN
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Welcome emails are only sent shortly after signup' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: allowed, error: rateLimitError } = await admin.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'send-welcome-email',
      p_max_requests: 1,
      p_window_minutes: 1440,
    })
    if (rateLimitError || typeof allowed !== 'boolean') {
      console.error('Welcome-email rate limit unavailable')
      return new Response(JSON.stringify({ error: 'Welcome email service temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Welcome email already requested recently' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const displayName = escapeHtml(name || 'Reader')

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;">📚 Welcome to Sahadhyayi!</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:0;">Your reading journey starts here</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:36px 30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      
      <p style="font-size:17px;color:#1a1a1a;margin:0 0 16px;">Hi ${displayName},</p>
      
      <p style="font-size:15px;color:#4a4a4a;line-height:1.7;margin:0 0 24px;">
        Thank you for joining <strong>Sahadhyayi</strong> — India's community-driven reading platform! 
        We're thrilled to have you as part of our growing family of book lovers. Here's what you can explore:
      </p>

      <!-- Features Grid -->
      <div style="margin:0 0 28px;">
        
        <div style="display:flex;align-items:flex-start;margin-bottom:20px;">
          <div style="min-width:44px;height:44px;background:#fff7ed;border-radius:10px;text-align:center;line-height:44px;font-size:20px;">📖</div>
          <div style="margin-left:14px;">
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">Curated Book Library</p>
            <p style="font-size:13px;color:#6b6b6b;margin:0;line-height:1.5;">Browse hundreds of books across genres with free PDF access, summaries, and audio overviews.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;margin-bottom:20px;">
          <div style="min-width:44px;height:44px;background:#fef3c7;border-radius:10px;text-align:center;line-height:44px;font-size:20px;">📊</div>
          <div style="margin-left:14px;">
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">Personal Bookshelf & Progress</p>
            <p style="font-size:13px;color:#6b6b6b;margin:0;line-height:1.5;">Track your reading journey — set goals, mark progress, and build your personal bookshelf.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;margin-bottom:20px;">
          <div style="min-width:44px;height:44px;background:#ecfdf5;border-radius:10px;text-align:center;line-height:44px;font-size:20px;">💬</div>
          <div style="margin-left:14px;">
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">Community & Social Feed</p>
            <p style="font-size:13px;color:#6b6b6b;margin:0;line-height:1.5;">Connect with fellow readers, share posts, join reading groups, and chat with friends.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;margin-bottom:20px;">
          <div style="min-width:44px;height:44px;background:#eff6ff;border-radius:10px;text-align:center;line-height:44px;font-size:20px;">✍️</div>
          <div style="margin-left:14px;">
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">Write & Publish Articles</p>
            <p style="font-size:13px;color:#6b6b6b;margin:0;line-height:1.5;">Share your reviews, thoughts, and stories with the community. Get likes, comments, and followers.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;margin-bottom:20px;">
          <div style="min-width:44px;height:44px;background:#fdf2f8;border-radius:10px;text-align:center;line-height:44px;font-size:20px;">🎮</div>
          <div style="margin-left:14px;">
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">Book Quizzes & Gamification</p>
            <p style="font-size:13px;color:#6b6b6b;margin:0;line-height:1.5;">Test your knowledge with book quizzes, earn badges, and climb the leaderboard.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;">
          <div style="min-width:44px;height:44px;background:#f5f3ff;border-radius:10px;text-align:center;line-height:44px;font-size:20px;">🤖</div>
          <div style="margin-left:14px;">
            <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px;">AI Reading Assistant</p>
            <p style="font-size:13px;color:#6b6b6b;margin:0;line-height:1.5;">Get personalized book recommendations, summaries, and answers to your reading questions.</p>
          </div>
        </div>

      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:10px;">
          Start Exploring →
        </a>
      </div>

      <p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin:0;text-align:center;">
        We're building something special together. Welcome aboard! 🎉
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">© 2026 Sahadhyayi · Made with ❤️ for readers</p>
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        <a href="${SITE_URL}" style="color:#f97316;text-decoration:none;">sahadhyayi.com</a>
      </p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL')?.trim() || 'Sahadhyayi <onboarding@resend.dev>',
        to: [email],
        subject: '📚 Welcome to Sahadhyayi — Your Reading Journey Begins!',
        html: htmlContent,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Resend error:', result)
      throw new Error(result.message || 'Failed to send email')
    }

    console.log('Welcome email sent to:', email)

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return new Response(JSON.stringify({ error: 'Welcome email delivery failed. Check the configured sender and Resend delivery status.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
