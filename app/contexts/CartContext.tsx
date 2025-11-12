import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import { Product } from '@/mocks/products';
import { Vendor } from '@/mocks/vendors';
import { getDistanceMiles, isPickupAvailable } from '@/app/utils/zipDistance';

export interface CustomizationValue {
  code: string;
  label: string;
  value: string | boolean;
  price_delta: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: CustomizationValue[];
  requires_proof?: boolean;
  vendorId: string;
  vendorName: string;
}

export interface VendorCartGroup {
  vendorId: string;
  vendorName: string;
  vendorData: Vendor | null;
  items: CartItem[];
  total: number;
  distanceFromCustomer?: number | null;
  pickupAvailable?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  groupedByVendor: VendorCartGroup[];
  addItem: (product: Product, vendor: Vendor, quantity?: number, customizations?: CustomizationValue[], requiresProof?: boolean) => Promise<'added'>;
  removeItem: (productId: string, vendorId: string) => Promise<void>;
  updateQuantity: (productId: string, vendorId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearVendorCart: (vendorId: string) => Promise<void>;
  getCartTotal: () => number;
  getVendorTotal: (vendorId: string) => number;
  getCartItemCount: () => number;
  isLoaded: boolean;
  customerZip?: string;
  setCustomerZip: (zip: string) => void;
}

const FAIR_BAG_STORAGE_KEY = '@overboard_fair_bag';

const [CartProvider, useCart] = createContextHook<CartContextValue>(() => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [customerZip, setCustomerZip] = useState<string | undefined>();

  const loadCart = useCallback(async () => {
    let isMounted = true;
    try {
      if (isAuthenticated && user?.id) {
        console.log('[FairBag] Loading cart from database for user:', user.id);
        const { data, error } = await supabase
          .from('customer_carts')
          .select('*')
          .eq('customer_id', user.id)
          .order('updated_at', { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.warn('[FairBag] Could not load from database:', error.message);
        } else if (data && data.length > 0) {
          const allItems: CartItem[] = [];
          data.forEach(cart => {
            const cartItems = (cart.items || []).map((item: CartItem) => ({
              ...item,
              vendorId: cart.vendor_id,
              vendorName: cart.vendor_name,
            }));
            allItems.push(...cartItems);
          });
          if (isMounted) setItems(allItems);
          console.log('[FairBag] Loaded', allItems.length, 'items from database');
        }
      } else {
        const cartData = await AsyncStorage.getItem(FAIR_BAG_STORAGE_KEY);
        if (!isMounted) return;
        if (cartData) {
          try {
            const parsed = JSON.parse(cartData);
            if (Array.isArray(parsed)) {
              if (isMounted) setItems(parsed);
              console.log('[FairBag] Loaded cart from AsyncStorage');
            } else {
              console.warn('[FairBag] Invalid cart data format, resetting');
              await AsyncStorage.removeItem(FAIR_BAG_STORAGE_KEY);
              if (isMounted) setItems([]);
            }
          } catch (parseError) {
            console.error('[FairBag] Failed to parse cart data:', parseError);
            await AsyncStorage.removeItem(FAIR_BAG_STORAGE_KEY);
            if (isMounted) setItems([]);
          }
        }
      }
    } catch (error) {
      console.error('[FairBag] Failed to load cart:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    } finally {
      if (isMounted) setIsLoaded(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let isMounted = true;
    loadCart();
    return () => {
      isMounted = false;
    };
  }, [loadCart]);

  const saveCart = useCallback(async () => {
    try {
      if (isAuthenticated && user?.id && items.length > 0) {
        console.log('[FairBag] Saving cart to database for user:', user.id);
        
        const { data: customerExists } = await supabase
          .from('customers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!customerExists) {
          console.warn('[FairBag] Customer profile does not exist yet - saving to AsyncStorage instead');
          await AsyncStorage.setItem(FAIR_BAG_STORAGE_KEY, JSON.stringify(items));
          return;
        }
        
        const vendorGroups = items.reduce((acc, item) => {
          if (!acc[item.vendorId]) {
            acc[item.vendorId] = {
              vendorId: item.vendorId,
              vendorName: item.vendorName,
              items: [],
            };
          }
          acc[item.vendorId].items.push(item);
          return acc;
        }, {} as Record<string, { vendorId: string; vendorName: string; items: CartItem[] }>);

        for (const group of Object.values(vendorGroups)) {
          const { error } = await supabase
            .from('customer_carts')
            .upsert({
              customer_id: user.id,
              vendor_id: group.vendorId,
              vendor_name: group.vendorName,
              items: group.items,
            }, {
              onConflict: 'customer_id,vendor_id',
            });

          if (error) {
            console.warn('[FairBag] Could not save vendor cart to database:', error.message);
          }
        }
        console.log('[FairBag] Saved cart to database');
      } else {
        await AsyncStorage.setItem(FAIR_BAG_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('[FairBag] Error saving cart:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, [items, isAuthenticated, user]);

  useEffect(() => {
    let isMounted = true;
    
    const save = async () => {
      if (isLoaded && isMounted) {
        await saveCart();
      }
    };
    
    save();
    
    return () => {
      isMounted = false;
    };
  }, [items, isLoaded, saveCart]);

  const addItem = useCallback(async (product: Product, vendor: Vendor, quantity: number = 1, customizations?: CustomizationValue[], requiresProof?: boolean): Promise<'added'> => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.product.id === product.id && 
        item.vendorId === vendor.id &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id && 
          item.vendorId === vendor.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { 
          product, 
          quantity, 
          customizations, 
          requires_proof: requiresProof,
          vendorId: vendor.id,
          vendorName: vendor.name,
        }];
      }
    });
    return 'added';
  }, []);

  const removeItem = useCallback(async (productId: string, vendorId: string) => {
    setItems(prevItems => prevItems.filter(item => !(item.product.id === productId && item.vendorId === vendorId)));
  }, []);

  const updateQuantity = useCallback(async (productId: string, vendorId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId, vendorId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId && item.vendorId === vendorId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      try {
        await supabase
          .from('customer_carts')
          .delete()
          .eq('customer_id', user.id);
        console.log('[FairBag] Cleared all carts from database');
      } catch (error) {
        console.error('[FairBag] Error clearing carts from database:', error);
      }
    }
    setItems([]);
  }, [isAuthenticated, user]);

  const clearVendorCart = useCallback(async (vendorId: string) => {
    if (isAuthenticated && user?.id) {
      try {
        await supabase
          .from('customer_carts')
          .delete()
          .eq('customer_id', user.id)
          .eq('vendor_id', vendorId);
        console.log('[FairBag] Cleared vendor cart from database:', vendorId);
      } catch (error) {
        console.error('[FairBag] Error clearing vendor cart from database:', error);
      }
    }
    setItems(prevItems => prevItems.filter(item => item.vendorId !== vendorId));
  }, [isAuthenticated, user]);

  const groupedByVendor = useMemo((): VendorCartGroup[] => {
    const groups = items.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          vendorData: null,
          items: [],
          total: 0,
          distanceFromCustomer: undefined,
          pickupAvailable: true,
        };
      }
      acc[item.vendorId].items.push(item);
      return acc;
    }, {} as Record<string, VendorCartGroup>);

    Object.values(groups).forEach(group => {
      group.total = group.items.reduce((total, item) => {
        const basePrice = item.product.price;
        const customizationPrice = item.customizations?.reduce((sum, c) => sum + c.price_delta, 0) || 0;
        return total + ((basePrice + customizationPrice) * item.quantity);
      }, 0);
    });

    return Object.values(groups);
  }, [items]);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const basePrice = item.product.price;
      const customizationPrice = item.customizations?.reduce((sum, c) => sum + c.price_delta, 0) || 0;
      return total + ((basePrice + customizationPrice) * item.quantity);
    }, 0);
  }, [items]);

  const getVendorTotal = useCallback((vendorId: string) => {
    return items
      .filter(item => item.vendorId === vendorId)
      .reduce((total, item) => {
        const basePrice = item.product.price;
        const customizationPrice = item.customizations?.reduce((sum, c) => sum + c.price_delta, 0) || 0;
        return total + ((basePrice + customizationPrice) * item.quantity);
      }, 0);
  }, [items]);

  const getCartItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return useMemo(() => ({
    items,
    groupedByVendor,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearVendorCart,
    getCartTotal,
    getVendorTotal,
    getCartItemCount,
    isLoaded,
    customerZip,
    setCustomerZip,
  }), [items, groupedByVendor, addItem, removeItem, updateQuantity, clearCart, clearVendorCart, getCartTotal, getVendorTotal, getCartItemCount, isLoaded, customerZip]);
});

export { CartProvider, useCart };
