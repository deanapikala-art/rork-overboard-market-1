import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  VENDOR_SESSION: '@overboard_vendor_session',
  ADMIN_SESSION: '@overboard_admin_session',
};

type VendorSession = {
  role: 'vendor';
  status: 'active';
  email: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  createdAt: string;
};

type AdminSession = {
  role: 'admin';
  email: string;
  createdAt: string;
};

type UserRole = 'guest' | 'vendor' | 'admin';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [vendorSession, setVendorSession] = useState<VendorSession | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    let isMounted = true;
    
    try {
      const [vendorData, adminData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VENDOR_SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.ADMIN_SESSION),
      ]);

      if (!isMounted) return;

      if (adminData) {
        const admin: AdminSession = JSON.parse(adminData);
        if (isMounted) {
          setAdminSession(admin);
          setUserRole('admin');
          console.log('[AuthContext] Admin session loaded:', admin.email);
        }
      } else if (vendorData) {
        const vendor: VendorSession = JSON.parse(vendorData);
        if (isMounted) {
          setVendorSession(vendor);
          setUserRole('vendor');
          console.log('[AuthContext] Vendor session loaded:', vendor.email);
        }
      } else {
        if (isMounted) {
          setUserRole('guest');
          console.log('[AuthContext] No active session found');
        }
      }
    } catch (error) {
      if (!isMounted) return;
      console.error('[AuthContext] Error loading sessions:', error);
      if (isMounted) {
        setUserRole('guest');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (isMounted) {
        await loadSessions();
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [loadSessions]);

  const signInAsAdmin = async (email: string) => {
    try {
      const session: AdminSession = {
        role: 'admin',
        email,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.ADMIN_SESSION,
        JSON.stringify(session)
      );

      setAdminSession(session);
      setUserRole('admin');
      console.log('[AuthContext] Admin signed in:', email);
      return true;
    } catch (error) {
      console.error('[AuthContext] Admin sign-in error:', error);
      return false;
    }
  };

  const signOutVendor = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.VENDOR_SESSION);
      setVendorSession(null);
      setUserRole('guest');
      console.log('[AuthContext] Vendor signed out');
    } catch (error) {
      console.error('[AuthContext] Vendor sign-out error:', error);
    }
  };

  const signOutAdmin = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      setAdminSession(null);
      setUserRole('guest');
      console.log('[AuthContext] Admin signed out');
    } catch (error) {
      console.error('[AuthContext] Admin sign-out error:', error);
    }
  };

  const isVendor = userRole === 'vendor';
  const isAdmin = userRole === 'admin';
  const isGuest = userRole === 'guest';

  return {
    userRole,
    vendorSession,
    adminSession,
    isLoading,
    isVendor,
    isAdmin,
    isGuest,
    signInAsAdmin,
    signOutVendor,
    signOutAdmin,
    refreshSessions: loadSessions,
  };
});
