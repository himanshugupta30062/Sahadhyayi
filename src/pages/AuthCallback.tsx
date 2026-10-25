import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/authHelpers';
import { getSafeRedirectUrl } from '@/utils/security';
import SEO from '@/components/SEO';

/**
 * OAuth landing page.
 *
 * The browser Supabase client is configured with detectSessionInUrl + PKCE and
 * exchanges the callback code during client initialization. Do not exchange it
 * again here: doing so can consume the one-time code twice.
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const callbackError = searchParams.get('error_description') || searchParams.get('error');
  const redirectPath = useMemo(
    () => getSafeRedirectUrl(searchParams.get('next'), '/dashboard'),
    [searchParams]
  );

  useEffect(() => {
    if (!loading && user && !callbackError) {
      navigate(redirectPath, { replace: true });
    }
  }, [loading, user, callbackError, navigate, redirectPath]);

  const hasFailed = Boolean(callbackError) || (!loading && !user);

  return (
    <>
      <SEO
        title="Completing Sign In - Sahadhyayi"
        description="Securely completing your Sahadhyayi sign-in."
        canonical="https://sahadhyayi.com/auth/callback"
        url="https://sahadhyayi.com/auth/callback"
      />
      <main className="min-h-[70vh] flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7]">
        <Card className="w-full max-w-md border border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#111614] rounded-2xl">
          <CardContent className="p-7 text-center space-y-4">
            {hasFailed ? (
              <>
                <AlertCircle className="w-10 h-10 mx-auto text-destructive" aria-hidden="true" />
                <h1 className="text-xl font-semibold">Sign-in could not be completed</h1>
                <Alert variant="destructive" role="alert">
                  <AlertDescription>
                    {callbackError
                      ? 'The identity provider could not complete authorization. Please try again.'
                      : 'No authenticated session was established. Please try signing in again.'}
                  </AlertDescription>
                </Alert>
                <Button asChild className="w-full">
                  <Link to="/auth">Return to sign in</Link>
                </Button>
              </>
            ) : (
              <>
                {loading ? (
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="w-10 h-10 mx-auto text-[#1C442D] dark:text-[#D5B16D]" aria-hidden="true" />
                )}
                <h1 className="text-xl font-semibold">Completing your sign-in</h1>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? 'Securely verifying your session. This should only take a moment.'
                    : 'Your session is ready. Redirecting you to Sahadhyayi…'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default AuthCallback;
