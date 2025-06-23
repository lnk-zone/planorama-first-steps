
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    let isOAuthCallback = false;
    
    // More robust OAuth callback detection
    const checkForOAuthCallback = () => {
      const hash = window.location.hash;
      return hash.includes('access_token=') || hash.includes('error=');
    };

    // Initial check and continuous monitoring
    if (checkForOAuthCallback()) {
      console.log('OAuth callback detected, processing tokens...');
      setOauthLoading(true);
      isOAuthCallback = true;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle successful OAuth sign in
        if (event === 'SIGNED_IN' && session?.user && isOAuthCallback) {
          console.log('OAuth sign in successful:', session.user.email);
          setOauthLoading(false);
          
          // Clean up the URL by removing the hash
          window.history.replaceState(null, '', window.location.pathname);
          
          toast({
            title: "Welcome!",
            description: "You have successfully signed in with Google.",
          });
        }
        
        // Handle regular email/password sign in
        if (event === 'SIGNED_IN' && session?.user && !isOAuthCallback && sessionStorage.getItem('regularLogin')) {
          console.log('Regular sign in successful:', session.user.email);
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          // Clean up the flag after successful login
          setTimeout(() => sessionStorage.removeItem('regularLogin'), 1000);
        }

        // Handle OAuth errors
        if (event === 'SIGNED_OUT' && isOAuthCallback) {
          console.log('OAuth callback failed');
          setOauthLoading(false);
          toast({
            title: "Sign in failed",
            description: "There was an issue signing in with Google. Please try again.",
            variant: "destructive",
          });
        }
      }
    );

    // THEN check for existing session (but not if we're processing OAuth)
    if (!isOAuthCallback) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      // Flag regular login to avoid showing OAuth success message
      sessionStorage.setItem('regularLogin', 'true');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        let errorMessage = error.message;
        
        // Provide more helpful error messages
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('not verified')) {
          errorMessage = 'Please verify your email address before signing in. Check your email for a verification link.';
        }
        
        toast({
          title: "Error signing in",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return { data, error };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      toast({
        title: "Error signing in",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, company?: string) => {
    try {
      console.log('Attempting sign up for:', email);
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
        console.error('Sign up error:', error);
        let errorMessage = error.message;
        
        // Provide more helpful error messages
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please try signing in instead, or check your email for a confirmation link if you recently signed up.';
        } else if (error.message.includes('weak password')) {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        }
        
        toast({
          title: "Error creating account",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data.user) {
        console.log('Sign up successful:', data.user.email);
        
        // Check if user needs email confirmation
        if (!data.session) {
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account before signing in. The email may take a few minutes to arrive.",
          });
        } else {
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
        }
      }

      return { data, error };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      toast({
        title: "Error creating account",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        toast({
          title: "Error resending confirmation",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Confirmation email sent",
          description: "Please check your email for the confirmation link.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Unexpected resend confirmation error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting sign out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign out successful');
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      }
      return { error };
    } catch (error) {
      console.error('Unexpected sign out error:', error);
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
    loading: loading || oauthLoading, // Include OAuth loading in overall loading state
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
  };
};
