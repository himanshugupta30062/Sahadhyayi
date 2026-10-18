import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')?.trim();
    if (!RESEND_API_KEY) {
      console.error('[send-contact-email] Missing RESEND_API_KEY configuration.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_API_KEY is not configured on the server',
          code: 'MISSING_API_KEY',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const recipient = (Deno.env.get('CONTACT_EMAIL_RECIPIENT') || 'gyan@sahadhyayi.com').trim();
    const configuredFrom = (Deno.env.get('CONTACT_EMAIL_FROM') || 'Sahadhyayi Contact <noreply@sahadhyayi.com>').trim();

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON request payload', code: 'INVALID_PAYLOAD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, message, subject: customSubject } = payload || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name is required', code: 'MISSING_NAME' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required', code: 'MISSING_EMAIL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required', code: 'MISSING_MESSAGE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address', code: 'INVALID_EMAIL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (name.trim().length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name must not exceed 100 characters', code: 'NAME_TOO_LONG' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.trim().length > 5000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message must not exceed 5000 characters', code: 'MESSAGE_TOO_LONG' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeMessage = escapeHtml(message.trim()).replace(/\n/g, '<br>');
    const emailSubject = customSubject && typeof customSubject === 'string' && customSubject.trim()
      ? escapeHtml(customSubject.trim())
      : `New Contact Message from ${safeName}`;

    // Safe diagnostic logging (no API keys, no sensitive personal message bodies)
    const recipientDomain = recipient.includes('@') ? recipient.split('@')[1] : 'unknown';
    console.log(`[send-contact-email] Attempting email dispatch to recipient domain: @${recipientDomain}`);

    let fromAddress = configuredFrom;
    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient],
        subject: emailSubject,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
          <hr>
          <p style="color: #888; font-size: 12px;">Sent from Sahadhyayi Contact Form</p>
        `,
        reply_to: email.trim(),
      }),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch (err) {
      console.error('[send-contact-email] Non-JSON response from Resend API:', err);
    }

    console.log(`[send-contact-email] Resend primary attempt HTTP status: ${res.status}`);

    // If custom domain unverified (common 403 or 422 on custom domains), try fallback onboarding@resend.dev sender
    if (!res.ok && (res.status === 403 || res.status === 422) && fromAddress !== 'Sahadhyayi <onboarding@resend.dev>') {
      console.warn(`[send-contact-email] Primary sender '${fromAddress}' rejected (status ${res.status}). Attempting fallback sender onboarding@resend.dev`);
      fromAddress = 'Sahadhyayi <onboarding@resend.dev>';
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          subject: emailSubject,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${safeMessage}</p>
            <hr>
            <p style="color: #888; font-size: 12px;">Sent from Sahadhyayi Contact Form (Fallback Sender)</p>
          `,
          reply_to: email.trim(),
        }),
      });

      try {
        data = await res.json();
      } catch (err) {
        console.error('[send-contact-email] Non-JSON response from Resend fallback attempt:', err);
      }
      console.log(`[send-contact-email] Resend fallback attempt HTTP status: ${res.status}`);
    }

    if (!res.ok) {
      const resendErrorMsg = data?.message || data?.error || `Resend HTTP ${res.status}`;
      console.error(`[send-contact-email] Resend delivery failed [${res.status}]: ${resendErrorMsg}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Resend API error [${res.status}]: ${resendErrorMsg}`,
          details: data?.name || data?.message || null,
          statusCode: res.status,
          code: 'RESEND_DELIVERY_FAILED',
        }),
        {
          status: res.status === 403 ? 403 : res.status === 422 ? 422 : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[send-contact-email] Email delivered successfully. Message ID: ${data?.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        id: data?.id,
        recipient: recipient,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('[send-contact-email] Unhandled server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
