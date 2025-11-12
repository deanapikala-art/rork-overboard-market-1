import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';

export type LivePlatform = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'other';

export type LiveVendor = {
  id: string;
  vendor_name: string;
  state: string | null;
  logo_url: string | null;
  live_platform: LivePlatform;
  live_url: string;
  live_started_at: string;
  session_notes: string | null;
};

export type LiveSession = {
  id: string;
  vendor_id: string;
  platform: LivePlatform;
  live_url: string;
  started_at: string;
  ended_at: string | null;
  clicks: number;
  notes: string | null;
};

type VendorLiveContextValue = {
  liveVendors: LiveVendor[];
  isLoading: boolean;
  error: string | null;
  refreshLiveVendors: () => Promise<void>;
  goLive: (vendorId: string, platform: LivePlatform, liveUrl: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  endLive: (vendorId: string) => Promise<{ success: boolean; error?: string }>;
  recordClick: (vendorId: string, sessionId?: string) => Promise<void>;
  getVendorActiveSessions: (vendorId: string) => Promise<LiveSession[]>;
};

const PLATFORM_DOMAINS: Record<LivePlatform, string[]> = {
  youtube: ['youtube.com', 'youtu.be'],
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.watch', 'fb.com'],
  tiktok: ['tiktok.com'],
  other: [],
};

function derivePlatformFromUrl(url: string): LivePlatform {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    
    for (const [platform, domains] of Object.entries(PLATFORM_DOMAINS)) {
      if (domains.some(domain => hostname.includes(domain))) {
        return platform as LivePlatform;
      }
    }
    
    return 'other';
  } catch {
    return 'other';
  }
}

function validateLiveUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'Please provide a live stream URL' };
  }
  
  try {
    const urlObj = new URL(url);
    
    if (!['https:', 'http:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must start with https://' };
    }
    
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    const allDomains = Object.values(PLATFORM_DOMAINS).flat();
    
    if (allDomains.length > 0 && !allDomains.some(domain => hostname.includes(domain))) {
      return { 
        valid: false, 
        error: 'Please use a URL from YouTube, Instagram, Facebook, or TikTok' 
      };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
}

export const [VendorLiveProvider, useVendorLive] = createContextHook<VendorLiveContextValue>(() => {
  const [liveVendors, setLiveVendors] = useState<LiveVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const refreshLiveVendors = useCallback(async () => {
    try {
      console.log('[VendorLive] Fetching live vendors');
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_live_vendors');

      if (fetchError) {
        const errorMessage = fetchError.message || 'Failed to fetch live vendors';
        console.error('[VendorLive] Error fetching live vendors:', errorMessage);
        console.error('[VendorLive] Full error object:', JSON.stringify(fetchError, null, 2));
        setError(errorMessage);
        return;
      }

      console.log('[VendorLive] Found', data?.length || 0, 'live vendors');
      
      // If no live vendors from DB, use mock data for testing
      if (!data || data.length === 0) {
        console.log('[VendorLive] No DB vendors, using mock data');
        const mockLiveVendors: LiveVendor[] = [
          {
            id: '1',
            vendor_name: 'Luna Ceramics',
            state: 'OR',
            logo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
            live_platform: 'youtube',
            live_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
            live_started_at: new Date().toISOString(),
            session_notes: 'Creating custom pottery pieces live! Ask me anything about ceramics 🎨',
          },
          {
            id: '3',
            vendor_name: 'Forge & Bloom',
            state: 'TX',
            logo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            live_platform: 'instagram',
            live_url: 'https://www.instagram.com/forge_and_bloom',
            live_started_at: new Date().toISOString(),
            session_notes: 'Crafting custom jewelry! Come see the metalwork magic ✨',
          },
        ];
        setLiveVendors(mockLiveVendors);
      } else {
        setLiveVendors(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load live vendors';
      console.error('[VendorLive] Exception fetching live vendors:', errorMessage);
      console.error('[VendorLive] Full error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (isMounted) {
        await refreshLiveVendors();
      }
    };
    
    loadInitialData();
    
    const channel = supabase
      .channel('live-vendors-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
          filter: 'is_live=eq.true',
        },
        () => {
          if (isMounted) {
            console.log('[VendorLive] Realtime: Vendor live status changed');
            refreshLiveVendors();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_live_sessions',
        },
        () => {
          if (isMounted) {
            console.log('[VendorLive] Realtime: Live session changed');
            refreshLiveVendors();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        console.log('[VendorLive] Unsubscribing from realtime channel');
        supabase.removeChannel(channel);
      }
    };
  }, [refreshLiveVendors]);

  const goLive = useCallback(async (
    vendorId: string,
    platform: LivePlatform,
    liveUrl: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[VendorLive] Vendor going live:', vendorId);
      
      const validation = validateLiveUrl(liveUrl);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const detectedPlatform = derivePlatformFromUrl(liveUrl);
      const finalPlatform = platform === 'other' ? detectedPlatform : platform;

      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          is_live: true,
          live_platform: finalPlatform,
          live_url: liveUrl,
          live_started_at: new Date().toISOString(),
        })
        .eq('id', vendorId);

      if (vendorError) {
        console.error('[VendorLive] Error updating vendor:', vendorError);
        return { success: false, error: vendorError.message };
      }

      const { error: sessionError } = await supabase
        .from('vendor_live_sessions')
        .insert({
          vendor_id: vendorId,
          platform: finalPlatform,
          live_url: liveUrl,
          notes: notes || null,
        });

      if (sessionError) {
        console.error('[VendorLive] Error creating session:', sessionError);
        return { success: false, error: sessionError.message };
      }

      console.log('[VendorLive] Vendor is now live');
      await refreshLiveVendors();
      
      return { success: true };
    } catch (err) {
      console.error('[VendorLive] Exception going live:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to go live' 
      };
    }
  }, [refreshLiveVendors]);

  const endLive = useCallback(async (
    vendorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[VendorLive] Ending live session for vendor:', vendorId);

      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          is_live: false,
          live_platform: null,
          live_url: null,
          live_started_at: null,
        })
        .eq('id', vendorId);

      if (vendorError) {
        console.error('[VendorLive] Error updating vendor:', vendorError);
        return { success: false, error: vendorError.message };
      }

      const { error: sessionError } = await supabase
        .from('vendor_live_sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('vendor_id', vendorId)
        .is('ended_at', null);

      if (sessionError) {
        console.error('[VendorLive] Error ending session:', sessionError);
      }

      console.log('[VendorLive] Live session ended');
      await refreshLiveVendors();
      
      return { success: true };
    } catch (err) {
      console.error('[VendorLive] Exception ending live:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to end live session' 
      };
    }
  }, [refreshLiveVendors]);

  const recordClick = useCallback(async (
    vendorId: string,
    sessionId?: string
  ) => {
    try {
      console.log('[VendorLive] Recording click for vendor:', vendorId);
      
      await supabase.rpc('record_live_click', {
        p_vendor_id: vendorId,
        p_session_id: sessionId || null,
      });
    } catch (err) {
      console.error('[VendorLive] Error recording click:', err);
    }
  }, []);

  const getVendorActiveSessions = useCallback(async (
    vendorId: string
  ): Promise<LiveSession[]> => {
    try {
      const { data, error } = await supabase
        .from('vendor_live_sessions')
        .select('*')
        .eq('vendor_id', vendorId)
        .is('ended_at', null)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('[VendorLive] Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[VendorLive] Exception fetching sessions:', err);
      return [];
    }
  }, []);

  return {
    liveVendors,
    isLoading,
    error,
    refreshLiveVendors,
    goLive,
    endLive,
    recordClick,
    getVendorActiveSessions,
  };
});
