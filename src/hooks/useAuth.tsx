
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign in successful:', data.user?.email);
      }

      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, company?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company || null,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: "Error creating account",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.user) {
        console.log('Sign up successful:', data.user.email);
        
        // Create user profile - defer this to avoid blocking the auth flow
        setTimeout(async () => {
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: fullName,
                company: company || null,
              });

            if (profileError) {
              console.error('Error creating profile:', profileError);
              // Don't show error to user as this is a background operation
            } else {
              console.log('Profile created successfully');
            }
          } catch (err) {
            console.error('Profile creation failed:', err);
          }
        }, 100);
      }

      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign out successful');
      }
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Error sending reset email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
};
