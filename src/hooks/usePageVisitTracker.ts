
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';

const usePageVisitTracker = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const recordVisit = async () => {
      try {
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
          console.error('Error recording visit:', error);
          
          // Fallback to the original function if edge function fails
          const { error: fallbackError } = await supabase.rpc('record_website_visit', {
            ip_addr: null,
            user_agent_string: userAgent,
            page: currentPage,
            country_code: null
          });
          
          if (fallbackError) {
            console.error('Fallback error recording visit:', fallbackError);
          }
        }
      } catch (error) {
        console.error('Failed to record visit:', error);
      }
    };

    // Record visit on component mount
    recordVisit();
  }, []);
};

export default usePageVisitTracker;
