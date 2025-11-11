import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { shoutouts as mockShoutouts, Shoutout } from '@/mocks/shoutouts';

type ShoutoutsContextValue = {
  shoutouts: Shoutout[];
  isLoading: boolean;
  getShoutoutsByVendor: (vendorId: string) => Shoutout[];
  addShoutout: (shoutout: Omit<Shoutout, 'id' | 'createdAt' | 'likes'>) => Promise<void>;
  likeShoutout: (shoutoutId: string) => Promise<void>;
  refreshShoutouts: () => Promise<void>;
};

export const [ShoutoutsProvider, useShoutouts] = createContextHook<ShoutoutsContextValue>(() => {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>(mockShoutouts);
  const [isLoading, setIsLoading] = useState(false);

  const getShoutoutsByVendor = useCallback((vendorId: string): Shoutout[] => {
    return shoutouts
      .filter(s => s.vendorId === vendorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [shoutouts]);

  const addShoutout = useCallback(async (
    newShoutout: Omit<Shoutout, 'id' | 'createdAt' | 'likes'>
  ) => {
    console.log('[Shoutouts] Adding new shoutout:', newShoutout);
    
    const shoutout: Shoutout = {
      ...newShoutout,
      id: `shoutout_${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setShoutouts(prev => [shoutout, ...prev]);
  }, []);

  const likeShoutout = useCallback(async (shoutoutId: string) => {
    console.log('[Shoutouts] Liking shoutout:', shoutoutId);
    
    setShoutouts(prev => prev.map(s => 
      s.id === shoutoutId 
        ? { ...s, likes: s.likes + 1 }
        : s
    ));
  }, []);

  const refreshShoutouts = useCallback(async () => {
    console.log('[Shoutouts] Refreshing shoutouts');
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoading(false);
  }, []);

  return {
    shoutouts,
    isLoading,
    getShoutoutsByVendor,
    addShoutout,
    likeShoutout,
    refreshShoutouts,
  };
});
