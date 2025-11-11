import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { useVendorAuth } from './VendorAuthContext';

export type DiscountType = 'percentage' | 'flat' | 'bogo';
export type AppliesToScope = 'storewide' | 'category' | 'product';

export type VendorSale = {
  id: string;
  vendor_id: string;
  title: string;
  description?: string;
  discount_type: DiscountType;
  discount_value?: number;
  buy_qty?: number;
  get_qty?: number;
  start_date: string;
  end_date: string;
  active: boolean;
  applies_to: AppliesToScope;
  product_ids?: string[];
  category?: string;
  banner_image?: string;
  created_at: string;
  updated_at: string;
  vendor?: {
    business_name: string;
    avatar?: string;
  };
};

type VendorSalesContextValue = {
  isLoading: boolean;
  fetchSales: (filters?: {
    active?: boolean;
    vendorId?: string;
  }) => Promise<VendorSale[]>;
  fetchMySales: () => Promise<VendorSale[]>;
  fetchActiveSales: () => Promise<VendorSale[]>;
  createSale: (sale: Omit<VendorSale, 'id' | 'vendor_id' | 'active' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; sale?: VendorSale }>;
  updateSale: (id: string, updates: Partial<VendorSale>) => Promise<{ success: boolean; error?: string }>;
  deleteSale: (id: string) => Promise<{ success: boolean; error?: string }>;
  getSaleForProduct: (productId: string) => Promise<VendorSale | null>;
  calculateSalePrice: (originalPriceCents: number, sale: VendorSale) => number;
};

export const [VendorSalesProvider, useVendorSales] = createContextHook<VendorSalesContextValue>(() => {
  const [isLoading, setIsLoading] = useState(false);
  const vendorAuth = useVendorAuth();

  const fetchSales = useCallback(async (filters?: {
    active?: boolean;
    vendorId?: string;
  }): Promise<VendorSale[]> => {
    try {
      setIsLoading(true);
      console.log('[VendorSalesContext] Fetching sales with filters:', filters);

      let query = supabase
        .from('vendor_sales')
        .select(`
          *,
          vendor:vendors!fk_vendor_sales_vendor (
            business_name,
            avatar
          )
        `)
        .order('start_date', { ascending: false });

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }
      if (filters?.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[VendorSalesContext] Error fetching sales:', error);
        return [];
      }

      console.log('[VendorSalesContext] Fetched sales:', data?.length || 0);
      return (data || []) as VendorSale[];
    } catch (error) {
      console.error('[VendorSalesContext] Exception fetching sales:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMySales = useCallback(async (): Promise<VendorSale[]> => {
    if (!vendorAuth?.profile?.id) {
      console.log('[VendorSalesContext] No vendor profile, cannot fetch my sales');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('[VendorSalesContext] Fetching my sales');

      const { data, error } = await supabase
        .from('vendor_sales')
        .select('*')
        .eq('vendor_id', vendorAuth.profile.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('[VendorSalesContext] Error fetching my sales:', error);
        return [];
      }

      console.log('[VendorSalesContext] Fetched my sales:', data?.length || 0);
      return (data || []) as VendorSale[];
    } catch (error) {
      console.error('[VendorSalesContext] Exception fetching my sales:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const fetchActiveSales = useCallback(async (): Promise<VendorSale[]> => {
    return fetchSales({ active: true });
  }, [fetchSales]);

  const createSale = useCallback(async (
    sale: Omit<VendorSale, 'id' | 'vendor_id' | 'active' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; sale?: VendorSale }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[VendorSalesContext] Creating sale:', sale.title);

      const { data, error } = await supabase
        .from('vendor_sales')
        .insert({
          ...sale,
          vendor_id: vendorAuth.profile.id,
        })
        .select()
        .single();

      if (error) {
        console.error('[VendorSalesContext] Error creating sale:', error);
        return { success: false, error: error.message };
      }

      console.log('[VendorSalesContext] Sale created successfully');
      return { success: true, sale: data as VendorSale };
    } catch (error) {
      console.error('[VendorSalesContext] Exception creating sale:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const updateSale = useCallback(async (
    id: string,
    updates: Partial<VendorSale>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[VendorSalesContext] Updating sale:', id);

      const { error } = await supabase
        .from('vendor_sales')
        .update(updates)
        .eq('id', id)
        .eq('vendor_id', vendorAuth.profile.id);

      if (error) {
        console.error('[VendorSalesContext] Error updating sale:', error);
        return { success: false, error: error.message };
      }

      console.log('[VendorSalesContext] Sale updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[VendorSalesContext] Exception updating sale:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const deleteSale = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[VendorSalesContext] Deleting sale:', id);

      const { error } = await supabase
        .from('vendor_sales')
        .delete()
        .eq('id', id)
        .eq('vendor_id', vendorAuth.profile.id);

      if (error) {
        console.error('[VendorSalesContext] Error deleting sale:', error);
        return { success: false, error: error.message };
      }

      console.log('[VendorSalesContext] Sale deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('[VendorSalesContext] Exception deleting sale:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const getSaleForProduct = useCallback(async (
    productId: string
  ): Promise<VendorSale | null> => {
    try {
      console.log('[VendorSalesContext] Getting sale for product:', productId);

      const { data: product } = await supabase
        .from('products')
        .select('vendor_id')
        .eq('id', productId)
        .single();

      if (!product) {
        return null;
      }

      const { data, error } = await supabase
        .from('vendor_sales')
        .select('*')
        .eq('vendor_id', product.vendor_id)
        .eq('active', true)
        .or(`applies_to.eq.storewide,and(applies_to.eq.product,product_ids.cs.{${productId}})`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[VendorSalesContext] Error getting sale for product:', error);
        return null;
      }

      return data as VendorSale | null;
    } catch (error) {
      console.error('[VendorSalesContext] Exception getting sale for product:', error);
      return null;
    }
  }, []);

  const calculateSalePrice = useCallback((
    originalPriceCents: number,
    sale: VendorSale
  ): number => {
    if (!sale.active) {
      return originalPriceCents;
    }

    switch (sale.discount_type) {
      case 'percentage':
        if (sale.discount_value) {
          return Math.floor(originalPriceCents * (1 - sale.discount_value / 100));
        }
        return originalPriceCents;

      case 'flat':
        if (sale.discount_value) {
          return Math.max(0, originalPriceCents - Math.floor(sale.discount_value * 100));
        }
        return originalPriceCents;

      case 'bogo':
        return originalPriceCents;

      default:
        return originalPriceCents;
    }
  }, []);

  return {
    isLoading,
    fetchSales,
    fetchMySales,
    fetchActiveSales,
    createSale,
    updateSale,
    deleteSale,
    getSaleForProduct,
    calculateSalePrice,
  };
});
