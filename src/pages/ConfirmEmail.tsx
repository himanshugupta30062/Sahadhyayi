import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-universal';
import SEO from '@/components/SEO';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'already-verified';

const ConfirmEmail = () => {
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    let isCancelled = false;

    const verifyEmail = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') || 'email';
        const code = searchParams.get('code');
        const urlError = searchParams.get('error_description') || searchParams.get('error');

        // Check if error was passed in URL (e.g. from expired Supabase link)
        if (urlError || hash.includes('error_description')) {
          const rawDesc =
            searchParams.get('error_description') ||
            (hash.includes('error_description=')
              ? decodeURIComponent(hash.split('error_description=')[1].split('&')[0].replace(/\+/g, ' '))
              : 'The verification link is invalid or has expired.');
          if (!isCancelled) {
            setStatus('error');
            setErrorMessage(rawDesc);
          }
          return;
        }

        // 1. If PKCE code is provided
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!isCancelled) {
              setStatus('error');
              setErrorMessage(error.message || 'Verification link expired or invalid.');
            }
            return;
          }
          if (data.session && !isCancelled) {
            setStatus('success');
            return;
          }
        }

        // 2. If token_hash is provided
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (error) {
            if (error.message.toLowerCase().includes('expired')) {
              setErrorMessage('This confirmation link has expired. Please sign in or request a new one.');
            } else if (error.message.toLowerCase().includes('already verified')) {
              if (!isCancelled) setStatus('already-verified');
              return;
            } else {
              setErrorMessage(error.message || 'Failed to verify email. Please try again.');
            }
            if (!isCancelled) setStatus('error');
            return;
          }

          if (data.session && !isCancelled) {
            setStatus('success');
            return;
          }
        }

        // 3. Fallback: check current session to see if already verified
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email_confirmed_at) {
          if (!isCancelled) setStatus('already-verified');
          return;
        }

        // If neither token nor verified session exists
        if (!tokenHash && !code) {
          if (!isCancelled) {
            setStatus('error');
            setErrorMessage('Invalid or missing confirmation link. Please check the email you received.');
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err?.message || 'An unexpected error occurred during verification.');
        }
      }
    };

    verifyEmail();

    return () => {
      isCancelled = true;
    };
  }, [searchParams]);

  // Countdown and redirect on success
  useEffect(() => {
    if (status === 'success' || status === 'already-verified') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const handleResendEmail = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast({
          title: 'Email Required',
          description: 'Please sign in or register to request a new verification email.',
          variant: 'destructive',
        });
        navigate('/signin');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: `A new confirmation link was sent to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Could not send email',
        description: error.message || 'Failed to resend confirmation email.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <SEO
        title="Confirm Email - Sahadhyayi"
        description="Confirm your email to activate your Sahadhyayi account."
        canonical="https://sahadhyayi.com/confirm-email"
        url="https://sahadhyayi.com/confirm-email"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-200">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3" aria-label="Sahadhyayi Home">
              <img
                src="/optimized-assets/site-logo.webp"
                alt=""
                aria-hidden="true"
                className="w-10 h-10"
                width={40}
                height={40}
              />
            </Link>
          </div>

          <Card className="border border-[#E8E2D9] dark:border-[#26302A] shadow-md dark:shadow-none bg-white dark:bg-[#111614] rounded-2xl overflow-hidden">
            {status === 'verifying' && (
              <CardContent className="py-12 text-center space-y-4">
                <Loader2
                  className="w-10 h-10 text-[#8F681C] dark:text-[#D5B16D] animate-spin mx-auto"
                  aria-hidden="true"
                />
                <div>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Verifying Email
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Please wait while we verify your email address...
                  </CardDescription>
                </div>
              </CardContent>
            )}

            {status === 'success' && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Email Confirmed!
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Your account has been successfully verified. Welcome to the Sahadhyayi reading community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Redirecting to your dashboard in {countdown} seconds...
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20"
                  >
                    Go to Dashboard Now
                  </Button>
                </CardContent>
              </>
            )}

            {status === 'already-verified' && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Already Verified
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Your email address has already been confirmed. You are ready to explore and read.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Redirecting to your dashboard in {countdown} seconds...
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20"
                  >
                    Go to Dashboard Now
                  </Button>
                </CardContent>
              </>
            )}

            {status === 'error' && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/60 border border-red-500/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                    <XCircle className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Verification Failed
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    We could not verify your email with the provided link.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Alert variant="destructive" className="rounded-xl" role="alert">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Button
                      onClick={handleResendEmail}
                      className="w-full h-11 rounded-xl border border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#161D19] text-foreground hover:bg-[#FAF7F2] dark:hover:bg-[#1C2420]"
                      variant="outline"
                    >
                      <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                      Resend Confirmation Email
                    </Button>
                    <Button
                      onClick={() => navigate('/signin')}
                      className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20"
                    >
                      Go to Sign In
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <Link
                      to="/"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
                    </Link>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ConfirmEmail;
