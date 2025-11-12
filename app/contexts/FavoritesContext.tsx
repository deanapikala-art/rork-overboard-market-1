import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';

export type FavoriteVendor = {
  vendorId: string;
  vendorName: string;
  addedAt: number;
};

type FavoritesContextValue = {
  favorites: FavoriteVendor[];
  isLoading: boolean;
  isFavorite: (vendorId: string) => boolean;
  addFavorite: (vendorId: string, vendorName: string) => Promise<{ success: boolean; error?: string }>;
  removeFavorite: (vendorId: string) => Promise<{ success: boolean; error?: string }>;
  toggleFavorite: (vendorId: string, vendorName: string) => Promise<{ success: boolean; error?: string }>;
};

const FAVORITES_STORAGE_KEY = '@overboard_favorites';

export const [FavoritesProvider, useFavorites] = createContextHook<FavoritesContextValue>(() => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      if (isAuthenticated && user?.id) {
        console.log('[Favorites] Loading from database for user:', user.id);
        const { data, error } = await supabase
          .from('customer_favorites')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Favorites] Error loading from database:', JSON.stringify(error, null, 2));
        } else if (data) {
          const favs: FavoriteVendor[] = data.map(fav => ({
            vendorId: fav.vendor_id,
            vendorName: fav.vendor_name,
            addedAt: new Date(fav.created_at).getTime(),
          }));
          setFavorites(favs);
          console.log('[Favorites] Loaded', favs.length, 'favorites from database');
        }
      } else {
        const storedData = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (Array.isArray(parsed)) {
              setFavorites(parsed);
              console.log('[Favorites] Loaded favorites from AsyncStorage');
            } else {
              console.warn('[Favorites] Invalid favorites data format, resetting');
              await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
              setFavorites([]);
            }
          } catch (parseError) {
            console.error('[Favorites] Failed to parse favorites data:', parseError);
            await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
            setFavorites([]);
          }
        }
      }
    } catch (error) {
      console.error('[Favorites] Failed to load favorites:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (isMounted) {
        await loadFavorites();
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [loadFavorites]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isAuthenticated, isLoading]);

  const isFavorite = useCallback((vendorId: string): boolean => {
    return favorites.some(fav => fav.vendorId === vendorId);
  }, [favorites]);

  const addFavorite = useCallback(async (
    vendorId: string,
    vendorName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isAuthenticated && user?.id) {
        console.log('[Favorites] Adding to database:', vendorName);
        const { error } = await supabase
          .from('customer_favorites')
          .insert({
            customer_id: user.id,
            vendor_id: vendorId,
            vendor_name: vendorName,
          });

        if (error) {
          console.error('[Favorites] Error adding to database:', error);
          return { success: false, error: error.message };
        }
        console.log('[Favorites] Added to database:', vendorName);
      }

      const newFavorite: FavoriteVendor = {
        vendorId,
        vendorName,
        addedAt: Date.now(),
      };
      setFavorites(prev => [newFavorite, ...prev]);
      return { success: true };
    } catch (error) {
      console.error('[Favorites] Failed to add favorite:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [isAuthenticated, user]);

  const removeFavorite = useCallback(async (
    vendorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isAuthenticated && user?.id) {
        console.log('[Favorites] Removing from database:', vendorId);
        const { error } = await supabase
          .from('customer_favorites')
          .delete()
          .eq('customer_id', user.id)
          .eq('vendor_id', vendorId);

        if (error) {
          console.error('[Favorites] Error removing from database:', error);
          return { success: false, error: error.message };
        }
        console.log('[Favorites] Removed from database:', vendorId);
      }

      setFavorites(prev => prev.filter(fav => fav.vendorId !== vendorId));
      return { success: true };
    } catch (error) {
      console.error('[Favorites] Failed to remove favorite:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [isAuthenticated, user]);

  const toggleFavorite = useCallback(async (
    vendorId: string,
    vendorName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isFavorite(vendorId)) {
      return await removeFavorite(vendorId);
    } else {
      return await addFavorite(vendorId, vendorName);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return useMemo(() => ({
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }), [favorites, isLoading, isFavorite, addFavorite, removeFavorite, toggleFavorite]);
});
