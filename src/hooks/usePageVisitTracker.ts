
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePageVisitTracker = () => {
  useEffect(() => {
    const recordVisit = async () => {
      try {
        // Get basic visitor info
        const userAgent = navigator.userAgent;
        const currentPage = window.location.pathname;
        
        // Record the visit using the database function
        const { error } = await supabase.rpc('record_website_visit', {
          ip_addr: null, // IP captured server-side
          user_agent_string: userAgent,
          page: currentPage,
          country_code: null
        });

        if (error) {
          console.error('Error recording visit:', error);
        }
      } catch (error) {
        console.error('Failed to record visit:', error);
      }
    };

    // Record visit on component mount
    recordVisit();
  }, []);
};
