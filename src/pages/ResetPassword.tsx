import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-universal';
import SEO from '@/components/SEO';
import { PasswordStrength } from '@/components/ui/password-strength';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // 1. Listen for Supabase recovery auth state change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });

    // 2. Also check if active session or hash recovery token exists
    const checkCurrentSession = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const search = typeof window !== 'undefined' ? window.location.search : '';

        // If recovery token or code exists in URL, give Supabase a moment to process
        const hasRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token=');
        const hasCode = search.includes('code=');

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (isMounted) {
            setHasValidSession(true);
            setCheckingSession(false);
          }
          return;
        }

        if (hasRecoveryHash || hasCode) {
          // Allow up to 1.5s for auth state change to fire
          setTimeout(async () => {
            if (!isMounted) return;
            const {
              data: { session: delayedSession },
            } = await supabase.auth.getSession();
            if (delayedSession) {
              setHasValidSession(true);
            } else {
              setHasValidSession(false);
            }
            setCheckingSession(false);
          }, 1500);
        } else {
          if (isMounted) {
            setHasValidSession(false);
            setCheckingSession(false);
          }
        }
      } catch {
        if (isMounted) {
          setHasValidSession(false);
          setCheckingSession(false);
        }
      }
    };

    void checkCurrentSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const validatePasswordForm = () => {
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both inputs.');
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully reset. You may now sign in.',
      });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('same_password')) {
        setError('New password must be different from your old password.');
      } else {
        setError(err?.message || 'Failed to update password. Your session may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Reset Password - Sahadhyayi"
        description="Choose a new secure password for your Sahadhyayi account."
        canonical="https://sahadhyayi.com/reset-password"
        url="https://sahadhyayi.com/reset-password"
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
            {/* 1. Checking Session State */}
            {checkingSession ? (
              <CardContent className="py-12 text-center space-y-4">
                <Loader2 className="w-8 h-8 text-[#8F681C] dark:text-[#D5B16D] animate-spin mx-auto" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">Verifying password reset session...</p>
              </CardContent>
            ) : !hasValidSession && !success ? (
              /* 2. Invalid or Expired Session State */
              <>
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-500/30 flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Invalid or Expired Link
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    This password reset link is invalid, has expired, or has already been used. For your security, reset links are single-use and time-limited.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Link to="/signin" className="w-full block">
                    <Button className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20">
                      Request New Reset Link
                    </Button>
                  </Link>
                  <div className="text-center">
                    <Link
                      to="/"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
                    </Link>
                  </div>
                </CardContent>
              </>
            ) : success ? (
              /* 3. Password Updated Success State */
              <>
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Password Updated
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Your password has been successfully reset. You can now use your new password to sign in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Link to="/signin" className="w-full block">
                    <Button className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20">
                      Sign In Now
                    </Button>
                  </Link>
                </CardContent>
              </>
            ) : (
              /* 4. Active Reset Password Form */
              <>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-serif text-2xl font-bold text-foreground">
                    Choose a new password
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    Enter your new password below to secure your Sahadhyayi account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {error && (
                    <Alert variant="destructive" className="rounded-xl mb-4" role="alert">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-new-password" className="text-sm font-medium text-foreground">
                        New password <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <div className="relative group">
                        <Lock
                          className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                          aria-hidden="true"
                        />
                        <Input
                          id="reset-new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          value={password}
                          autoComplete="new-password"
                          aria-required="true"
                          disabled={loading}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                          }}
                          className="pl-10 pr-10 h-11 bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A] text-foreground focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] rounded-sm"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordStrength password={password} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reset-confirm-password" className="text-sm font-medium text-foreground">
                        Confirm new password <span className="text-destructive" aria-hidden="true">*</span>
                      </Label>
                      <div className="relative group">
                        <Lock
                          className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                          aria-hidden="true"
                        />
                        <Input
                          id="reset-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-type new password"
                          value={confirmPassword}
                          autoComplete="new-password"
                          aria-required="true"
                          disabled={loading}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError('');
                          }}
                          className="pl-10 pr-10 h-11 bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A] text-foreground focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          aria-pressed={showConfirmPassword}
                          className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] rounded-sm"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground leading-relaxed p-3 bg-muted/40 rounded-xl border border-border">
                      <p className="font-semibold text-foreground mb-1">Password rules:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>At least 8 characters long</li>
                        <li>Uppercase and lowercase letters</li>
                        <li>At least one number (0–9)</li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20 transition-all text-sm focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                          Updating Password...
                        </span>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
