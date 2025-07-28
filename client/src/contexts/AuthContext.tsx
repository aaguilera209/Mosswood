import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  becomeCreator: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    console.log('🔍 AuthContext Loading profile for user ID:', userId);
    
    try {
      // Get user email for API call
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ Error getting user:', userError);
        setLoading(false);
        return;
      }
      
      const email = user?.user?.email;
      console.log('🔍 User email for API call:', email);
      
      if (!email) {
        console.error('❌ No email found for user');
        setLoading(false);
        return;
      }
      
      // Make API call to get profile
      console.log('🔍 Making API call to /api/profile/' + encodeURIComponent(email));
      const response = await fetch(`/api/profile/${encodeURIComponent(email)}`);
      console.log('🔍 API response status:', response.status, response.ok);
      
      if (!response.ok) {
        console.error('❌ API response not ok:', response.status, response.statusText);
        setLoading(false);
        return;
      }
      
      const result = await response.json();
      console.log('🔍 API profile result:', result);
      
      if (result && result.profile) {
        console.log('✅ SUCCESS! Profile loaded from API with display_name:', result.profile.display_name);
        console.log('✅ Profile role:', result.profile.role);
        console.log('✅ Setting profile in context...');
        setProfile(result.profile);
        console.log('✅ Profile set successfully!');
      } else {
        console.error('❌ No profile found in API result:', result);
      }
      
      // Fallback to direct Supabase query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      console.log('🔍 Supabase fallback result:', { data, error });

      if (error) {
        console.error('Profile loading error:', error);
        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create...');
          const { data: user } = await supabase.auth.getUser();
          if (user?.user?.email) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: user.user.email,
                role: 'creator' // Set default role
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Failed to create profile:', createError);
            } else {
              console.log('Profile created successfully:', newProfile);
              setProfile(newProfile);
            }
          }
        }
      } else {
        console.log('Profile loaded successfully:', data);
        console.log('Profile display_name:', data?.display_name);
        console.log('Full profile data:', JSON.stringify(data, null, 2));
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR loading profile:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      setLoading(false);
      console.log('🔍 Profile loading completed, loading set to false');
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create profile if user was created
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: data.user.email!,
            role: 'viewer', // Default to viewer role for new signups
          },
        ]);

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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