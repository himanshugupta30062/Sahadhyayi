import { supabase } from '@/integrations/supabase/client';

export interface NewsletterSubscriptionResult {
  success: boolean;
  duplicate?: boolean;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const subscribeToNewsletter = async (
  rawEmail: string
): Promise<NewsletterSubscriptionResult> => {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email) {
    return {
      success: false,
      duplicate: false,
      message: 'Please enter your email address.',
    };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 320) {
    return {
      success: false,
      duplicate: false,
      message: 'Please enter a valid email address.',
    };
  }

  try {
    const { error } = await supabase
      .from('newsletter_subscribers' as any)
      .insert({
        email,
        status: 'active',
      });

    if (error) {
      const errCode = (error as any).code;
      const errMsg = (error as any).message || '';
      const errDetails = (error as any).details || '';

      const isDuplicate =
        errCode === '23505' ||
        errMsg.toLowerCase().includes('unique') ||
        errMsg.toLowerCase().includes('duplicate') ||
        errDetails.toLowerCase().includes('already exists');

      if (isDuplicate) {
        return {
          success: false,
          duplicate: true,
          message: 'This email is already subscribed.',
        };
      }

      console.error('Newsletter subscription failed:', error);
      return {
        success: false,
        duplicate: false,
        message: 'Something went wrong. Please try again.',
      };
    }

    return {
      success: true,
      duplicate: false,
      message: "You're subscribed! Look forward to discovering something wonderful.",
    };
  } catch (err) {
    console.error('Unexpected newsletter subscription error:', err);
    return {
      success: false,
      duplicate: false,
      message: 'Something went wrong. Please try again.',
    };
  }
};
