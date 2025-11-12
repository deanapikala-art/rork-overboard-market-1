import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './AdminAuthContext';

export interface TopVendor {
  vendorId: string;
  vendorName: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface TopRegion {
  state: string;
  orderCount: number;
  revenue: number;
}

export interface SalesByDay {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface SalesByCategory {
  category: string;
  revenue: number;
  percentage: number;
}

export interface AdminStats {
  id: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  total_vendors: number;
  active_vendors: number;
  new_vendors_this_month: number;
  total_customers: number;
  active_shoppers: number;
  fulfillment_rate: number;
  avg_delivery_time: number;
  top_vendors: TopVendor[];
  top_products: TopProduct[];
  top_regions: TopRegion[];
  total_reviews: number;
  avg_rating: number;
  sales_by_day: SalesByDay[];
  sales_by_category: SalesByCategory[];
  updated_at: string;
  created_at: string;
}

interface AdminStatsContextValue {
  stats: AdminStats | null;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  getVendorStats: (vendorId: string) => Promise<VendorStats | null>;
  getTopVendorsByRevenue: (limit?: number) => TopVendor[];
  getTopVendorsByOrders: (limit?: number) => TopVendor[];
  getSalesGrowth: () => { current: number; previous: number; growth: number };
}

interface VendorStats {
  vendorId: string;
  vendorName: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  fulfillmentRate: number;
  avgDeliveryTime: number;
  avgRating: number;
  totalReviews: number;
}

const [AdminStatsProvider, useAdminStats] = createContextHook<AdminStatsContextValue>(() => {
  const { isAdmin, isAuthenticated } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      console.log('[AdminStats] Not authenticated as admin, skipping stats load');
      setStats(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AdminStats] Loading platform statistics');
      
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[AdminStats] Error loading stats:', JSON.stringify(error, null, 2));
        setStats(null);
      } else if (data) {
        console.log('[AdminStats] Stats loaded successfully');
        setStats(data as AdminStats);
      } else {
        console.log('[AdminStats] No stats found, calculating...');
        await refreshStats();
      }
    } catch (error) {
      console.error('[AdminStats] Exception loading stats:', error instanceof Error ? error.message : JSON.stringify(error));
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  const refreshStats = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      console.log('[AdminStats] Not authenticated as admin, cannot refresh stats');
      return;
    }

    try {
      console.log('[AdminStats] Refreshing platform statistics');
      
      const { error } = await supabase.rpc('refresh_admin_stats');

      if (error) {
        console.error('[AdminStats] Error refreshing stats:', JSON.stringify(error, null, 2));
      } else {
        console.log('[AdminStats] Stats refreshed successfully');
        await loadStats();
      }
    } catch (error) {
      console.error('[AdminStats] Exception refreshing stats:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, [isAuthenticated, isAdmin, loadStats]);

  const getVendorStats = useCallback(async (vendorId: string): Promise<VendorStats | null> => {
    if (!isAuthenticated || !isAdmin) {
      console.log('[AdminStats] Not authenticated as admin');
      return null;
    }

    try {
      console.log('[AdminStats] Loading stats for vendor:', vendorId);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('confirmed_by_vendor', true);

      if (error) {
        console.error('[AdminStats] Error loading vendor stats:', JSON.stringify(error, null, 2));
        return null;
      }

      if (!orders || orders.length === 0) {
        return {
          vendorId,
          vendorName: 'Unknown Vendor',
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          fulfillmentRate: 0,
          avgDeliveryTime: 0,
          avgRating: 0,
          totalReviews: 0,
        };
      }

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalRevenue / totalOrders;

      const shippedOrders = orders.filter(o => 
        ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(o.shipping_status)
      );
      const deliveredOrders = orders.filter(o => o.shipping_status === 'delivered');
      const fulfillmentRate = shippedOrders.length > 0 
        ? (deliveredOrders.length / shippedOrders.length) * 100 
        : 0;

      const deliveredWithTimes = orders.filter(o => 
        o.shipping_status === 'delivered' && o.shipped_at && o.delivered_at
      );
      const avgDeliveryTime = deliveredWithTimes.length > 0
        ? deliveredWithTimes.reduce((sum, order) => {
            const shipped = new Date(order.shipped_at).getTime();
            const delivered = new Date(order.delivered_at).getTime();
            return sum + ((delivered - shipped) / (1000 * 60 * 60 * 24));
          }, 0) / deliveredWithTimes.length
        : 0;

      return {
        vendorId,
        vendorName: orders[0].vendor_name,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        avgRating: 0,
        totalReviews: 0,
      };
    } catch (error) {
      console.error('[AdminStats] Exception loading vendor stats:', error instanceof Error ? error.message : JSON.stringify(error));
      return null;
    }
  }, [isAuthenticated, isAdmin]);

  const getTopVendorsByRevenue = useCallback((limit: number = 10): TopVendor[] => {
    if (!stats || !stats.top_vendors) return [];
    return [...stats.top_vendors]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [stats]);

  const getTopVendorsByOrders = useCallback((limit: number = 10): TopVendor[] => {
    if (!stats || !stats.top_vendors) return [];
    return [...stats.top_vendors]
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, limit);
  }, [stats]);

  const getSalesGrowth = useCallback((): { current: number; previous: number; growth: number } => {
    if (!stats || !stats.sales_by_day || stats.sales_by_day.length < 14) {
      return { current: 0, previous: 0, growth: 0 };
    }

    const sortedDays = [...stats.sales_by_day].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const last7Days = sortedDays.slice(0, 7);
    const previous7Days = sortedDays.slice(7, 14);

    const current = last7Days.reduce((sum, day) => sum + day.revenue, 0);
    const previous = previous7Days.reduce((sum, day) => sum + day.revenue, 0);

    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current: Math.round(current * 100) / 100,
      previous: Math.round(previous * 100) / 100,
      growth: Math.round(growth * 10) / 10,
    };
  }, [stats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return useMemo(() => ({
    stats,
    isLoading,
    refreshStats,
    getVendorStats,
    getTopVendorsByRevenue,
    getTopVendorsByOrders,
    getSalesGrowth,
  }), [
    stats,
    isLoading,
    refreshStats,
    getVendorStats,
    getTopVendorsByRevenue,
    getTopVendorsByOrders,
    getSalesGrowth,
  ]);
});

export { AdminStatsProvider, useAdminStats };
