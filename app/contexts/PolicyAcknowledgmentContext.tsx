import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { PolicyType } from '@/app/constants/policyTemplates';

export type { PolicyType };

export interface PolicyText {
  id: string;
  policy_type: PolicyType;
  version: number;
  title: string;
  content: any;
  requires_acknowledgment: boolean;
  is_active: boolean;
  last_updated: string;
  updated_by: string | null;
  created_at: string;
}

export interface UserPolicyAcknowledgment {
  id: string;
  user_id: string;
  policy_type: PolicyType;
  acknowledged_version: number;
  acknowledged_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyUpdateNotification {
  id: string;
  notification_id: string;
  user_id: string;
  policy_type: PolicyType;
  old_version: number | null;
  new_version: number;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  is_acknowledged: boolean;
  created_at: string;
  read_at: string | null;
  acknowledged_at: string | null;
}

export interface PolicyAcknowledgmentStats {
  id: string;
  policy_type: PolicyType;
  version: number;
  total_users: number;
  acknowledged_count: number;
  pending_count: number;
  last_updated: string;
  created_at: string;
}

interface PolicyAcknowledgmentContextValue {
  currentPolicies: PolicyText[];
  userAcknowledgments: UserPolicyAcknowledgment[];
  pendingNotifications: PolicyUpdateNotification[];
  isLoading: boolean;
  needsAcknowledgment: (policyType: PolicyType) => boolean;
  acknowledgPolicy: (policyType: PolicyType, version: number) => Promise<{ success: boolean; error?: string }>;
  dismissNotification: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  refreshPolicies: () => Promise<void>;
  getCurrentVersion: (policyType: PolicyType) => number | null;
  getAcknowledgedVersion: (policyType: PolicyType) => number | null;
  hasPendingPolicies: boolean;
}

export const [PolicyAcknowledgmentProvider, usePolicyAcknowledgment] = createContextHook<PolicyAcknowledgmentContextValue>(() => {
  const [currentPolicies, setCurrentPolicies] = useState<PolicyText[]>([]);
  const [userAcknowledgments, setUserAcknowledgments] = useState<UserPolicyAcknowledgment[]>([]);
  const [pendingNotifications, setPendingNotifications] = useState<PolicyUpdateNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCurrentPolicies = useCallback(async () => {
    try {
      console.log('[PolicyAcknowledgment] Loading current policies');
      
      const { data, error } = await supabase
        .from('policy_texts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PolicyAcknowledgment] Error loading policies:', JSON.stringify(error, null, 2));
        setCurrentPolicies([]);
        return;
      }

      const policies = (data || []).map((policy: any) => ({
        ...policy,
        version: policy?.version ?? 1,
        is_active: policy?.is_active ?? true,
      })) as PolicyText[];

      const uniquePolicies = policies.reduce((acc: PolicyText[], policy) => {
        if (!acc.find(p => p.policy_type === policy.policy_type)) {
          acc.push(policy);
        }
        return acc;
      }, []);

      setCurrentPolicies(uniquePolicies);
      console.log('[PolicyAcknowledgment] Loaded', uniquePolicies.length, 'current policies');
    } catch (error) {
      console.error('[PolicyAcknowledgment] Exception loading policies:', error);
      setCurrentPolicies([]);
    }
  }, []);

  const loadUserAcknowledgments = useCallback(async () => {
    if (!userId) {
      setUserAcknowledgments([]);
      return;
    }

    try {
      console.log('[PolicyAcknowledgment] Loading user acknowledgments for:', userId);
      const { data, error } = await supabase
        .from('user_policy_acknowledgments')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('[PolicyAcknowledgment] Error loading acknowledgments:', JSON.stringify(error, null, 2));
        setUserAcknowledgments([]);
        return;
      }

      setUserAcknowledgments((data as UserPolicyAcknowledgment[]) || []);
      console.log('[PolicyAcknowledgment] Loaded', data?.length || 0, 'acknowledgments');
    } catch (error) {
      console.error('[PolicyAcknowledgment] Exception loading acknowledgments:', error);
    }
  }, [userId]);

  const loadPendingNotifications = useCallback(async () => {
    if (!userId) {
      setPendingNotifications([]);
      return;
    }

    try {
      console.log('[PolicyAcknowledgment] Loading pending notifications for:', userId);
      const { data, error } = await supabase
        .from('policy_update_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PolicyAcknowledgment] Error loading notifications:', JSON.stringify(error, null, 2));
        setPendingNotifications([]);
        return;
      }

      setPendingNotifications((data as PolicyUpdateNotification[]) || []);
      console.log('[PolicyAcknowledgment] Loaded', data?.length || 0, 'pending notifications');
    } catch (error) {
      console.error('[PolicyAcknowledgment] Exception loading notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadCurrentPolicies();
      await loadUserAcknowledgments();
      await loadPendingNotifications();
      setIsLoading(false);
    };

    loadData();
  }, [loadCurrentPolicies, loadUserAcknowledgments, loadPendingNotifications]);

  useEffect(() => {
    if (!userId) {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    console.log('[PolicyAcknowledgment] Setting up realtime subscription');
    const newChannel = supabase
      .channel(`policy_updates:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policy_update_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[PolicyAcknowledgment] Realtime update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            setPendingNotifications((prev) => [payload.new as PolicyUpdateNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPendingNotifications((prev) =>
              prev.map((notif) =>
                notif.id === (payload.new as PolicyUpdateNotification).id
                  ? (payload.new as PolicyUpdateNotification)
                  : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPendingNotifications((prev) =>
              prev.filter((notif) => notif.id !== (payload.old as PolicyUpdateNotification).id)
            );
          }
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      console.log('[PolicyAcknowledgment] Cleaning up realtime subscription');
      supabase.removeChannel(newChannel);
    };
  }, [userId]);

  const needsAcknowledgment = useCallback((policyType: PolicyType): boolean => {
    const currentPolicy = currentPolicies.find(p => p.policy_type === policyType);
    const userAck = userAcknowledgments.find(a => a.policy_type === policyType);

    if (!currentPolicy || !currentPolicy.requires_acknowledgment) {
      return false;
    }

    return !userAck || userAck.acknowledged_version < currentPolicy.version;
  }, [currentPolicies, userAcknowledgments]);

  const acknowledgPolicy = useCallback(async (
    policyType: PolicyType,
    version: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('[PolicyAcknowledgment] Acknowledging policy:', policyType, 'v', version);

      const { error: upsertError } = await supabase
        .from('user_policy_acknowledgments')
        .upsert({
          user_id: userId,
          policy_type: policyType,
          acknowledged_version: version,
          acknowledged_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,policy_type',
        });

      if (upsertError) {
        console.error('[PolicyAcknowledgment] Error acknowledging policy:', upsertError);
        return { success: false, error: upsertError.message };
      }

      const { error: notifError } = await supabase
        .from('policy_update_notifications')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('policy_type', policyType)
        .eq('is_acknowledged', false);

      if (notifError) {
        console.error('[PolicyAcknowledgment] Error updating notification:', notifError);
      }

      await loadUserAcknowledgments();
      await loadPendingNotifications();

      console.log('[PolicyAcknowledgment] Policy acknowledged successfully');
      return { success: true };
    } catch (error) {
      console.error('[PolicyAcknowledgment] Exception acknowledging policy:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [userId, loadUserAcknowledgments, loadPendingNotifications]);

  const dismissNotification = useCallback(async (
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('[PolicyAcknowledgment] Dismissing notification:', notificationId);
      const { error } = await supabase
        .from('policy_update_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('[PolicyAcknowledgment] Error dismissing notification:', error);
        return { success: false, error: error.message };
      }

      setPendingNotifications((prev) => prev.filter(n => n.id !== notificationId));
      console.log('[PolicyAcknowledgment] Notification dismissed');
      return { success: true };
    } catch (error) {
      console.error('[PolicyAcknowledgment] Exception dismissing notification:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [userId]);

  const markNotificationRead = useCallback(async (
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('[PolicyAcknowledgment] Marking notification as read:', notificationId);
      const { error } = await supabase
        .from('policy_update_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('[PolicyAcknowledgment] Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      setPendingNotifications((prev) =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      console.log('[PolicyAcknowledgment] Notification marked as read');
      return { success: true };
    } catch (error) {
      console.error('[PolicyAcknowledgment] Exception marking notification as read:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [userId]);

  const refreshPolicies = useCallback(async () => {
    await loadCurrentPolicies();
    await loadUserAcknowledgments();
    await loadPendingNotifications();
  }, [loadCurrentPolicies, loadUserAcknowledgments, loadPendingNotifications]);

  const getCurrentVersion = useCallback((policyType: PolicyType): number | null => {
    const policy = currentPolicies.find(p => p.policy_type === policyType);
    return policy?.version || null;
  }, [currentPolicies]);

  const getAcknowledgedVersion = useCallback((policyType: PolicyType): number | null => {
    const ack = userAcknowledgments.find(a => a.policy_type === policyType);
    return ack?.acknowledged_version || null;
  }, [userAcknowledgments]);

  const hasPendingPolicies = useMemo(() => {
    return currentPolicies.some(policy => needsAcknowledgment(policy.policy_type));
  }, [currentPolicies, needsAcknowledgment]);

  return {
    currentPolicies,
    userAcknowledgments,
    pendingNotifications,
    isLoading,
    needsAcknowledgment,
    acknowledgPolicy,
    dismissNotification,
    markNotificationRead,
    refreshPolicies,
    getCurrentVersion,
    getAcknowledgedVersion,
    hasPendingPolicies,
  };
});
