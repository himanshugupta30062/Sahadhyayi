import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth, normalizeAuthEmail, normalizeAuthName } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';
import { Mail, Lock, User, Eye, EyeOff, BookOpen, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
import { PasswordStrength } from '@/components/ui/password-strength';
import { validateEmail, validatePassword, isRateLimited } from '@/utils/validation';
import { getSafeRedirectUrl } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { TurnstileCaptcha } from '@/components/auth/TurnstileCaptcha';

type AuthTab = 'signin' | 'signup';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = useMemo<AuthTab>(() => {
    if (searchParams.get('tab') === 'signup' || location.pathname === '/signup') {
      return 'signup';
    }
    return 'signin';
  }, [location.pathname, searchParams]);
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);

  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signupCompletedEmail, setSignupCompletedEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const navigate = useNavigate();
  const redirectParam = searchParams.get('redirect');
  const redirectPath = getSafeRedirectUrl(redirectParam || location.state?.from, '/dashboard');
  const { user, signIn, signUp, signInWithOAuth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (user) {
      const intent = searchParams.get('intent') || location.state?.intent;
      const bookId = searchParams.get('book_id') || location.state?.bookId;

      if (intent === 'add_shelf' && bookId) {
        supabase
          .from('user_bookshelf')
          .insert({
            user_id: user.id,
            book_id: bookId,
            status: 'want_to_read',
          })
          .then(({ error: insertError }) => {
            if (!insertError) {
              window.dispatchEvent(new Event('shelfUpdated'));
              try {
                localStorage.setItem('sahadhyayi_shelf_sync', Date.now().toString());
              } catch {
                // ignore in restricted mode
              }
              toast({
                title: 'Book Added to Bookshelf!',
                description: 'We saved this book to your shelf automatically.',
              });
            }
          })
          .catch(() => {})
          .finally(() => {
            navigate(redirectPath, { replace: true });
          });
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, navigate, redirectPath, searchParams, location.state, toast]);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setSignupCompletedEmail(null);
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
    const nextPath = tab === 'signup' ? '/signup' : '/signin';
    const currentParams = new URLSearchParams(searchParams);
    const nextSearch = currentParams.toString() ? `?${currentParams.toString()}` : '';
    if (location.pathname !== nextPath || location.search !== nextSearch) {
      navigate(`${nextPath}${nextSearch}`, { replace: true, state: location.state });
    }
  };

  // Sign In handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (isRateLimited('signin', 5, 300000)) {
      setError('Too many sign-in attempts. Please wait 5 minutes before trying again.');
      return;
    }
    setLoading(true);
    setError('');

    if (!signinData.email?.trim() || !signinData.password) {
      setError('Please fill in both email and password.');
      setLoading(false);
      return;
    }
    if (!validateEmail(signinData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      await signIn(normalizeAuthEmail(signinData.email), signinData.password);
      window.dispatchEvent(new CustomEvent('communityStatsUpdate', { detail: { action: 'signin' } }));
      try {
        localStorage.setItem('sahadhyayi_stats_sync', Date.now().toString());
      } catch {
        /* ignore storage error in private mode */
      }
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid_grant')) {
        setError('Incorrect email or password. Please verify your credentials and try again.');
      } else if (msg.includes('email not confirmed')) {
        setError('Please verify your email address before signing in. Check your inbox for the confirmation link.');
      } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        setError('Too many sign-in attempts. Please wait a few moments before trying again.');
      } else if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection')) {
        setError('Unable to reach the authentication service. Please check your internet connection.');
      } else {
        setError('Sign in could not be completed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign Up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (isRateLimited('signup', 3, 600000)) {
      setError('Too many sign-up attempts. Please wait 10 minutes before trying again.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    if (!signupData.name?.trim() || !signupData.email?.trim() || !signupData.password || !signupData.confirmPassword) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    if (signupData.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      setLoading(false);
      return;
    }
    if (!validateEmail(signupData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    const pv = validatePassword(signupData.password);
    if (!pv.isValid) {
      setError(pv.message || 'Password does not meet the requirements.');
      setLoading(false);
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      setLoading(false);
      return;
    }
    if (!captchaToken) {
      setError('Please complete the anti-bot verification before creating your account.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUp(
        normalizeAuthEmail(signupData.email),
        signupData.password,
        normalizeAuthName(signupData.name),
        captchaToken
      );

      if (signUpError) {
        setCaptchaToken(null);
        setCaptchaResetKey((key) => key + 1);
        const errorMsg = (signUpError.message || '').toLowerCase();
        if (errorMsg.includes('database error saving new user') || errorMsg.includes('unexpected_failure')) {
          setError('We could not finish creating your account because of a temporary setup issue. Please try again. If it continues, contact support.');
        } else if (errorMsg.includes('already') || errorMsg.includes('registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (errorMsg.includes('rate limit')) {
          setError('Too many sign-up attempts. Please wait a few moments before trying again.');
        } else {
          setError(signUpError.message || 'Registration could not be completed.');
        }
        setLoading(false);
        return;
      }

      window.dispatchEvent(new CustomEvent('communityStatsUpdate', { detail: { action: 'signup' } }));
      try {
        localStorage.setItem('sahadhyayi_stats_sync', Date.now().toString());
      } catch {
        /* ignore storage error in private mode */
      }

      setCaptchaToken(null);
      setCaptchaResetKey((key) => key + 1);
      setSignupCompletedEmail(signupData.email.trim());
      setSignupData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      toast({
        title: 'Sign-in failed',
        description: err.message || `Failed to authenticate with ${provider}`,
        variant: 'destructive',
      });
    }
  };

  const inputClass =
    'pl-10 h-11 bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A] text-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] transition-all';
  const inputToggleClass =
    'pl-10 pr-10 h-11 bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A] text-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] transition-all';

  return (
    <>
      <SEO
        title={activeTab === 'signin' ? 'Sign In - Sahadhyayi' : 'Sign Up - Sahadhyayi'}
        description="Sign in or create your Sahadhyayi account to join the reading community."
        canonical="https://sahadhyayi.com/auth"
        url="https://sahadhyayi.com/auth"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-200">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#8F681C]/5 dark:bg-[#D5B16D]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#1C442D]/5 dark:bg-[#1C442D]/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo & Dynamic Header */}
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
            <h1 className="text-2xl font-serif font-bold text-foreground">
              {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'signin'
                ? 'Sign in to Sahadhyayi to continue your reading journey.'
                : 'Join a community of readers, thinkers, and lifelong learners.'}
            </p>
          </div>

          <Card className="border border-[#E8E2D9] dark:border-[#26302A] shadow-md dark:shadow-none bg-white dark:bg-[#111614] rounded-2xl overflow-hidden">
            <CardContent className="px-6 pb-8 pt-6">
              {/* Tab Toggle */}
              <div
                role="tablist"
                aria-label="Account entry modes"
                className="flex rounded-xl bg-[#F4EFEA] dark:bg-[#181F1B] p-1 mb-6 border border-[#E8E2D9] dark:border-[#26302A]"
              >
                <button
                  id="signin-tab"
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'signin'}
                  aria-controls="signin-panel"
                  onClick={() => switchTab('signin')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] ${
                    activeTab === 'signin'
                      ? 'bg-white dark:bg-[#222C26] text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="signup-tab"
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'signup'}
                  aria-controls="signup-panel"
                  onClick={() => switchTab('signup')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] ${
                    activeTab === 'signup'
                      ? 'bg-white dark:bg-[#222C26] text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {(searchParams.get('intent') === 'add_shelf' || location.state?.intent === 'add_shelf') && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 shrink-0 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
                  <span>Sign in or create an account to automatically add this book to your shelf!</span>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
                  <Alert variant="destructive" className="rounded-xl" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Dedicated Post-Signup Confirmation View */}
              {signupCompletedEmail ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-foreground">Check your email</h2>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      We&apos;ve sent an activation link to <strong className="text-foreground">{signupCompletedEmail}</strong>.
                      Please open the link to confirm your account and begin reading.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
                    Didn&apos;t receive the email? Please check your spam or junk folder.
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setSignupCompletedEmail(null);
                      switchTab('signin');
                    }}
                    className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  {/* Sign In Form */}
                  {activeTab === 'signin' && (
                    <div id="signin-panel" role="tabpanel" aria-labelledby="signin-tab">
                      <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                          <Label htmlFor="signin-email" className="text-foreground font-medium text-sm">
                            Email address <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <div className="relative group">
                            <Mail
                              className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                              aria-hidden="true"
                            />
                            <Input
                              id="signin-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signinData.email}
                              autoComplete="email"
                              aria-required="true"
                              aria-invalid={!!error && !signinData.email}
                              disabled={loading}
                              onChange={(e) => {
                                setSigninData((p) => ({ ...p, email: e.target.value }));
                                setError('');
                              }}
                              className={inputClass}
                              maxLength={254}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password" className="text-foreground font-medium text-sm">
                              Password <span className="text-destructive" aria-hidden="true">*</span>
                            </Label>
                            <ForgotPasswordDialog />
                          </div>
                          <div className="relative group">
                            <Lock
                              className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                              aria-hidden="true"
                            />
                            <Input
                              id="signin-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={signinData.password}
                              autoComplete="current-password"
                              aria-required="true"
                              aria-invalid={!!error && !signinData.password}
                              disabled={loading}
                              onChange={(e) => {
                                setSigninData((p) => ({ ...p, password: e.target.value }));
                                setError('');
                              }}
                              className={inputToggleClass}
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
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          aria-busy={loading}
                          className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20 transition-all text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                              Signing In...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <LogIn className="w-4 h-4" /> Sign In
                            </span>
                          )}
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Sign Up Form */}
                  {activeTab === 'signup' && (
                    <div id="signup-panel" role="tabpanel" aria-labelledby="signup-tab">
                      <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-name" className="text-foreground font-medium text-sm">
                            Full Name <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <div className="relative group">
                            <User
                              className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                              aria-hidden="true"
                            />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="Aditi Sharma"
                              value={signupData.name}
                              autoComplete="name"
                              aria-required="true"
                              disabled={loading}
                              onChange={(e) => {
                                setSignupData((p) => ({ ...p, name: normalizeAuthName(e.target.value) }));
                                setError('');
                              }}
                              className={inputClass}
                              maxLength={100}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="signup-email" className="text-foreground font-medium text-sm">
                            Email address <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <div className="relative group">
                            <Mail
                              className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                              aria-hidden="true"
                            />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              value={signupData.email}
                              autoComplete="email"
                              aria-required="true"
                              disabled={loading}
                              onChange={(e) => {
                                setSignupData((p) => ({ ...p, email: e.target.value }));
                                setError('');
                              }}
                              className={inputClass}
                              maxLength={254}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="signup-password" className="text-foreground font-medium text-sm">
                            Password <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <div className="relative group">
                            <Lock
                              className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                              aria-hidden="true"
                            />
                            <Input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create a strong password"
                              value={signupData.password}
                              autoComplete="new-password"
                              aria-required="true"
                              disabled={loading}
                              onChange={(e) => {
                                setSignupData((p) => ({ ...p, password: e.target.value }));
                                setError('');
                              }}
                              className={inputToggleClass}
                              maxLength={128}
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
                          <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters with uppercase, lowercase, and a number.
                          </p>
                          <PasswordStrength password={signupData.password} />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="signup-confirm" className="text-foreground font-medium text-sm">
                            Confirm Password <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <div className="relative group">
                            <Lock
                              className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-[#8F681C] dark:group-focus-within:text-[#D5B16D] transition-colors"
                              aria-hidden="true"
                            />
                            <Input
                              id="signup-confirm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              value={signupData.confirmPassword}
                              autoComplete="new-password"
                              aria-required="true"
                              disabled={loading}
                              onChange={(e) => {
                                setSignupData((p) => ({ ...p, confirmPassword: e.target.value }));
                                setError('');
                              }}
                              className={inputToggleClass}
                              maxLength={128}
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

                        <TurnstileCaptcha key={captchaResetKey} onTokenChange={setCaptchaToken} />

                        <Button
                          type="submit"
                          disabled={loading}
                          aria-busy={loading}
                          className="w-full h-11 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20 transition-all text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                              Creating Account...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <UserPlus className="w-4 h-4" /> Create Account
                            </span>
                          )}
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* OAuth Section */}
                  <div className="mt-6 space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="bg-[#E8E2D9] dark:bg-[#26302A]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-[#111614] px-3 text-muted-foreground font-medium tracking-wider">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuth('google')}
                        className="w-full h-11 rounded-xl border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#161D19] hover:bg-[#FAF7F2] dark:hover:bg-[#1C2420] text-foreground transition-all"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuth('github')}
                        className="w-full h-11 rounded-xl border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#161D19] hover:bg-[#FAF7F2] dark:hover:bg-[#1C2420] text-foreground transition-all"
                      >
                        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
