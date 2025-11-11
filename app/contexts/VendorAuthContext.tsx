import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react';

export type VendorProfile = {
  id: string;
  auth_user_id: string;
  email: string;
  business_name: string;
  contact_name?: string;
  phone?: string;
  specialty?: string;
  description?: string;
  location?: string;
  state?: string;
  region?: string;
  avatar?: string;
  website_url?: string;
  instagram_handle?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  pinterest_url?: string;
  linkedin_url?: string;
  status: 'pending' | 'active' | 'suspended';
  marketplace_fee_override?: number;
  event_fee_override?: number;
  billing_status: 'paid' | 'unpaid' | 'overdue';
  last_payment_date?: string;
  subscription_status?: 'active' | 'inactive';
  subscription_type?: 'monthly' | 'event_pass' | null;
  joined_date?: string;
  created_at: string;
  updated_at: string;
};

type OnboardingStep = 'booth' | 'payments' | 'location' | 'product' | 'goLive' | null;

type VendorAuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: VendorProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
  onboardingComplete: boolean;
  currentOnboardingStep: OnboardingStep;
  signUp: (email: string, password: string, businessName: string, contactName?: string, phone?: string, state?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<VendorProfile, 'id' | 'auth_user_id' | 'email' | 'created_at' | 'updated_at'>>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
};

const VENDOR_STORAGE_KEY = '@overboard_vendor_session';

export const [VendorAuthProvider, useVendorAuth] = createContextHook<VendorAuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<OnboardingStep>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[VendorAuth] Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[VendorAuth] Error loading profile:', JSON.stringify(error, null, 2));
        return;
      }

      if (data) {
        setProfile(data as VendorProfile);
        console.log('[VendorAuth] Profile loaded:', data.business_name);
      } else {
        console.log('[VendorAuth] No profile found - profile will be created by database trigger on signup');
        setProfile(null);
      }
    } catch (error) {
      console.error('[VendorAuth] Exception loading profile:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user?.id) {
      console.log('[VendorAuth] No user ID, cannot check onboarding status');
      return;
    }

    try {
      const storageKey = `@overboard_vendor_onboarding_${user.id}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (!stored) {
        console.log('[VendorAuth] No onboarding data found - needs to start onboarding');
        setOnboardingComplete(false);
        setCurrentOnboardingStep('booth');
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(stored);
      } catch (parseError) {
        console.error('[VendorAuth] Failed to parse onboarding data:', parseError);
        await AsyncStorage.removeItem(storageKey);
        setOnboardingComplete(false);
        setCurrentOnboardingStep('booth');
        return;
      }

      if (!parsed || typeof parsed !== 'object' || !parsed.completion) {
        console.warn('[VendorAuth] Invalid onboarding data format, resetting');
        await AsyncStorage.removeItem(storageKey);
        setOnboardingComplete(false);
        setCurrentOnboardingStep('booth');
        return;
      }

      const { completion } = parsed;
      
      const allComplete = completion.booth && 
                          completion.payments && 
                          completion.location && 
                          completion.product && 
                          completion.goLive;
      
      console.log('[VendorAuth] Onboarding status:', {
        booth: completion.booth,
        payments: completion.payments,
        location: completion.location,
        product: completion.product,
        goLive: completion.goLive,
        allComplete
      });
      
      setOnboardingComplete(allComplete);
      
      if (!allComplete) {
        if (!completion.booth) {
          setCurrentOnboardingStep('booth');
        } else if (!completion.payments) {
          setCurrentOnboardingStep('payments');
        } else if (!completion.location) {
          setCurrentOnboardingStep('location');
        } else if (!completion.product) {
          setCurrentOnboardingStep('product');
        } else if (!completion.goLive) {
          setCurrentOnboardingStep('goLive');
        }
      } else {
        setCurrentOnboardingStep(null);
      }
    } catch (error) {
      console.error('[VendorAuth] Error checking onboarding status:', error);
      setOnboardingComplete(false);
      setCurrentOnboardingStep('booth');
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('[VendorAuth] Initializing...');
    let isMounted = true;
    
    const loadTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('[VendorAuth] Session load timed out');
        setIsLoading(false);
      }
    }, 200);
    
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      clearTimeout(loadTimeout);
      console.log('[VendorAuth] Session loaded:', currentSession ? 'Active' : 'None');
      
      if (currentSession?.user) {
        const userType = currentSession.user.user_metadata?.user_type;
        
        if (userType === 'vendor') {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        } else {
          console.log('[VendorAuth] User is not a vendor, user_type:', userType);
        }
      }
      
      if (isMounted) setIsLoading(false);
    }).catch((error) => {
      if (!isMounted) return;
      clearTimeout(loadTimeout);
      console.error('[VendorAuth] Error loading session:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      console.log('[VendorAuth] Auth state changed:', _event);
      
      if (currentSession?.user) {
        const userType = currentSession.user.user_metadata?.user_type;
        
        if (userType === 'vendor') {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        } else {
          console.log('[VendorAuth] User is not a vendor');
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
  }, [loadProfile]);

  useEffect(() => {
    if (user?.id && profile) {
      checkOnboardingStatus();
    }
  }, [user?.id, profile, checkOnboardingStatus]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    businessName: string,
    contactName?: string,
    phone?: string,
    state?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[VendorAuth] Signing up vendor:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'vendor',
            business_name: businessName,
            contact_name: contactName || null,
            phone: phone || null,
            state: state || null,
          },
          emailRedirectTo: undefined,
        }
      });

      if (authError) {
        console.error('[VendorAuth] Sign up auth error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' };
      }

      if (authData.session === null) {
        console.log('[VendorAuth] Email confirmation required');
        return { 
          success: true,
          error: 'Please check your email to confirm your account' 
        };
      }

      console.log('[VendorAuth] Vendor signed up successfully - profile created by database trigger');
      await AsyncStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify({ email }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProfile(authData.user.id);
      
      return { success: true };
    } catch (error) {
      console.error('[VendorAuth] Sign up exception:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  }, [loadProfile]);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[VendorAuth] Signing in vendor:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[VendorAuth] Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to sign in' };
      }

      const userType = data.user.user_metadata?.user_type;
      if (userType !== 'vendor') {
        console.error('[VendorAuth] User is not a vendor, user_type:', userType);
        await supabase.auth.signOut();
        return { success: false, error: 'This account is not registered as a vendor' };
      }

      console.log('[VendorAuth] Vendor signed in successfully');
      await AsyncStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify({ email }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await checkOnboardingStatus();
      
      return { success: true };
    } catch (error) {
      console.error('[VendorAuth] Sign in exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [checkOnboardingStatus]);

  const signOut = useCallback(async () => {
    try {
      console.log('[VendorAuth] Signing out');
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(VENDOR_STORAGE_KEY);
      setSession(null);
      setUser(null);
      setProfile(null);
      console.log('[VendorAuth] Signed out successfully');
    } catch (error) {
      console.error('[VendorAuth] Sign out error:', error);
    }
  }, []);

  const updateProfile = useCallback(async (
    updates: Partial<Omit<VendorProfile, 'id' | 'auth_user_id' | 'email' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('[VendorAuth] Updating profile:', updates);
      
      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', profile.id);

      if (error) {
        console.error('[VendorAuth] Profile update error:', error);
        return { success: false, error: error.message };
      }

      await loadProfile(user.id);
      console.log('[VendorAuth] Profile updated successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[VendorAuth] Profile update exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [user, profile, loadProfile]);

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session && !!profile,
    isVendor: !!profile,
    onboardingComplete,
    currentOnboardingStep,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    checkOnboardingStatus,
  };
});
