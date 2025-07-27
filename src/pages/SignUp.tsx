
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { PasswordStrength } from '@/components/ui/password-strength';
import { validateEmail, validatePassword, sanitizeInput, validateUsername, isRateLimited } from '@/utils/validation';
import { initializeSecureSession, logSecurityEvent } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

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
    // Enhanced input validation
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return false;
    }
    
    // Name validation
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return false;
    }
    
    if (formData.name.trim().length > 100) {
      setError("Name must be less than 100 characters.");
      return false;
    }
    
    // Email validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    // Password validation
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
    
    // Rate limiting check
    if (isRateLimited('signup', 3, 600000)) { // 3 attempts per 10 minutes
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
      
      const { error } = await signUp(
        sanitizedEmail, 
        formData.password, 
        sanitizedName
      );

      if (error) {
        // Log failed signup attempt
        logSecurityEvent('SIGNUP_FAILED', { 
          email: sanitizedEmail,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Enhanced error handling with user-friendly messages
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
          
          // Log successful signup
          logSecurityEvent('SIGNUP_SUCCESS', { 
            email: sanitizedEmail,
            timestamp: new Date().toISOString()
          });
          
          // Clear form on success
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          });
          
          // Redirect after delay
          setTimeout(() => {
            navigate('/signin');
          }, 2000);
          
          setLoading(false);
          return;
        } else {
          errorMessage = 'Registration failed. Please try again.';
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Success case
      logSecurityEvent('SIGNUP_SUCCESS', { 
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      });

      setSuccess('A verification email has been sent to your email.');
      
      // Clear form on success
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Signup error:', error);
      logSecurityEvent('SIGNUP_ERROR', { 
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
    
    // Input sanitization - prevent XSS
    const sanitizedValue = name === 'name' ? 
      sanitizeInput(value, 100) : 
      value;
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <>
      <SEO
        title="Sign Up - Sahadhyayi"
        description="Create your free Sahadhyayi account to join the reading community."
        canonical="https://sahadhyayi.com/signup"
        url="https://sahadhyayi.com/signup"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sahadhyayi-amber-light via-sahadhyayi-orange-light to-background">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <img
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
              alt="Sahadhyayi logo"
              className="w-16 h-16 mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold text-sahadhyayi-warm mb-2">Join Sahadhyayi</h1>
            <p className="text-gray-600">Create your free account and start your reading journey</p>
          </div>
          
          <Card className="card-elegant">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl text-sahadhyayi-warm">
                <UserPlus className="w-6 h-6 text-sahadhyayi-orange" />
                Create Your Account
              </CardTitle>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    maxLength={128}
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
                <PasswordStrength password={formData.password} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="btn-primary w-full text-lg py-3" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <SignInLink className="text-sahadhyayi-orange hover:text-sahadhyayi-amber font-semibold transition-colors">
                  Sign in here
                </SignInLink>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
};

export default SignUp;
