import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-universal';
import SEO from '@/components/SEO';
import { TurnstileCaptcha } from '@/components/auth/TurnstileCaptcha';

type VerificationStatus = 'manual' | 'verifying' | 'success' | 'error' | 'already-verified' | 'verified-needs-signin';

function isValidEmailAddress(value: string): boolean {
  if (value.length === 0 || value.length > 254 || value.trim() !== value || /\\s/.test(value)) return false;
  const at = value.indexOf('@');
  if (at <= 0 || at !== value.lastIndexOf('@') || at > 64) return false;
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1 && !domain.includes('..');
}

function getNormalizedErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message.toLowerCase();
  }
  return '';
}

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const infoMessage = typeof location.state?.message === 'string' ? location.state.message : '';
  const { toast } = useToast();
  const emailFromUrl = (searchParams.get('email') || '').trim().toLowerCase();
  const hasLinkToken = Boolean(searchParams.get('token_hash') || searchParams.get('code') || window.location.hash);
  const [status, setStatus] = useState<VerificationStatus>(hasLinkToken ? 'verifying' : 'manual');
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    setEmail(emailFromUrl);
  }, [emailFromUrl]);

  useEffect(() => {
    let cancelled = false;
    const verifyEmailLink = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') || 'email';
      const code = searchParams.get('code');
      const urlError = searchParams.get('error_description') || searchParams.get('error');
      const hash = window.location.hash || '';

      if (!tokenHash && !code && !hash && !urlError) {
        setStatus('manual');
        return;
      }
      setStatus('verifying');
      try {
        if (urlError || hash.includes('error_description')) {
          // Confirmation URLs are single-use and may be opened by mail security
          // scanners before the recipient clicks them. Check for a confirmed
          // session before showing a hard failure.
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!cancelled && session?.user?.email_confirmed_at) {
              setStatus('already-verified');
              setErrorMessage('');
              return;
            }
          } catch {
            // Continue to the recovery path if session lookup is unavailable.
          }

          if (!cancelled) {
            const normalizedError = (urlError || hash).toLowerCase();
            setStatus('error');
            setErrorMessage(
              normalizedError.includes('expired') ||
              normalizedError.includes('otp_expired') ||
              normalizedError.includes('invalid')
                ? 'This link has already been used or expired. Your account may already be verified. Try signing in; if sign-in says your email is not confirmed, request a fresh code and enter it below.'
                : 'We could not complete verification from this link. Try signing in, or enter the newest verification code below.'
            );
          }
          return;
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session && !cancelled) {
            setStatus('success');
            return;
          }
          if (data.user?.email_confirmed_at && !cancelled) {
            setStatus('verified-needs-signin');
            setErrorMessage('');
            return;
          }
        }

        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
          });
          if (error) throw error;
          if (data.session && !cancelled) {
            setStatus('success');
            return;
          }
          if (data.user?.email_confirmed_at && !cancelled) {
            setStatus('verified-needs-signin');
            setErrorMessage('');
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) {
          if (session?.user?.email_confirmed_at) setStatus('already-verified');
          else {
            setStatus('manual');
            setErrorMessage('The link did not complete verification. Enter the one-time code from your email below.');
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;

        // A link may be reused or pre-opened by an email security scanner. If this
        // browser already has a confirmed session, treat the stale link as success.
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!cancelled && session?.user?.email_confirmed_at) {
            setStatus('already-verified');
            setErrorMessage('');
            return;
          }
        } catch {
          // Keep the manual OTP fallback available if session lookup fails.
        }

        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Verification failed. Please enter the email code below.';
          setStatus('manual');
          setErrorMessage(message.toLowerCase().includes('expired') || message.toLowerCase().includes('otp_expired')
            ? 'This link is expired or has already been used. Enter the newest code from your email, or request a new code.'
            : 'We could not verify that link. Enter the one-time code from your email below.');
        }
      }
    };

    void verifyEmailLink();
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'success' && status !== 'already-verified') return;
    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          navigate('/dashboard', { replace: true });
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status, navigate]);

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.replace(/\s/g, '');
    if (!normalizedEmail) {
      setErrorMessage('Enter the email address you used to sign up.');
      return;
    }
    if (!isValidEmailAddress(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    // Supabase email templates can be configured for either six- or eight-digit OTPs.
    if (!/^\d{6,8}$/.test(normalizedOtp)) {
      setErrorMessage('Enter the verification code from your email (6–8 digits).');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedOtp,
        type: 'signup',
      });
      if (error) throw error;
      if (data.session) {
        setStatus('success');
        setErrorMessage('');
        toast({ title: 'Email verified', description: 'Your Sahadhyayi account is ready.' });
      } else if (data.user?.email_confirmed_at) {
        // The OTP is consumed and the address is verified even if this request
        // did not establish a browser session. Do not leave the user on the OTP
        // form where a second submit would only return otp_expired.
        setStatus('verified-needs-signin');
        setErrorMessage('');
        toast({ title: 'Email verified', description: 'Sign in to continue to Sahadhyayi.' });
      } else {
        setErrorMessage('The code was accepted but no session was returned. Please sign in to continue.');
      }
    } catch (err: unknown) {
      const message = getNormalizedErrorMessage(err);
      setErrorMessage(message.includes('expired') || message.includes('otp_expired') || message.includes('one-time token not found')
        ? 'This code has already been used or expired. Use the newest verification email. If you can already sign in, your account may already be verified.'
        : message.includes('invalid') || message.includes('token')
          ? 'That code is incorrect or has already been used. Check the newest email and try again.'
          : 'We could not verify this code. Please try again or request a new one.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmailAddress(normalizedEmail)) {
      setErrorMessage('Enter a valid email address first.');
      return;
    }
    if (!captchaToken) {
      setErrorMessage('Complete the human verification before requesting a new code.');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { captchaToken },
      });
      if (error) throw error;
      setOtp('');
      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      toast({ title: 'New code sent', description: 'Check your inbox and use the newest verification code.' });
    } catch (err: unknown) {
      const message = getNormalizedErrorMessage(err);
      if (message.includes('rate') || message.includes('too many')) {
        setErrorMessage('Please wait a little before requesting another code.');
      } else if (message.includes('captcha') || message.includes('challenge') || message.includes('captcha_token')) {
        // A rejected/expired Turnstile token must not be submitted repeatedly.
        // Reset the widget and require a new successful challenge.
        setCaptchaToken(null);
        setCaptchaResetKey((key) => key + 1);
        setErrorMessage('Human verification expired or was rejected. Complete the challenge again, then request a fresh code.');
      } else {
        setErrorMessage('Could not resend the code. Check the email address and connection, then try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const verified = status === 'success' || status === 'already-verified' || status === 'verified-needs-signin';

  return (
    <>
      <SEO title="Verify Email - Sahadhyayi" description="Verify your email to activate your Sahadhyayi account." canonical="https://sahadhyayi.com/confirm-email" url="https://sahadhyayi.com/confirm-email" />
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7]">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3" aria-label="Sahadhyayi Home">
              <img src="/optimized-assets/site-logo.webp" alt="" aria-hidden="true" className="w-10 h-10" width={40} height={40} />
            </Link>
          </div>
          <Card className="border border-[#E8E2D9] dark:border-[#26302A] shadow-md dark:shadow-none bg-white dark:bg-[#111614] rounded-2xl overflow-hidden">
            {status === 'verifying' && (
              <CardContent className="py-12 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#8F681C] animate-spin mx-auto" aria-hidden="true" />
                <CardTitle className="font-serif text-2xl">Verifying your email…</CardTitle>
                <CardDescription>Please wait while we confirm your email address.</CardDescription>
              </CardContent>
            )}
            {verified && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold">
                    {status === 'success' ? 'Email Verified!' : status === 'already-verified' ? 'Already Verified' : 'Email Verified — Sign In'}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {status === 'verified-needs-signin'
                      ? 'Your email address is confirmed, but this browser is not signed in. Sign in to continue to Sahadhyayi.'
                      : 'Your email is confirmed. Welcome to the Sahadhyayi reading community.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 pt-4">
                  {status === 'verified-needs-signin' ? (
                    <Button onClick={() => navigate('/signin', { replace: true })} className="w-full">
                      Continue to Sign In
                    </Button>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">Redirecting to your dashboard in {countdown} seconds…</p>
                      <Button onClick={() => navigate('/dashboard', { replace: true })} className="w-full">Go to Dashboard</Button>
                    </>
                  )}
                </CardContent>
              </>
            )}
            {!verified && status !== 'verifying' && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mb-4 text-[#8F681C]">
                    {status === 'error' ? <XCircle className="w-6 h-6" aria-hidden="true" /> : <Mail className="w-6 h-6" aria-hidden="true" />}
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold">Verify your email</CardTitle>
                  <CardDescription className="mt-2">For the most reliable verification, enter the code from your newest email below. If an email link says it expired, request a fresh code and enter the newest code here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {infoMessage && <Alert role="status" className="border-amber-200 bg-amber-50 text-amber-950"><AlertDescription>{infoMessage}</AlertDescription></Alert>}
                  {errorMessage && <Alert variant="destructive" role="alert"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verification-email">Email address</Label>
                      <Input id="verification-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verification-otp">Verification code</Label>
                      <Input id="verification-otp" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter code from email" />
                    </div>
                    <Button type="submit" disabled={busy} className="w-full h-11">{busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : 'Verify email'}</Button>
                  </form>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">To protect accounts from automated abuse, verify before requesting another email.</p>
                    <TurnstileCaptcha key={captchaResetKey} action="signup" onTokenChange={setCaptchaToken} />
                  </div>
                  <Button type="button" variant="outline" disabled={busy || !captchaToken} onClick={handleResendCode} className="w-full">
                    {busy ? 'Please wait…' : 'Resend verification code'}
                  </Button>
                  <div className="text-center pt-2">
                    <Link to="/signin" className="text-sm text-muted-foreground hover:text-foreground">Back to sign in</Link>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmEmail;
