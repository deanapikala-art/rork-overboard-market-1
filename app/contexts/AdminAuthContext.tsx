import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react';

export type AdminProfile = {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
};

type AdminAuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ADMIN_STORAGE_KEY = '@overboard_admin_session';

export const [AdminAuthProvider, useAdminAuth] = createContextHook<AdminAuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkIsAdmin = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('[AdminAuth] Checking admin status for user:', userId);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AdminAuth] Error checking admin status:', JSON.stringify(error, null, 2));
        return false;
      }

      if (data) {
        setProfile(data as AdminProfile);
        console.log('[AdminAuth] Admin profile loaded:', data.email);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AdminAuth] Exception checking admin status:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      return false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await checkIsAdmin(user.id);
    }
  }, [user, checkIsAdmin]);

  useEffect(() => {
    console.log('[AdminAuth] Initializing...');
    let isMounted = true;
    
    const loadTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('[AdminAuth] Session load timed out');
        setIsLoading(false);
      }
    }, 200);
    
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      clearTimeout(loadTimeout);
      console.log('[AdminAuth] Session loaded:', currentSession ? 'Active' : 'None');
      
      if (currentSession?.user) {
        const isAdmin = await checkIsAdmin(currentSession.user.id);
        
        if (isAdmin) {
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('[AdminAuth] User is not an admin, clearing session');
          await supabase.auth.signOut();
        }
      }
      
      if (isMounted) setIsLoading(false);
    }).catch((error) => {
      if (!isMounted) return;
      clearTimeout(loadTimeout);
      console.error('[AdminAuth] Error loading session:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      console.log('[AdminAuth] Auth state changed:', _event);
      
      if (currentSession?.user) {
        const isAdmin = await checkIsAdmin(currentSession.user.id);
        
        if (isAdmin) {
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('[AdminAuth] User is not an admin');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
      subscription.unsubscribe();
    };
  }, [checkIsAdmin]);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AdminAuth] Signing in admin:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AdminAuth] Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to sign in' };
      }

      const isAdmin = await checkIsAdmin(data.user.id);
      
      if (!isAdmin) {
        console.log('[AdminAuth] User is not an admin, signing out');
        await supabase.auth.signOut();
        return { success: false, error: 'You do not have admin access' };
      }

      console.log('[AdminAuth] Admin signed in successfully');
      await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({ email }));
      
      return { success: true };
    } catch (error) {
      console.error('[AdminAuth] Sign in exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [checkIsAdmin]);

  const signOut = useCallback(async () => {
    try {
      console.log('[AdminAuth] Signing out');
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
      setSession(null);
      setUser(null);
      setProfile(null);
      console.log('[AdminAuth] Signed out successfully');
    } catch (error) {
      console.error('[AdminAuth] Sign out error:', error);
    }
  }, []);

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session && !!profile,
    isAdmin: !!profile,
    signIn,
    signOut,
    refreshProfile,
  };
});
