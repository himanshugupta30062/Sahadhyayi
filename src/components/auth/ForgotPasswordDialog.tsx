import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-universal';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateEmail } from '@/utils/validation';

export const ForgotPasswordDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSuccess(false);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit')) {
          setErrorMessage('Too many reset requests. Please wait a few moments before trying again.');
        } else {
          setErrorMessage(error.message || 'Unable to send password reset email.');
        }
        return;
      }

      setSuccess(true);
      toast({
        title: 'Check your email',
        description: 'Password reset instructions have been dispatched if the account exists.',
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-[#8F681C] hover:text-[#785715] dark:text-[#D5B16D] dark:hover:text-[#e4c688] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] rounded-sm transition-colors"
        >
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#111614] border border-[#E8E2D9] dark:border-[#26302A] text-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-foreground">
            Reset your password
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter the email address associated with your account. We will send you a secure link to choose a new password.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="rounded-xl" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="space-y-4 py-2">
            <Alert className="rounded-xl border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <AlertDescription className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
                <p>
                  If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password.
                </p>
                <p className="text-xs opacity-90">
                  Please check your inbox and spam folder. The link will expire after 24 hours.
                </p>
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-full bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                Email address <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  aria-required="true"
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  className="pl-10 h-11 bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A] text-foreground focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
                  required
                />
              </div>
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
                  Sending link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
