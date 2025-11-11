import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './AdminAuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType = 
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'dispute_filed'
  | 'low_rating'
  | 'new_vendor'
  | 'inactive_vendor'
  | 'featured_vendor_expiring'
  | 'revenue_milestone'
  | 'vendor_review';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AdminNotification {
  id: string;
  notification_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_vendor: string | null;
  related_order: string | null;
  related_customer: string | null;
  severity: NotificationSeverity;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPreference {
  id: string;
  admin_id: string;
  category: 'orders' | 'shipping' | 'vendors' | 'disputes' | 'ratings' | 'milestones';
  enable_in_app: boolean;
  enable_email: boolean;
  enable_push: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminNotificationsContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: AdminPreference[];
  isLoadingPreferences: boolean;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  getNotificationsByType: (type: NotificationType) => AdminNotification[];
  getNotificationsBySeverity: (severity: NotificationSeverity) => AdminNotification[];
  updatePreference: (category: string, settings: Partial<Omit<AdminPreference, 'id' | 'admin_id' | 'category' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
}

const [AdminNotificationsProvider, useAdminNotifications] = createContextHook<AdminNotificationsContextValue>(() => {
  const { isAdmin, isAuthenticated, user } = useAdminAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [preferences, setPreferences] = useState<AdminPreference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState<boolean>(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      console.log('[AdminNotifications] Not authenticated as admin, skipping notifications load');
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AdminNotifications] Loading notifications');
      
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[AdminNotifications] Error loading notifications:', JSON.stringify(error, null, 2));
        setNotifications([]);
      } else {
        console.log('[AdminNotifications] Loaded', data?.length || 0, 'notifications');
        setNotifications((data as AdminNotification[]) || []);
      }
    } catch (error) {
      console.error('[AdminNotifications] Exception loading notifications:', error instanceof Error ? error.message : JSON.stringify(error));
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  const initializeDefaultPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const categories = ['orders', 'shipping', 'vendors', 'disputes', 'ratings', 'milestones'];
      const defaultPreferences = categories.map(category => ({
        admin_id: user.id,
        category,
        enable_in_app: true,
        enable_email: false,
        enable_push: false,
      }));

      const { error } = await supabase
        .from('admin_preferences')
        .insert(defaultPreferences);

      if (error) {
        console.error('[AdminNotifications] Error initializing preferences:', JSON.stringify(error, null, 2));
      } else {
        console.log('[AdminNotifications] Default preferences initialized');
      }
    } catch (error) {
      console.error('[AdminNotifications] Exception initializing preferences:', error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated || !isAdmin || !user?.id) {
      console.log('[AdminNotifications] Not authenticated as admin, skipping preferences load');
      setPreferences([]);
      return;
    }

    setIsLoadingPreferences(true);
    try {
      console.log('[AdminNotifications] Loading preferences for admin:', user.id);
      
      const { data, error } = await supabase
        .from('admin_preferences')
        .select('*')
        .eq('admin_id', user.id);

      if (error) {
        console.error('[AdminNotifications] Error loading preferences:', JSON.stringify(error, null, 2));
        
        await initializeDefaultPreferences();
      } else if (data && data.length > 0) {
        console.log('[AdminNotifications] Loaded', data.length, 'preferences');
        setPreferences((data as AdminPreference[]) || []);
      } else {
        console.log('[AdminNotifications] No preferences found, initializing defaults');
        await initializeDefaultPreferences();
      }
    } catch (error) {
      console.error('[AdminNotifications] Exception loading preferences:', error instanceof Error ? error.message : JSON.stringify(error));
      setPreferences([]);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, [isAuthenticated, isAdmin, user, initializeDefaultPreferences]);



  const setupRealtimeSubscription = useCallback(() => {
    if (!isAuthenticated || !isAdmin) {
      console.log('[AdminNotifications] Not setting up realtime subscription - not admin');
      return;
    }

    if (channel) {
      console.log('[AdminNotifications] Realtime channel already exists');
      return;
    }

    console.log('[AdminNotifications] Setting up realtime subscription');
    
    const newChannel = supabase
      .channel('admin_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          console.log('[AdminNotifications] Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as AdminNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id ? (payload.new as AdminNotification) : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(notif => notif.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[AdminNotifications] Subscription status:', status);
      });

    setChannel(newChannel);
  }, [isAuthenticated, isAdmin, channel]);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        console.log('[AdminNotifications] Cleaning up realtime subscription');
        supabase.removeChannel(channel);
        setChannel(null);
      }
    };
  }, [setupRealtimeSubscription, channel]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!isAuthenticated || !isAdmin) {
      console.error('[AdminNotifications] Cannot mark as read: not authenticated as admin');
      return false;
    }

    try {
      console.log('[AdminNotifications] Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('[AdminNotifications] Error marking as read:', JSON.stringify(error, null, 2));
        return false;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );

      console.log('[AdminNotifications] Notification marked as read');
      return true;
    } catch (error) {
      console.error('[AdminNotifications] Exception marking as read:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, isAdmin]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !isAdmin) {
      console.error('[AdminNotifications] Cannot mark all as read: not authenticated as admin');
      return false;
    }

    try {
      console.log('[AdminNotifications] Marking all notifications as read');
      
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        console.error('[AdminNotifications] Error marking all as read:', JSON.stringify(error, null, 2));
        return false;
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      console.log('[AdminNotifications] All notifications marked as read');
      return true;
    } catch (error) {
      console.error('[AdminNotifications] Exception marking all as read:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, isAdmin]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!isAuthenticated || !isAdmin) {
      console.error('[AdminNotifications] Cannot delete: not authenticated as admin');
      return false;
    }

    try {
      console.log('[AdminNotifications] Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('[AdminNotifications] Error deleting notification:', JSON.stringify(error, null, 2));
        return false;
      }

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      console.log('[AdminNotifications] Notification deleted');
      return true;
    } catch (error) {
      console.error('[AdminNotifications] Exception deleting notification:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, isAdmin]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  const getNotificationsByType = useCallback((type: NotificationType): AdminNotification[] => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  const getNotificationsBySeverity = useCallback((severity: NotificationSeverity): AdminNotification[] => {
    return notifications.filter(notif => notif.severity === severity);
  }, [notifications]);

  const updatePreference = useCallback(async (
    category: string,
    settings: Partial<Omit<AdminPreference, 'id' | 'admin_id' | 'category' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!isAuthenticated || !isAdmin || !user?.id) {
      console.error('[AdminNotifications] Cannot update preference: not authenticated as admin');
      return false;
    }

    try {
      console.log('[AdminNotifications] Updating preference:', category, settings);
      
      const { error } = await supabase
        .from('admin_preferences')
        .update(settings)
        .eq('admin_id', user.id)
        .eq('category', category);

      if (error) {
        console.error('[AdminNotifications] Error updating preference:', JSON.stringify(error, null, 2));
        return false;
      }

      await loadPreferences();

      console.log('[AdminNotifications] Preference updated');
      return true;
    } catch (error) {
      console.error('[AdminNotifications] Exception updating preference:', error instanceof Error ? error.message : JSON.stringify(error));
      return false;
    }
  }, [isAuthenticated, isAdmin, user, loadPreferences]);

  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.is_read).length;
  }, [notifications]);

  return useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    preferences,
    isLoadingPreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    getNotificationsByType,
    getNotificationsBySeverity,
    updatePreference,
    refreshPreferences,
  }), [
    notifications,
    unreadCount,
    isLoading,
    preferences,
    isLoadingPreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    getNotificationsByType,
    getNotificationsBySeverity,
    updatePreference,
    refreshPreferences,
  ]);
});

export { AdminNotificationsProvider, useAdminNotifications };
