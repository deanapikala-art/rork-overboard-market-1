import { supabase } from '@/lib/supabase';

export interface TrackingEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface TrackingResponse {
  carrier: string;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  estimatedDelivery?: string;
  events: TrackingEvent[];
  deliveredAt?: string;
}

export async function fetchTrackingStatus(
  carrier: string,
  trackingNumber: string,
): Promise<TrackingResponse | null> {
  console.log('[DeliveryTracking] Fetching tracking status:', { carrier, trackingNumber });

  try {
    const normalizedCarrier = carrier.toLowerCase().trim();
    
    const response = await fetch('https://api.trackingmore.com/v4/trackings/realtime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Tracking-Api-Key': process.env.EXPO_PUBLIC_TRACKINGMORE_API_KEY || '',
      },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        carrier_code: mapCarrierCode(normalizedCarrier),
      }),
    });

    if (!response.ok) {
      console.error('[DeliveryTracking] API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data || !data.data) {
      console.warn('[DeliveryTracking] No tracking data available');
      return null;
    }

    const trackingData = data.data;
    
    return {
      carrier: carrier,
      trackingNumber: trackingNumber,
      status: mapTrackingStatus(trackingData.delivery_status),
      estimatedDelivery: trackingData.estimated_delivery_date,
      events: (trackingData.events || []).map((event: any) => ({
        status: event.status,
        description: event.description,
        location: event.location,
        timestamp: event.time_utc,
      })),
      deliveredAt: trackingData.delivery_status === 'delivered' ? trackingData.updated_at : undefined,
    };
  } catch (error) {
    console.error('[DeliveryTracking] Error fetching tracking:', error);
    return null;
  }
}

function mapCarrierCode(carrier: string): string {
  const carrierMap: { [key: string]: string } = {
    'usps': 'usps',
    'ups': 'ups',
    'fedex': 'fedex',
    'dhl': 'dhl',
    'dhl express': 'dhl-express',
  };

  return carrierMap[carrier] || carrier;
}

function mapTrackingStatus(
  apiStatus: string,
): 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' {
  const statusMap: { [key: string]: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' } = {
    'notfound': 'pending',
    'transit': 'in_transit',
    'pickup': 'in_transit',
    'undelivered': 'exception',
    'delivered': 'delivered',
    'expired': 'exception',
    'out_for_delivery': 'out_for_delivery',
  };

  return statusMap[apiStatus?.toLowerCase()] || 'pending';
}

export async function updateOrderTrackingStatus(
  orderId: string,
  trackingData: TrackingResponse,
): Promise<boolean> {
  try {
    console.log('[DeliveryTracking] Updating order status:', orderId, trackingData.status);

    const updateData: any = {
      shipping_status: trackingData.status,
      updated_at: new Date().toISOString(),
    };

    if (trackingData.estimatedDelivery) {
      updateData.estimated_delivery_date = trackingData.estimatedDelivery;
    }

    if (trackingData.status === 'delivered' && trackingData.deliveredAt) {
      updateData.delivered_at = trackingData.deliveredAt;
      updateData.delivery_confirmed_by = 'System';
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('[DeliveryTracking] Failed to update order:', error);
      return false;
    }

    console.log('[DeliveryTracking] Order status updated successfully');
    return true;
  } catch (error) {
    console.error('[DeliveryTracking] Error updating order:', error);
    return false;
  }
}

export async function checkAllActiveTrackingOrders(): Promise<void> {
  try {
    console.log('[DeliveryTracking] Checking all active tracking orders');

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('auto_status_updates_enabled', true)
      .not('tracking_number', 'is', null)
      .in('shipping_status', ['shipped', 'in_transit', 'out_for_delivery'])
      .is('delivered_at', null);

    if (error) {
      console.error('[DeliveryTracking] Error fetching orders:', JSON.stringify(error, null, 2));
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('[DeliveryTracking] No orders with active tracking');
      return;
    }

    console.log('[DeliveryTracking] Found', orders.length, 'orders to check');

    for (const order of orders) {
      try {
        const trackingData = await fetchTrackingStatus(
          order.shipping_provider,
          order.tracking_number,
        );

        if (trackingData && trackingData.status !== order.shipping_status) {
          await updateOrderTrackingStatus(order.id, trackingData);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('[DeliveryTracking] Error processing order:', order.id, error);
      }
    }

    console.log('[DeliveryTracking] Finished checking all orders');
  } catch (error) {
    console.error('[DeliveryTracking] Error in checkAllActiveTrackingOrders:', error);
  }
}

export function startTrackingPolling(intervalMinutes: number = 30): ReturnType<typeof setInterval> {
  console.log('[DeliveryTracking] Starting tracking polling every', intervalMinutes, 'minutes');
  
  checkAllActiveTrackingOrders();
  
  const interval = setInterval(() => {
    checkAllActiveTrackingOrders();
  }, intervalMinutes * 60 * 1000);

  return interval;
}

export function stopTrackingPolling(interval: ReturnType<typeof setInterval>): void {
  console.log('[DeliveryTracking] Stopping tracking polling');
  clearInterval(interval);
}

export function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const normalizedCarrier = carrier.toLowerCase().trim();
  const cleanTracking = trackingNumber.replace(/\s/g, '');

  const trackingUrls: { [key: string]: string } = {
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanTracking}`,
    'ups': `https://www.ups.com/track?tracknum=${cleanTracking}`,
    'fedex': `https://www.fedex.com/fedextrack/?tracknumbers=${cleanTracking}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${cleanTracking}`,
    'dhl express': `https://www.dhl.com/en/express/tracking.html?AWB=${cleanTracking}`,
  };

  return trackingUrls[normalizedCarrier] || `https://www.google.com/search?q=${encodeURIComponent(carrier + ' ' + trackingNumber)}`;
}

export async function manuallyMarkAsDelivered(
  orderId: string,
  confirmedBy: 'Vendor' | 'Customer',
): Promise<boolean> {
  try {
    console.log('[DeliveryTracking] Manually marking order as delivered:', orderId);

    const { error } = await supabase
      .from('orders')
      .update({
        shipping_status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_confirmed_by: confirmedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('[DeliveryTracking] Error marking as delivered:', error);
      return false;
    }

    console.log('[DeliveryTracking] Order marked as delivered successfully');
    return true;
  } catch (error) {
    console.error('[DeliveryTracking] Exception marking as delivered:', error);
    return false;
  }
}
