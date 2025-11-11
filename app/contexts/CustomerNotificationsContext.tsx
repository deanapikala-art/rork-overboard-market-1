import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useCustomerAuth } from './CustomerAuthContext';
import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType =
  | 'OrderPlaced'
  | 'OrderConfirmed'
  | 'OrderShipped'
  | 'OrderDelivered'
  | 'VendorMessage'
  | 'ShippingUpdate'
  | 'DeliveryReminder'
  | 'ReviewRequest'
  | 'VendorFeatured'
  | 'OrderCanceled'
  | 'RefundProcessed';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export type CustomerNotification = {
  notification_id: string;
  customer_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_order: string | null;
  related_vendor: string | null;
  severity: NotificationSeverity;
  timestamp: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerNotificationPreferences = {
  id: string;
  customer_id: string;
  enable_in_app: boolean;
  enable_email: boolean;
  enable_push: boolean;
  notify_order_placed: boolean;
  notify_order_confirmed: boolean;
  notify_order_shipped: boolean;
  notify_order_delivered: boolean;
  notify_vendor_messages: boolean;
  notify_shipping_updates: boolean;
  notify_review_requests: boolean;
  mute_non_critical: boolean;
  created_at: string;
  updated_at: string;
};

type CustomerNotificationsContextValue = {
  notifications: CustomerNotification[];
  unreadCount: number;
  preferences: CustomerNotificationPreferences | null;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (updates: Partial<Omit<CustomerNotificationPreferences, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>) => Promise<{ success: boolean; error?: string }>;
  refreshNotifications: () => Promise<void>;
  createNotification: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      relatedOrder?: string;
      relatedVendor?: string;
      severity?: NotificationSeverity;
    }
  ) => Promise<void>;
};

export const [CustomerNotificationsProvider, useCustomerNotifications] = createContextHook<CustomerNotificationsContextValue>(() => {
  const { user, isAuthenticated } = useCustomerAuth();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [preferences, setPreferences] = useState<CustomerNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[CustomerNotifications] Loading notifications for user:', user.id);
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('customer_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[CustomerNotifications] Error loading notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data as CustomerNotification[]);
        console.log('[CustomerNotifications] Loaded', data.length, 'notifications');
      }
    } catch (error) {
      console.error('[CustomerNotifications] Exception loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setPreferences(null);
      return;
    }

    try {
      console.log('[CustomerNotifications] Loading preferences for user:', user.id);
      let { data, error } = await supabase
        .from('customer_notification_preferences')
        .select('*')
        .eq('customer_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[CustomerNotifications] Error loading preferences:', error);
        return;
      }

      if (!data) {
        console.log('[CustomerNotifications] No preferences found, creating defaults');
        const { data: newPrefs, error: insertError } = await supabase
          .from('customer_notification_preferences')
          .insert({
            customer_id: user.id,
            enable_in_app: true,
            enable_email: true,
            enable_push: true,
            notify_order_placed: true,
            notify_order_confirmed: true,
            notify_order_shipped: true,
            notify_order_delivered: true,
            notify_vendor_messages: true,
            notify_shipping_updates: true,
            notify_review_requests: false,
            mute_non_critical: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[CustomerNotifications] Error creating preferences:', insertError);
          return;
        }

        data = newPrefs;
      }

      setPreferences(data as CustomerNotificationPreferences);
      console.log('[CustomerNotifications] Preferences loaded');
    } catch (error) {
      console.error('[CustomerNotifications] Exception loading preferences:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotifications();
      loadPreferences();
    } else {
      setNotifications([]);
      setPreferences(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, loadNotifications, loadPreferences]);

  useEffect(() => {
    if (!user?.id) {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    console.log('[CustomerNotifications] Setting up realtime subscription');
    const newChannel = supabase
      .channel(`customer_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_notifications',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[CustomerNotifications] Realtime update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as CustomerNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.notification_id === (payload.new as CustomerNotification).notification_id
                  ? (payload.new as CustomerNotification)
                  : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) =>
              prev.filter((notif) => notif.notification_id !== (payload.old as CustomerNotification).notification_id)
            );
          }
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      console.log('[CustomerNotifications] Cleaning up realtime subscription');
      supabase.removeChannel(newChannel);
    };
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      console.log('[CustomerNotifications] Marking notification as read:', notificationId);
      const { error } = await supabase
        .from('customer_notifications')
        .update({ is_read: true })
        .eq('notification_id', notificationId)
        .eq('customer_id', user.id);

      if (error) {
        console.error('[CustomerNotifications] Error marking as read:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('[CustomerNotifications] Exception marking as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('[CustomerNotifications] Marking all notifications as read');
      const { error } = await supabase
        .from('customer_notifications')
        .update({ is_read: true })
        .eq('customer_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('[CustomerNotifications] Error marking all as read:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('[CustomerNotifications] Exception marking all as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      console.log('[CustomerNotifications] Deleting notification:', notificationId);
      const { error } = await supabase
        .from('customer_notifications')
        .delete()
        .eq('notification_id', notificationId)
        .eq('customer_id', user.id);

      if (error) {
        console.error('[CustomerNotifications] Error deleting notification:', error);
        return;
      }

      setNotifications((prev) =>
        prev.filter((notif) => notif.notification_id !== notificationId)
      );
    } catch (error) {
      console.error('[CustomerNotifications] Exception deleting notification:', error);
    }
  }, [user]);

  const updatePreferences = useCallback(async (
    updates: Partial<Omit<CustomerNotificationPreferences, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('[CustomerNotifications] Updating preferences:', updates);
      const { error } = await supabase
        .from('customer_notification_preferences')
        .update(updates)
        .eq('customer_id', user.id);

      if (error) {
        console.error('[CustomerNotifications] Error updating preferences:', error);
        return { success: false, error: error.message };
      }

      await loadPreferences();
      console.log('[CustomerNotifications] Preferences updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[CustomerNotifications] Exception updating preferences:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [user, loadPreferences]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const createNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      relatedOrder?: string;
      relatedVendor?: string;
      severity?: NotificationSeverity;
    }
  ) => {
    if (!user?.id) return;

    try {
      console.log('[CustomerNotifications] Creating notification:', type);
      const { error } = await supabase
        .from('customer_notifications')
        .insert({
          customer_id: user.id,
          type,
          title,
          message,
          related_order: options?.relatedOrder || null,
          related_vendor: options?.relatedVendor || null,
          severity: options?.severity || 'info',
        });

      if (error) {
        console.error('[CustomerNotifications] Error creating notification:', error);
        return;
      }

      console.log('[CustomerNotifications] Notification created successfully');
    } catch (error) {
      console.error('[CustomerNotifications] Exception creating notification:', error);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refreshNotifications,
    createNotification,
  };
});
