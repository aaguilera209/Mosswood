import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  becomeCreator: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  becomeCreator: async () => {},
  refreshProfile: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Initial session error:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('User signed out - clearing all state');
          setUser(null);
          setProfile(null);
          setLoading(false);
          
          // Clear only user-specific queries, preserve public data like creators
          queryClient.removeQueries({ queryKey: ['profile'] });
          queryClient.removeQueries({ queryKey: ['user-videos'] });
          queryClient.removeQueries({ queryKey: ['user-library'] });
          queryClient.removeQueries({ queryKey: ['user-purchases'] });
          queryClient.removeQueries({ queryKey: ['creator-stats'] });
          
          // Clear any localStorage that might persist auth state
          localStorage.removeItem('sb-kdtjkbgnntdtpcgdwmhg-auth-token');
          localStorage.removeItem('supabase.auth.token');
          
          return;
        }
        
        // Handle email confirmation - create profile if it doesn't exist
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('User signed in with confirmed email');
          
          // Check if profile exists
          try {
            const response = await fetch(`/api/profile/${encodeURIComponent(session.user.email!)}`);
            if (!response.ok) {
              // Profile doesn't exist, create it
              console.log('Creating profile for new user');
              await fetch('/api/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: session.user.id,
                  email: session.user.email
                })
              });
            }
          } catch (error) {
            console.error('Error checking/creating profile:', error);
          }
        }
        
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = (userId: string) => {
    // Get user email and load profile
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      const email = currentUser?.email;
      
      if (!email) {
        setLoading(false);
        return;
      }
      
      // Check if this is alex@jrvs.ai and use admin endpoint
      const endpoint = email === 'alex@jrvs.ai' 
        ? `/api/admin-profile/${encodeURIComponent(email)}`
        : `/api/profile/${encodeURIComponent(email)}`;
      
      console.log('Using endpoint:', endpoint, 'for email:', email);

      // Make the fetch call
      fetch(endpoint)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Response not OK: ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          console.log('Profile API result:', result);
          if (result?.profile) {
            console.log('Profile loaded with role:', result.profile.role);
            setProfile(result.profile);
          } else {
            console.log('No profile found in result');
            setProfile(null);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Profile load error:', error);
          setProfile(null);
          setLoading(false);
        });
    }).catch(error => {
      console.error('Error getting user:', error);
      setProfile(null);
      setLoading(false);
    });
  };

  const signUp = async (email: string, password: string) => {
    // Configure signup to require email confirmation with proper redirect
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`
      }
    });

    if (error) throw error;

    // Don't create profile immediately - wait for email confirmation
    // Profile will be created via backend when user confirms email
    console.log('Signup initiated, user needs to confirm email:', data.user?.email);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear React Query cache first
      queryClient.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signout error:', error);
        throw error;
      }
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      
      // Clear any persisted localStorage keys
      try {
        localStorage.removeItem('sb-kdtjkbgnntdtpcgdwmhg-auth-token');
        localStorage.removeItem('supabase.auth.token');
        // Clear any other auth-related keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const becomeCreator = async () => {
    if (!user) throw new Error('Must be logged in to become a creator');

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', user.id);

    if (error) throw error;

    // Reload the profile to get updated role
    await loadProfile(user.id);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const resetPassword = async (email: string) => {
    // Get the current URL - this works for both localhost and Replit environments
    const baseUrl = window.location.origin;
    console.log('Using redirect URL:', `${baseUrl}/reset-password`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });
    
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      becomeCreator,
      refreshProfile,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};