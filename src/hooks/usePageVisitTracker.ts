
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePageVisitTracker = () => {
  useEffect(() => {
    const recordVisit = async () => {
      try {
        // Skip tracking in development environments or when Supabase is not properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl.includes('your-project') || 
            supabaseKey.includes('your_') ||
            window.location.hostname.includes('stackblitz') ||
            window.location.hostname.includes('webcontainer')) {
          console.log('Skipping visit tracking in development environment');
          return;
        }

        // Get basic visitor info
        const userAgent = navigator.userAgent;
        const currentPage = window.location.pathname;
        
        // Call the edge function which will capture IP and country automatically
        const { error } = await supabase.functions.invoke('website-visits', {
          body: {
            userAgent,
            page: currentPage
          }
        });

        if (error) {
          console.warn('Edge function unavailable, trying fallback:', error.message);
          
          // Fallback to the original function if edge function fails
          const { error: fallbackError } = await supabase.rpc('record_website_visit', {
            ip_addr: null,
            user_agent_string: userAgent,
            page: currentPage,
            country_code: null
          });
          
          if (fallbackError) {
            console.warn('Visit tracking unavailable:', fallbackError.message);
          }
        }
      } catch (error) {
        console.warn('Visit tracking failed (this is normal in development):', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Record visit on component mount
    recordVisit();
  }, []);
};
