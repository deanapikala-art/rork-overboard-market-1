import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react';

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  wants_sms_notifications: boolean;
  created_at: string;
  updated_at: string;
};

type CustomerAuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name: string, phone?: string, wantsSms?: boolean) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<CustomerProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
};

const CUSTOMER_STORAGE_KEY = '@overboard_customer_session';

export const [CustomerAuthProvider, useCustomerAuth] = createContextHook<CustomerAuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[CustomerAuth] Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[CustomerAuth] Error loading profile:', JSON.stringify(error, null, 2));
        return;
      }

      if (data) {
        setProfile(data as CustomerProfile);
        console.log('[CustomerAuth] Profile loaded:', data.name);
      } else {
        console.log('[CustomerAuth] No profile found - profile will be created by database trigger on signup');
        setProfile(null);
      }
    } catch (error) {
      console.error('[CustomerAuth] Exception loading profile:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    console.log('[CustomerAuth] Initializing...');
    let isMounted = true;
    
    const loadTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('[CustomerAuth] Session load timed out');
        setIsLoading(false);
      }
    }, 200);
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      clearTimeout(loadTimeout);
      console.log('[CustomerAuth] Session loaded:', currentSession ? 'Active' : 'None');
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        loadProfile(currentSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch((error) => {
      if (!isMounted) return;
      clearTimeout(loadTimeout);
      console.error('[CustomerAuth] Error loading session:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      console.log('[CustomerAuth] Auth state changed:', _event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    wantsSms: boolean = false
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    try {
      console.log('[CustomerAuth] Signing up user:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'customer',
            name,
            phone: phone || null,
            wants_sms_notifications: wantsSms,
          },
          emailRedirectTo: undefined,
        }
      });

      if (authError) {
        console.error('[CustomerAuth] Sign up auth error:', authError);
        
        if (authError.message.includes('User already registered') || 
            authError.message.includes('already been registered')) {
          return { 
            success: false, 
            error: 'This email is already registered. Please sign in instead.' 
          };
        }
        
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' };
      }

      if (authData.session === null) {
        console.log('[CustomerAuth] Email confirmation required');
        return { 
          success: true, 
          needsEmailConfirmation: true,
          error: 'Please check your email to confirm your account' 
        };
      }

      console.log('[CustomerAuth] User signed up successfully - profile created by database trigger');
      await AsyncStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ email }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProfile(authData.user.id);
      
      return { success: true };
    } catch (error) {
      console.error('[CustomerAuth] Sign up exception:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  }, [loadProfile]);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[CustomerAuth] Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[CustomerAuth] Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to sign in' };
      }

      console.log('[CustomerAuth] User signed in successfully');
      await AsyncStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ email }));
      
      return { success: true };
    } catch (error) {
      console.error('[CustomerAuth] Sign in exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const signInWithOAuth = useCallback(async (
    provider: 'google' | 'apple'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[CustomerAuth] Starting OAuth sign in with:', provider);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'overboard://auth-callback',
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[CustomerAuth] OAuth sign in error:', error);
        return { success: false, error: error.message };
      }

      console.log('[CustomerAuth] OAuth flow initiated');
      return { success: true };
    } catch (error) {
      console.error('[CustomerAuth] OAuth exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[CustomerAuth] Signing out');
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(CUSTOMER_STORAGE_KEY);
      setSession(null);
      setUser(null);
      setProfile(null);
      console.log('[CustomerAuth] Signed out successfully');
    } catch (error) {
      console.error('[CustomerAuth] Sign out error:', error);
    }
  }, []);

  const updateProfile = useCallback(async (
    updates: Partial<Omit<CustomerProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('[CustomerAuth] Updating profile:', updates);
      
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('[CustomerAuth] Profile update error:', error);
        return { success: false, error: error.message };
      }

      await loadProfile(user.id);
      console.log('[CustomerAuth] Profile updated successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[CustomerAuth] Profile update exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [user, loadProfile]);

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updateProfile,
    refreshProfile,
  };
});
