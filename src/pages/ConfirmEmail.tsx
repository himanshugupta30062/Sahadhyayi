import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Mail, Loader2 } from 'lucide-react';
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
    const verifyEmail = async () => {
      try {
        // Check if there's a token hash in the URL
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!tokenHash || type !== 'email') {
          // Check current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.email_confirmed_at) {
            setStatus('already-verified');
            return;
          }

          setStatus('error');
          setErrorMessage('Invalid or missing confirmation link. Please check your email and try again.');
          return;
        }

        // Verify the email with the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });

        if (error) {
          console.error('Email verification error:', error);
          
          if (error.message.includes('expired')) {
            setErrorMessage('This confirmation link has expired. Please request a new one.');
          } else if (error.message.includes('already verified')) {
            setStatus('already-verified');
            return;
          } else {
            setErrorMessage(error.message || 'Failed to verify email. Please try again.');
          }
          
          setStatus('error');
          return;
        }

        if (data.session) {
          setStatus('success');
          toast({
            title: 'Email confirmed!',
            description: 'Your account has been successfully verified.',
          });
        } else {
          setStatus('error');
          setErrorMessage('Unable to verify your email. Please try again.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, toast]);

  // Countdown and redirect on success
  useEffect(() => {
    if (status === 'success' || status === 'already-verified') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: 'Error',
          description: 'No email found. Please sign up again.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: 'Email sent',
        description: 'A new confirmation email has been sent to your inbox.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend email',
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {status === 'verifying' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="text-2xl">Verifying Email</CardTitle>
                <CardDescription>
                  Please wait while we verify your email address...
                </CardDescription>
              </CardHeader>
            </>
          )}

          {status === 'success' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Email Confirmed!</CardTitle>
                <CardDescription>
                  Your email has been successfully verified.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Redirecting you to your dashboard in {countdown} seconds...
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard Now
                </Button>
              </CardContent>
            </>
          )}

          {status === 'already-verified' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Already Verified</CardTitle>
                <CardDescription>
                  Your email has already been confirmed.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Redirecting you to your dashboard in {countdown} seconds...
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard Now
                </Button>
              </CardContent>
            </>
          )}

          {status === 'error' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
                <CardDescription>
                  We couldn't verify your email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Button onClick={handleResendEmail} className="w-full" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Confirmation Email
                  </Button>
                  <Button onClick={() => navigate('/signin')} className="w-full" variant="secondary">
                    Go to Sign In
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  <p>Having trouble?</p>
                  <Button 
                    variant="link" 
                    className="text-amber-600 hover:text-amber-700"
                    onClick={() => navigate('/help-center')}
                  >
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default ConfirmEmail;
