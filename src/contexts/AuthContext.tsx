
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('[AUTH] State change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          console.log('[AUTH] User signed out, redirecting...');
          // Clear local state
          setUser(null);
          setSession(null);
          // Redirect to home page after sign out
          window.location.href = '/';
        }

        // Handle new user profile creation
        if (event === 'SIGNED_IN' && session?.user) {
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

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      return { error };
    } catch (error) {
      console.error('Signin error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AUTH] Starting sign out process...');

      // Sign out from Supabase (this will trigger the auth state change)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }

      // Remove any remaining auth tokens from localStorage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });

        // Clear cookies
        document.cookie.split(';').forEach((cookie) => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }

      // Clear local auth state
      setUser(null);
      setSession(null);

      console.log('[AUTH] Sign out completed successfully');

      // Redirect to home page after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Signout error:', error);
      // Ensure local state is cleared even if there's an error
      setUser(null);
      setSession(null);
      // Force redirect on error
      window.location.href = '/';
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
