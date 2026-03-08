import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/authHelpers';
import { Mail, Lock, User, Eye, EyeOff, BookOpen, LogIn, UserPlus } from 'lucide-react';
import { PasswordStrength } from '@/components/ui/password-strength';
import { validateEmail, validatePassword, sanitizeInput, isRateLimited } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

type AuthTab = 'signin' | 'signup';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithOAuth } = useAuth();
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  // Sign In handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited('signin', 5, 300000)) {
      toast({ title: 'Too Many Attempts', description: 'Please wait 5 minutes.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setError('');
    if (!signinData.email?.trim() || !signinData.password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (!validateEmail(signinData.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    try {
      await signIn(sanitizeInput(signinData.email.trim().toLowerCase(), 254), signinData.password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid login') || msg.includes('invalid credentials')) setError('Invalid email or password.');
      else if (msg.includes('Email not confirmed')) setError('Please verify your email first.');
      else if (msg.includes('rate limit')) setError('Too many attempts. Please wait.');
      else setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited('signup', 3, 600000)) {
      toast({ title: 'Too Many Attempts', description: 'Please wait 10 minutes.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    if (!signupData.name?.trim() || !signupData.email?.trim() || !signupData.password || !signupData.confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (signupData.name.trim().length < 2) { setError('Name must be at least 2 characters.'); setLoading(false); return; }
    if (!validateEmail(signupData.email)) { setError('Please enter a valid email.'); setLoading(false); return; }
    const pv = validatePassword(signupData.password);
    if (!pv.isValid) { setError(pv.message || 'Password too weak.'); setLoading(false); return; }
    if (signupData.password !== signupData.confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
    try {
      const { error } = await signUp(sanitizeInput(signupData.email.trim().toLowerCase(), 254), signupData.password, sanitizeInput(signupData.name.trim(), 100));
      if (error) {
        if (error.message.includes('already')) setError('Account already exists. Please sign in.');
        else setError(error.message || 'Registration failed.');
        setLoading(false);
        return;
      }
      setSuccess('Verification email sent! Please check your inbox.');
      setSignupData({ name: '', email: '', password: '', confirmPassword: '' });
      setTimeout(() => switchTab('signin'), 2000);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      toast({ title: 'Sign-in failed', description: err.message || `Failed with ${provider}`, variant: 'destructive' });
    }
  };

  const inputClass = "pl-10 h-11 bg-white border-border/80 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all";
  const inputToggleClass = "pl-10 pr-10 h-11 bg-white border-border/80 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all";

  return (
    <>
      <SEO
        title={activeTab === 'signin' ? 'Sign In - Sahadhyayi' : 'Sign Up - Sahadhyayi'}
        description="Sign in or create your Sahadhyayi account to join the reading community."
        canonical="https://sahadhyayi.com/auth"
        url="https://sahadhyayi.com/auth"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-orange-200/20 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo & Welcome */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <img src="/lovable-uploads/logo-small.webp" alt="Sahadhyayi" className="w-10 h-10" width={40} height={40} />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Sahadhyayi</h1>
            <p className="text-sm text-muted-foreground mt-1">Read. Connect. Grow.</p>
          </div>

          <Card className="border-none shadow-elevated bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="px-6 pb-8 pt-6">
              {/* Tab Toggle */}
              <div className="flex rounded-xl bg-muted/60 p-1 mb-6">
                <button
                  onClick={() => switchTab('signin')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === 'signin'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchTab('signup')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === 'signup'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
                  <Alert className="rounded-xl border-green-200 bg-green-50 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Sign In Form */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-foreground font-medium text-sm">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input id="signin-email" type="email" placeholder="you@example.com" value={signinData.email}
                        onChange={(e) => { setSigninData(p => ({ ...p, email: e.target.value })); setError(''); }}
                        className={inputClass} maxLength={254} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-foreground font-medium text-sm">Password</Label>
                      <ForgotPasswordDialog />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                        value={signinData.password}
                        onChange={(e) => { setSigninData(p => ({ ...p, password: e.target.value })); setError(''); }}
                        className={inputToggleClass} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="auth"
                    className="w-full h-11 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all text-base font-semibold"
                    disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing In...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>
                    )}
                  </Button>
                </form>
              )}

              {/* Sign Up Form */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-foreground font-medium text-sm">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input id="signup-name" type="text" placeholder="Your full name" value={signupData.name}
                        onChange={(e) => { setSignupData(p => ({ ...p, name: sanitizeInput(e.target.value, 100) })); setError(''); }}
                        className={inputClass} maxLength={100} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-foreground font-medium text-sm">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input id="signup-email" type="email" placeholder="you@example.com" value={signupData.email}
                        onChange={(e) => { setSignupData(p => ({ ...p, email: e.target.value })); setError(''); }}
                        className={inputClass} maxLength={254} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-foreground font-medium text-sm">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                        value={signupData.password}
                        onChange={(e) => { setSignupData(p => ({ ...p, password: e.target.value })); setError(''); }}
                        className={inputToggleClass} maxLength={128} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={signupData.password} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm" className="text-foreground font-medium text-sm">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                      <Input id="signup-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => { setSignupData(p => ({ ...p, confirmPassword: e.target.value })); setError(''); }}
                        className={inputToggleClass} maxLength={128} required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="auth"
                    className="w-full h-11 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all text-base font-semibold"
                    disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Create Account</span>
                    )}
                  </Button>
                </form>
              )}

              {/* OAuth */}
              <div className="mt-7 space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-border/60" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-muted-foreground font-medium tracking-wider">Or continue with</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="authOutline" onClick={() => handleOAuth('google')}
                    className="w-full h-11 rounded-xl border-border/80 hover:bg-amber-50/50 hover:border-amber-300/60 transition-all">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </Button>
                  <Button type="button" variant="authOutline" onClick={() => handleOAuth('github')}
                    className="w-full h-11 rounded-xl border-border/80 hover:bg-gray-50 hover:border-gray-300/60 transition-all">
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
