import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCustomerAuth } from './CustomerAuthContext';
import { CartItem } from './CartContext';

export interface SavedForLaterItem extends CartItem {
  savedAt: number;
}

interface SavedForLaterContextValue {
  savedItems: SavedForLaterItem[];
  saveForLater: (item: CartItem) => Promise<void>;
  moveToCart: (productId: string, customizations?: string) => SavedForLaterItem | null;
  removeItem: (productId: string, customizations?: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getSavedItemCount: () => number;
  isLoaded: boolean;
}

const SAVED_FOR_LATER_STORAGE_KEY = '@overboard_saved_for_later';

const [SavedForLaterProvider, useSavedForLater] = createContextHook<SavedForLaterContextValue>(() => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [savedItems, setSavedItems] = useState<SavedForLaterItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadSavedItems = useCallback(async () => {
    try {
      if (isAuthenticated && user?.id) {
        console.log('[SavedForLater] Loading from database for user:', user.id);
        const { data, error } = await supabase
          .from('customer_saved_for_later')
          .select('*')
          .eq('customer_id', user.id)
          .order('saved_at', { ascending: false });

        if (error) {
          console.warn('[SavedForLater] Could not load from database:', error.message);
        } else if (data) {
          const items: SavedForLaterItem[] = data.map(item => ({
            product: item.product,
            quantity: item.quantity,
            customizations: item.customizations,
            requires_proof: item.requires_proof,
            vendorId: item.vendor_id || '',
            vendorName: item.vendor_name || '',
            savedAt: new Date(item.saved_at).getTime(),
          }));
          setSavedItems(items);
          console.log('[SavedForLater] Loaded', items.length, 'items from database');
        }
      } else {
        const savedData = await AsyncStorage.getItem(SAVED_FOR_LATER_STORAGE_KEY);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) {
              setSavedItems(parsed);
              console.log('[SavedForLater] Loaded from AsyncStorage');
            } else {
              console.warn('[SavedForLater] Invalid saved data format, resetting');
              await AsyncStorage.removeItem(SAVED_FOR_LATER_STORAGE_KEY);
              setSavedItems([]);
            }
          } catch (parseError) {
            console.error('[SavedForLater] Failed to parse saved data:', parseError);
            await AsyncStorage.removeItem(SAVED_FOR_LATER_STORAGE_KEY);
            setSavedItems([]);
          }
        }
      }
    } catch (error) {
      console.error('[SavedForLater] Failed to load:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    } finally {
      setIsLoaded(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  const saveToPersistence = useCallback(async (items: SavedForLaterItem[]) => {
    try {
      if (isAuthenticated && user?.id) {
        console.log('[SavedForLater] Saving to database for user:', user.id);
        
        const { data: customerExists } = await supabase
          .from('customers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!customerExists) {
          console.warn('[SavedForLater] Customer profile does not exist yet - saving to AsyncStorage instead');
          await AsyncStorage.setItem(SAVED_FOR_LATER_STORAGE_KEY, JSON.stringify(items));
          return;
        }

        await supabase
          .from('customer_saved_for_later')
          .delete()
          .eq('customer_id', user.id);

        if (items.length > 0) {
          const { error } = await supabase
            .from('customer_saved_for_later')
            .insert(items.map(item => ({
              customer_id: user.id,
              product: item.product,
              quantity: item.quantity,
              customizations: item.customizations,
              requires_proof: item.requires_proof,
              saved_at: new Date(item.savedAt).toISOString(),
            })));

          if (error) {
            console.warn('[SavedForLater] Could not save to database:', error.message);
            await AsyncStorage.setItem(SAVED_FOR_LATER_STORAGE_KEY, JSON.stringify(items));
          } else {
            console.log('[SavedForLater] Saved to database');
          }
        }
      } else {
        await AsyncStorage.setItem(SAVED_FOR_LATER_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('[SavedForLater] Error saving:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isLoaded) {
      saveToPersistence(savedItems);
    }
  }, [savedItems, isLoaded, saveToPersistence]);

  const saveForLater = useCallback(async (item: CartItem) => {
    const savedItem: SavedForLaterItem = {
      ...item,
      savedAt: Date.now(),
    };
    setSavedItems(prev => {
      const existing = prev.find(i => 
        i.product.id === item.product.id && 
        JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
      );
      if (existing) {
        return prev.map(i =>
          i.product.id === item.product.id && 
          JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
            ? { ...i, quantity: i.quantity + item.quantity, savedAt: Date.now() }
            : i
        );
      }
      return [savedItem, ...prev];
    });
  }, []);

  const moveToCart = useCallback((productId: string, customizations?: string): SavedForLaterItem | null => {
    let itemToMove: SavedForLaterItem | null = null;
    setSavedItems(prev => {
      const item = prev.find(i => {
        if (i.product.id !== productId) return false;
        if (!customizations) return !i.customizations || i.customizations.length === 0;
        return JSON.stringify(i.customizations) === customizations;
      });
      
      if (item) {
        itemToMove = item;
        return prev.filter(i => i !== item);
      }
      return prev;
    });
    return itemToMove;
  }, []);

  const removeItem = useCallback(async (productId: string, customizations?: string) => {
    setSavedItems(prev => prev.filter(item => {
      if (item.product.id !== productId) return true;
      if (!customizations) return item.customizations && item.customizations.length > 0;
      return JSON.stringify(item.customizations) !== customizations;
    }));
  }, []);

  const clearAll = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      try {
        await supabase
          .from('customer_saved_for_later')
          .delete()
          .eq('customer_id', user.id);
        console.log('[SavedForLater] Cleared from database');
      } catch (error) {
        console.error('[SavedForLater] Error clearing from database:', error);
      }
    }
    setSavedItems([]);
  }, [isAuthenticated, user]);

  const getSavedItemCount = useCallback(() => {
    return savedItems.reduce((count, item) => count + item.quantity, 0);
  }, [savedItems]);

  return useMemo(() => ({
    savedItems,
    saveForLater,
    moveToCart,
    removeItem,
    clearAll,
    getSavedItemCount,
    isLoaded,
  }), [savedItems, saveForLater, moveToCart, removeItem, clearAll, getSavedItemCount, isLoaded]);
});

export { SavedForLaterProvider, useSavedForLater };
