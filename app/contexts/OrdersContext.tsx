import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import { CartItem } from '@/app/contexts/CartContext';
import { generateTrackingUrl } from '@/app/utils/deliveryTracking';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  customizations?: {
    code: string;
    label: string;
    value: string | boolean;
    price_delta: number;
  }[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  vendor_id: string;
  vendor_name: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_url: string | null;
  external_transaction_id: string | null;
  status: 'awaiting_vendor_confirmation' | 'completed' | 'cancelled';
  confirmed_by_vendor: boolean;
  confirmed_at: string | null;
  vendor_notes: string | null;
  shipping_status: 'pending' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'pickup_ready' | 'picked_up';
  shipping_provider: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  delivery_confirmed_by: 'System' | 'Vendor' | 'Customer' | null;
  auto_status_updates_enabled: boolean;
  tracking_provider_api: string | null;
  estimated_delivery_date: string | null;
  delivery_notes: string | null;
  is_local_pickup: boolean;
  pickup_confirmation_code: string | null;
  pickup_code_generated_at: string | null;
  pickup_code_verified_at: string | null;
  pickup_code_verified_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateOrderParams {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  paymentMethod: 'external_paypal' | 'external_venmo' | 'external_cashapp' | 'external_website' | 'message_vendor';
  paymentUrl?: string;
}

interface ShippingInfo {
  provider: string;
  trackingNumber: string;
  estimatedDelivery?: string;
  notes?: string;
  enableAutoTracking?: boolean;
}

interface OrdersContextValue {
  customerOrders: Order[];
  vendorOrders: Order[];
  isLoading: boolean;
  isLoadingVendorOrders: boolean;
  createOrder: (params: CreateOrderParams) => Promise<Order | null>;
  confirmOrder: (orderId: string, notes?: string, transactionId?: string) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  addShippingInfo: (orderId: string, shippingInfo: ShippingInfo) => Promise<boolean>;
  markAsDelivered: (orderId: string, confirmedBy: 'Vendor' | 'Customer') => Promise<boolean>;
  markAsPickedUp: (orderId: string) => Promise<boolean>;
  verifyPickupCode: (orderId: string, code: string, vendorId: string) => Promise<{ success: boolean; message: string }>;
  refreshCustomerOrders: () => Promise<void>;
  refreshVendorOrders: () => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
}

const [OrdersProvider, useOrders] = createContextHook<OrdersContextValue>(() => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingVendorOrders, setIsLoadingVendorOrders] = useState<boolean>(false);

  const loadCustomerOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('[Orders] Not authenticated, skipping customer orders load');
      setCustomerOrders([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    try {
      console.log('[Orders] Loading customer orders for user:', user.id);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[DeliveryTracking] Loaded orders:', data?.length || 0);
      if (error) {
        console.error('[DeliveryTracking] Error fetching orders:', JSON.stringify(error, null, 2));
      }

      if (!isMounted) return;

      if (error) {
        console.error('[Orders] Error loading customer orders:', JSON.stringify(error, null, 2));
        setCustomerOrders([]);
      } else {
        console.log('[Orders] Loaded', data?.length || 0, 'customer orders');
        setCustomerOrders(data as Order[] || []);
      }
    } catch (error) {
      if (!isMounted) return;
      console.error('[Orders] Exception loading customer orders:', error instanceof Error ? error.message : JSON.stringify(error));
      setCustomerOrders([]);
    } finally {
      if (isMounted) setIsLoading(false);
    }

  }, [isAuthenticated, user]);

  const loadVendorOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('[Orders] Not authenticated, skipping vendor orders load');
      setVendorOrders([]);
      return;
    }

    let isMounted = true;
    setIsLoadingVendorOrders(true);
    try {
      console.log('[Orders] Loading vendor orders');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error('[Orders] Error loading vendor orders:', JSON.stringify(error, null, 2));
        setVendorOrders([]);
      } else {
        console.log('[Orders] Loaded', data?.length || 0, 'vendor orders');
        setVendorOrders(data as Order[] || []);
      }
    } catch (error) {
      if (!isMounted) return;
      console.error('[Orders] Exception loading vendor orders:', error instanceof Error ? error.message : JSON.stringify(error));
      setVendorOrders([]);
    } finally {
      if (isMounted) setIsLoadingVendorOrders(false);
    }

  }, [isAuthenticated, user]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (isMounted) {
        await loadCustomerOrders();
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [loadCustomerOrders]);

  const createOrder = useCallback(async (params: CreateOrderParams): Promise<Order | null> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot create order: user not authenticated');
      return null;
    }

    try {
      const subtotal = params.items.reduce((sum, item) => {
        const basePrice = item.product.price;
        const customizationPrice = item.customizations?.reduce((cSum, c) => cSum + c.price_delta, 0) || 0;
        return sum + ((basePrice + customizationPrice) * item.quantity);
      }, 0);

      const tax = subtotal * 0.08;
      const shipping = 0;
      const total = subtotal + tax + shipping;

      const orderItems: OrderItem[] = params.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image,
        quantity: item.quantity,
        price: item.product.price,
        customizations: item.customizations,
      }));

      const orderData = {
        customer_id: user.id,
        customer_name: user.email?.split('@')[0] || 'Customer',
        customer_email: user.email || null,
        vendor_id: params.vendorId,
        vendor_name: params.vendorName,
        items: orderItems,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
        payment_method: params.paymentMethod,
        payment_url: params.paymentUrl || null,
        status: 'awaiting_vendor_confirmation' as const,
      };

      console.log('[Orders] Creating order:', orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('[Orders] Error creating order:', JSON.stringify(error, null, 2));
        return null;
      }

      console.log('[Orders] Order created successfully:', data.order_number);
      
      await loadCustomerOrders();

      return data as Order;
    } catch (error) {
      console.error('[Orders] Exception creating order:', error instanceof Error ? error.message : JSON.stringify(error));
      return null;
    }
  }, [isAuthenticated, user, loadCustomerOrders]);

  const confirmOrder = useCallback(async (orderId: string, notes?: string, transactionId?: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot confirm order: user not authenticated');
      return false;
    }

    try {
      console.log('[Orders] Confirming order:', orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          confirmed_by_vendor: true,
          confirmed_at: new Date().toISOString(),
          vendor_notes: notes || null,
          external_transaction_id: transactionId || null,
        })
        .eq('id', orderId);

      if (error) {
        console.error('[Orders] Error confirming order:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Orders] Order confirmed successfully');
      
      await loadVendorOrders();
      await loadCustomerOrders();

      return true;
    } catch (error) {
      console.error('[Orders] Exception confirming order:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, user, loadVendorOrders, loadCustomerOrders]);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot cancel order: user not authenticated');
      return false;
    }

    try {
      console.log('[Orders] Cancelling order:', orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
        })
        .eq('id', orderId);

      if (error) {
        console.error('[Orders] Error cancelling order:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Orders] Order cancelled successfully');
      
      await loadCustomerOrders();

      return true;
    } catch (error) {
      console.error('[Orders] Exception cancelling order:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, user, loadCustomerOrders]);

  const refreshCustomerOrders = useCallback(async () => {
    await loadCustomerOrders();
  }, [loadCustomerOrders]);

  const refreshVendorOrders = useCallback(async () => {
    await loadVendorOrders();
  }, [loadVendorOrders]);

  const addShippingInfo = useCallback(async (orderId: string, shippingInfo: ShippingInfo): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot add shipping info: user not authenticated');
      return false;
    }

    try {
      console.log('[Orders] Adding shipping info to order:', orderId);
      
      const trackingUrl = generateTrackingUrl(shippingInfo.provider, shippingInfo.trackingNumber);
      console.log('[Orders] Generated tracking URL:', trackingUrl);
      
      const { error } = await supabase
        .from('orders')
        .update({
          shipping_status: 'shipped',
          shipping_provider: shippingInfo.provider,
          tracking_number: shippingInfo.trackingNumber,
          tracking_url: trackingUrl,
          shipped_at: new Date().toISOString(),
          estimated_delivery_date: shippingInfo.estimatedDelivery || null,
          delivery_notes: shippingInfo.notes || null,
          auto_status_updates_enabled: shippingInfo.enableAutoTracking || false,
          tracking_provider_api: shippingInfo.enableAutoTracking ? 'TrackingMore' : null,
        })
        .eq('id', orderId);

      if (error) {
        console.error('[Orders] Error adding shipping info:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Orders] Shipping info added successfully');
      
      await loadVendorOrders();
      await loadCustomerOrders();

      return true;
    } catch (error) {
      console.error('[Orders] Exception adding shipping info:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, user, loadVendorOrders, loadCustomerOrders]);

  const markAsDelivered = useCallback(async (orderId: string, confirmedBy: 'Vendor' | 'Customer'): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot mark as delivered: user not authenticated');
      return false;
    }

    try {
      console.log('[Orders] Marking order as delivered:', orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({
          shipping_status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivery_confirmed_by: confirmedBy,
        })
        .eq('id', orderId);

      if (error) {
        console.error('[Orders] Error marking as delivered:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Orders] Order marked as delivered successfully');
      
      await loadVendorOrders();
      await loadCustomerOrders();

      return true;
    } catch (error) {
      console.error('[Orders] Exception marking as delivered:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, user, loadVendorOrders, loadCustomerOrders]);

  const markAsPickedUp = useCallback(async (orderId: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot mark as picked up: user not authenticated');
      return false;
    }

    try {
      console.log('[Orders] Marking order as picked up:', orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({
          shipping_status: 'picked_up',
          delivered_at: new Date().toISOString(),
          delivery_confirmed_by: 'Vendor',
        })
        .eq('id', orderId);

      if (error) {
        console.error('[Orders] Error marking as picked up:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('[Orders] Order marked as picked up successfully');
      
      await loadVendorOrders();

      return true;
    } catch (error) {
      console.error('[Orders] Exception marking as picked up:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, user, loadVendorOrders]);

  const verifyPickupCode = useCallback(async (orderId: string, code: string, vendorId: string): Promise<{ success: boolean; message: string }> => {
    if (!isAuthenticated || !user?.id) {
      console.error('[Orders] Cannot verify pickup code: user not authenticated');
      return { success: false, message: 'User not authenticated' };
    }

    try {
      console.log('[Orders] Verifying pickup code for order:', orderId);
      
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('[Orders] Error fetching order:', fetchError);
        return { success: false, message: 'Order not found' };
      }

      if (!order.is_local_pickup) {
        return { success: false, message: 'This is not a local pickup order' };
      }

      if (order.shipping_status === 'picked_up') {
        return { success: false, message: 'Order already picked up' };
      }

      if (order.pickup_confirmation_code !== code) {
        console.error('[Orders] Invalid pickup code provided');
        return { success: false, message: 'Invalid pickup code' };
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          shipping_status: 'picked_up',
          pickup_code_verified_at: new Date().toISOString(),
          pickup_code_verified_by: vendorId,
          delivered_at: new Date().toISOString(),
          delivery_confirmed_by: 'Vendor',
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[Orders] Error verifying pickup code:', JSON.stringify(updateError, null, 2));
        return { success: false, message: 'Failed to verify pickup code' };
      }

      console.log('[Orders] Pickup code verified successfully');
      
      await loadVendorOrders();
      await loadCustomerOrders();

      return { success: true, message: 'Pickup confirmed successfully' };
    } catch (error) {
      console.error('[Orders] Exception verifying pickup code:', error instanceof Error ? error.message : JSON.stringify(error));
      return { success: false, message: 'An error occurred' };
    }
  }, [isAuthenticated, user, loadVendorOrders, loadCustomerOrders]);

  const getOrderById = useCallback((orderId: string): Order | undefined => {
    return customerOrders.find(order => order.id === orderId) || 
           vendorOrders.find(order => order.id === orderId);
  }, [customerOrders, vendorOrders]);

  return useMemo(() => ({
    customerOrders,
    vendorOrders,
    isLoading,
    isLoadingVendorOrders,
    createOrder,
    confirmOrder,
    cancelOrder,
    addShippingInfo,
    markAsDelivered,
    markAsPickedUp,
    verifyPickupCode,
    refreshCustomerOrders,
    refreshVendorOrders,
    getOrderById,
  }), [
    customerOrders,
    vendorOrders,
    isLoading,
    isLoadingVendorOrders,
    createOrder,
    confirmOrder,
    cancelOrder,
    addShippingInfo,
    markAsDelivered,
    markAsPickedUp,
    verifyPickupCode,
    refreshCustomerOrders,
    refreshVendorOrders,
    getOrderById,
  ]);
});

export { OrdersProvider, useOrders };
