import * as React from 'react';
import { User, Session, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider initializing...');
  
  // Use React.useState explicitly to avoid dispatcher issues
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    console.log('AuthProvider useEffect running...');
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          // Clear local state
          setUser(null);
          setSession(null);
          
          // Clear session-related storage
          if (typeof window !== 'undefined') {
            // Clear all session-related data
            ['lastActivity', 'sessionStart', 'browserSession'].forEach(key => {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            });
          }
        }

        // Handle sign in event
        if (event === 'SIGNED_IN' && session?.user) {
          
          // Set up session tracking
          if (typeof window !== 'undefined') {
            const now = Date.now().toString();
            localStorage.setItem('sessionStart', now);
            localStorage.setItem('lastActivity', now);
          }
          
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (!existingProfile) {
              const { error } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || '',
                });
              
              if (error) {
                console.error('Error creating profile:', error);
              }
            }
          } catch (error) {
            console.error('Error checking/creating profile:', error);
          }
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // If there's a session, only check if the Supabase token has expired
          if (session?.user) {
            const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
            if (expiresAt && Date.now() > expiresAt) {
              await supabase.auth.signOut();
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: AuthError | null }> => {
    try {
      if (!email || !password) {
        return { error: { message: 'Email and password are required' } as AuthError };
      }

      if (password.length < 8) {
        return { error: { message: 'Password must be at least 8 characters long' } as AuthError };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Please enter a valid email address' } as AuthError };
      }

      const emailLower = email.trim().toLowerCase();

      const redirectUrl = 'https://www.sahadhyayi.com/signin';

      const { error } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName?.trim() || '',
          },
        },
      });

      return { error };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      if (!email || !password) {
        return { error: { message: 'Email and password are required' } as AuthError };
      }
      
      const emailRegix = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegix.test(email)) {
        return { error: { message: 'Please enter a valid email address' } as AuthError };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!error && data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        setLoading(false);
        queryClient.invalidateQueries();
      }

      return { error: error ?? null };
    } catch (error) {
      console.error('Signin error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear local auth state first
      setUser(null);
      setSession(null);

      // Remove any remaining auth tokens from localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || ['lastActivity', 'sessionStart', 'browserSession'].includes(key)) {
            localStorage.removeItem(key);
          }
        });

        // Clear session storage including auto-logout related data
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('sb-') || ['lastActivity', 'sessionStart', 'browserSession'].includes(key)) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear cookies
        document.cookie.split(';').forEach((cookie) => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }

      // Sign out from Supabase (this will trigger the auth state change)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }

      queryClient.clear();

      setLoading(false);
    } catch (error) {
      console.error('Signout error:', error);
      // Ensure local state is cleared even if there's an error
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signUp,
    signIn,
  };

  console.log('AuthProvider rendering with value:', { user: !!user, session: !!session, loading });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
