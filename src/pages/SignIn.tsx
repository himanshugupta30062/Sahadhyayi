import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/authHelpers';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { validateEmail, sanitizeInput, isRateLimited } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useAuth();
  const { toast } = useToast();

  // Redirect to dashboard after sign in
  const redirectPath = '/dashboard';

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const validateForm = () => {
    if (!formData.email?.trim() || !formData.password) {
      setError("Please fill in all fields.");
      return false;
    }
    
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (isRateLimited('signin', 5, 300000)) { // 5 attempts per 5 minutes
      toast({
        title: "Too Many Attempts",
        description: "Too many sign-in attempts. Please wait 5 minutes before trying again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const sanitizedEmail = sanitizeInput(formData.email.trim().toLowerCase(), 254);
      
      await signIn(sanitizedEmail, formData.password);
      
      // Navigate to dashboard on success
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = error.message || 'Sign-in failed';
      
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link before signing in.';
      } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        errorMessage = 'Too many attempts. Please wait a moment before trying again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = 'Sign-in failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <>
      <SEO
        title="Sign In - Sahadhyayi"
        description="Sign in to your Sahadhyayi account to access your reading community."
        canonical="https://sahadhyayi.com/signin"
        url="https://sahadhyayi.com/signin"
      />
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <LogIn className="w-6 h-6" />
              Welcome Back
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-white text-black"
                    maxLength={254}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-white text-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SignIn;
