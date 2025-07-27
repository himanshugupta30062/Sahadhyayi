
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import SEO from '@/components/SEO';
import { validateEmail, sanitizeInput, isRateLimited } from '@/utils/validation';
import { initializeSecureSession, logSecurityEvent } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signIn } = useAuth();
  const { joinCommunity } = useCommunityStats(false);
  const { toast } = useToast();

  // Redirect if already signed in
  useEffect(() => {
    const joinAfterSignIn = localStorage.getItem('joinCommunityAfterSignIn') === 'true';

    if (user) {
      if (joinAfterSignIn) {
        // Clear the flag and join the community automatically
        localStorage.removeItem('joinCommunityAfterSignIn');
        joinCommunity().then(() => {
          navigate('/social', { replace: true });
        });
        return;
      }

      // Determine intended destination from state or query parameter
      const fromState = location.state?.from as string | undefined;
      const fromQuery = searchParams.get('redirect');
      const destination = fromState || fromQuery || '/dashboard';
      navigate(destination, { replace: true });

      const scrollY = sessionStorage.getItem('redirectScrollY');
      if (scrollY) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(scrollY, 10));
          sessionStorage.removeItem('redirectScrollY');
        }, 0);
      }
    }
  }, [user, navigate, location.state, joinCommunity, searchParams]);

  const validateForm = () => {
    if (!formData.email?.trim() || !formData.password) {
      setError("Please fill in all fields.");
      return false;
    }
    
    // Enhanced email validation using secure validation function
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    // Check password length
    if (formData.password.length < 8 || formData.password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
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
      
      // Log security event for failed attempts
      const { error } = await signIn(sanitizedEmail, formData.password);

      if (error) {
        // Log failed login attempt
        logSecurityEvent('LOGIN_FAILED', { 
          email: sanitizedEmail,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Enhanced error handling with user-friendly messages
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else {
          errorMessage = 'Sign-in failed. Please try again.';
        }
        
        setError(errorMessage);
        return;
      }

      // Success - initialize secure session
      initializeSecureSession();
      
      logSecurityEvent('LOGIN_SUCCESS', { 
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      });

      // Success will be handled by the useEffect above
    } catch (error: unknown) {
      console.error('Signin error:', error);
      logSecurityEvent('LOGIN_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sanitize input for XSS prevention
    const sanitizedValue = name === 'email' 
      ? sanitizeInput(value, 254)
      : value.substring(0, 128); // Limit password length during input
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  // Don't render the form if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <>
      <SEO
        title="Sign In - Sahadhyayi"
        description="Access your Sahadhyayi account and continue reading."
        canonical="https://sahadhyayi.com/signin"
        url="https://sahadhyayi.com/signin"
      />
      <div className="min-h-screen flex items-center justify-center p-4 pt-16 bg-gradient-to-br from-sahadhyayi-amber-light via-sahadhyayi-orange-light to-background">
        <div className="w-full max-w-md">
          {/* Welcome Back Section */}
          <div className="text-center mb-8">
            <img
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
              alt="Sahadhyayi logo"
              className="w-16 h-16 mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold text-sahadhyayi-warm mb-2">Welcome Back</h1>
            <p className="text-gray-600">Continue your reading journey with fellow readers</p>
          </div>
          
          <Card className="card-elegant">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl text-sahadhyayi-warm">
                <LogIn className="w-6 h-6 text-sahadhyayi-orange" />
                Sign In to Sahadhyayi
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
                    className="pl-10"
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
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    maxLength={128}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="btn-primary w-full text-lg py-3" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-sahadhyayi-orange hover:text-sahadhyayi-amber font-semibold transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
};

export default SignIn;
