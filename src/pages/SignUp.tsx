import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/authHelpers';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { PasswordStrength } from '@/components/ui/password-strength';
import { validateEmail, validatePassword, sanitizeInput, validateUsername, isRateLimited } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { toast } = useToast();

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return false;
    }
    if (formData.name.trim().length > 100) {
      setError("Name must be less than 100 characters.");
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || "Password does not meet requirements.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited('signup', 3, 600000)) {
      toast({
        title: "Too Many Attempts",
        description: "Too many sign-up attempts. Please wait 10 minutes before trying again.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    try {
      const sanitizedName = sanitizeInput(formData.name.trim(), 100);
      const sanitizedEmail = sanitizeInput(formData.email.trim().toLowerCase(), 254);
      const { error } = await signUp(sanitizedEmail, formData.password, sanitizedName);
      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please sign in.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password') || error.message.includes('password')) {
          errorMessage = 'Password does not meet requirements. Please try a stronger password.';
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          errorMessage = 'Too many attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('email') && error.message.includes('confirm')) {
          errorMessage = 'A verification email has been sent to your email.';
          setSuccess(errorMessage);
          setFormData({ name: '', email: '', password: '', confirmPassword: '' });
          setTimeout(() => navigate('/signin'), 2000);
          setLoading(false);
          return;
        } else {
          errorMessage = 'Registration failed. Please try again.';
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }
      setSuccess('A verification email has been sent to your email.');
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setTimeout(() => navigate('/signin'), 2000);
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'name' ? sanitizeInput(value, 100) : value;
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    if (error) setError('');
  };

  const inputClass = "pl-10 h-11 bg-white border-border/80 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all";
  const inputWithToggleClass = "pl-10 pr-10 h-11 bg-white border-border/80 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all";

  return (
    <>
      <SEO
        title="Sign Up - Sahadhyayi"
        description="Create your free Sahadhyayi account to join the reading community."
        canonical="https://sahadhyayi.com/signup"
        url="https://sahadhyayi.com/signup"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50">
        {/* Decorative background elements */}
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
          <Card className="border-none shadow-elevated bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25"
              >
                <UserPlus className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Join Sahadhyayi
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5">
                Create your account and start reading together
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Alert className="rounded-xl border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-foreground font-medium text-sm">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground font-medium text-sm">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                      maxLength={254}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-foreground font-medium text-sm">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputWithToggleClass}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={inputWithToggleClass}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  variant="auth" 
                  className="w-full h-11 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all text-base font-semibold" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </Button>
              </form>
              
              <div className="mt-7 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <SignInLink className="text-amber-600 hover:text-amber-700 font-semibold transition-colors underline-offset-4 hover:underline">
                    Sign in here
                  </SignInLink>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SignUp;
