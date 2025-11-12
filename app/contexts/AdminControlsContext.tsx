import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './AdminAuthContext';

export interface VendorNotification {
  id: string;
  vendor_id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  sent_by_admin_id: string;
  sent_by_admin_email: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface VendorManagement {
  id: string;
  vendor_id: string;
  is_active: boolean;
  is_suspended: boolean;
  is_featured: boolean;
  featured_until: string | null;
  featured_position: number | null;
  admin_notes: string | null;
  suspension_reason: string | null;
  suspended_by_admin_id: string | null;
  suspended_at: string | null;
  featured_by_admin_id: string | null;
  featured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewModeration {
  id: string;
  review_id: string;
  vendor_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_reported: boolean;
  is_deleted: boolean;
  report_reason: string | null;
  reported_by_user_id: string | null;
  reported_at: string | null;
  moderated_by_admin_id: string | null;
  moderated_at: string | null;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderDispute {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  vendor_id: string;
  vendor_name: string;
  issue: string;
  description: string | null;
  customer_evidence: string | null;
  vendor_response: string | null;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution_notes: string | null;
  resolved_by_admin_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action_type: string;
  target_type: string;
  target_id: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AdminControlsContextValue {
  vendorManagement: VendorManagement[];
  notifications: VendorNotification[];
  reviews: ReviewModeration[];
  disputes: OrderDispute[];
  activityLog: AdminActivityLog[];
  isLoading: boolean;
  
  suspendVendor: (vendorId: string, reason: string) => Promise<boolean>;
  activateVendor: (vendorId: string) => Promise<boolean>;
  featureVendor: (vendorId: string, durationDays: number) => Promise<boolean>;
  unfeatureVendor: (vendorId: string) => Promise<boolean>;
  
  sendNotification: (vendorId: string, title: string, message: string, severity: 'info' | 'warning' | 'urgent') => Promise<boolean>;
  sendBulkNotification: (title: string, message: string, severity: 'info' | 'warning' | 'urgent') => Promise<boolean>;
  
  deleteReview: (reviewId: string, reason: string) => Promise<boolean>;
  approveReview: (reviewId: string) => Promise<boolean>;
  flagReview: (reviewId: string, reason: string) => Promise<boolean>;
  
  createDispute: (orderId: string, issue: string, description: string) => Promise<boolean>;
  updateDisputeStatus: (disputeId: string, status: 'open' | 'under_review' | 'resolved' | 'closed', notes?: string) => Promise<boolean>;
  resolveDispute: (disputeId: string, resolutionNotes: string) => Promise<boolean>;
  
  getVendorManagement: (vendorId: string) => VendorManagement | null;
  getVendorNotifications: (vendorId: string) => VendorNotification[];
  getRecentActivity: (limit?: number) => AdminActivityLog[];
  
  refresh: () => Promise<void>;
}

const [AdminControlsProvider, useAdminControls] = createContextHook<AdminControlsContextValue>(() => {
  const { isAdmin, user, profile } = useAdminAuth();
  const [vendorManagement, setVendorManagement] = useState<VendorManagement[]>([]);
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [reviews, setReviews] = useState<ReviewModeration[]>([]);
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [activityLog, setActivityLog] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!isAdmin || !user) {
      console.log('[AdminControls] Not authenticated as admin');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AdminControls] Loading admin control data');

      const [
        vendorMgmtResult,
        notificationsResult,
        reviewsResult,
        disputesResult,
        activityResult,
      ] = await Promise.all([
        supabase.from('vendor_management').select('*').order('updated_at', { ascending: false }),
        supabase.from('vendor_notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('review_moderation').select('*').eq('is_deleted', false).order('created_at', { ascending: false }).limit(50),
        supabase.from('order_disputes').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (vendorMgmtResult.error) {
        console.error('[AdminControls] Error loading vendor management:', vendorMgmtResult.error);
      } else {
        setVendorManagement(vendorMgmtResult.data as VendorManagement[]);
      }

      if (notificationsResult.error) {
        console.error('[AdminControls] Error loading notifications:', notificationsResult.error);
      } else {
        setNotifications(notificationsResult.data as VendorNotification[]);
      }

      if (reviewsResult.error) {
        console.error('[AdminControls] Error loading reviews:', reviewsResult.error);
      } else {
        setReviews(reviewsResult.data as ReviewModeration[]);
      }

      if (disputesResult.error) {
        console.error('[AdminControls] Error loading disputes:', disputesResult.error);
      } else {
        setDisputes(disputesResult.data as OrderDispute[]);
      }

      if (activityResult.error) {
        console.error('[AdminControls] Error loading activity log:', activityResult.error);
      } else {
        setActivityLog(activityResult.data as AdminActivityLog[]);
      }

      console.log('[AdminControls] Data loaded successfully');
    } catch (error) {
      console.error('[AdminControls] Exception loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (isAdmin && user) {
      loadData();
    }
  }, [isAdmin, user, loadData]);

  const suspendVendor = useCallback(async (vendorId: string, reason: string): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Suspending vendor:', vendorId);
      
      const { error } = await supabase.rpc('suspend_vendor', {
        p_vendor_id: vendorId,
        p_reason: reason,
        p_admin_id: user.id,
        p_admin_email: profile.email,
      });

      if (error) {
        console.error('[AdminControls] Error suspending vendor:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception suspending vendor:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const activateVendor = useCallback(async (vendorId: string): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Activating vendor:', vendorId);
      
      const { error } = await supabase.rpc('activate_vendor', {
        p_vendor_id: vendorId,
        p_admin_id: user.id,
        p_admin_email: profile.email,
      });

      if (error) {
        console.error('[AdminControls] Error activating vendor:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception activating vendor:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const featureVendor = useCallback(async (vendorId: string, durationDays: number): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Featuring vendor:', vendorId, 'for', durationDays, 'days');
      
      const { error } = await supabase.rpc('feature_vendor', {
        p_vendor_id: vendorId,
        p_duration_days: durationDays,
        p_admin_id: user.id,
        p_admin_email: profile.email,
      });

      if (error) {
        console.error('[AdminControls] Error featuring vendor:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception featuring vendor:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const unfeatureVendor = useCallback(async (vendorId: string): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Unfeaturing vendor:', vendorId);
      
      const { error } = await supabase
        .from('vendor_management')
        .update({
          is_featured: false,
          featured_until: null,
        })
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('[AdminControls] Error unfeaturing vendor:', error);
        return false;
      }

      await supabase.rpc('log_admin_activity', {
        p_admin_id: user.id,
        p_admin_email: profile.email,
        p_action_type: 'unfeature_vendor',
        p_target_type: 'vendor',
        p_target_id: vendorId,
        p_previous_state: { is_featured: true },
        p_new_state: { is_featured: false },
        p_notes: 'Vendor unfeatured',
      });

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception unfeaturing vendor:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const sendNotification = useCallback(async (
    vendorId: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'urgent'
  ): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Sending notification to vendor:', vendorId);
      
      const { error } = await supabase.rpc('send_vendor_notification', {
        p_vendor_id: vendorId,
        p_title: title,
        p_message: message,
        p_severity: severity,
        p_admin_id: user.id,
        p_admin_email: profile.email,
      });

      if (error) {
        console.error('[AdminControls] Error sending notification:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception sending notification:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const sendBulkNotification = useCallback(async (
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'urgent'
  ): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Sending bulk notification to all vendors');
      
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id');

      if (vendorsError || !vendors) {
        console.error('[AdminControls] Error fetching vendors:', vendorsError);
        return false;
      }

      const notifications = vendors.map(vendor => ({
        vendor_id: vendor.id,
        title,
        message,
        severity,
        sent_by_admin_id: user.id,
        sent_by_admin_email: profile.email,
      }));

      const { error } = await supabase
        .from('vendor_notifications')
        .insert(notifications);

      if (error) {
        console.error('[AdminControls] Error sending bulk notification:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception sending bulk notification:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const deleteReview = useCallback(async (reviewId: string, reason: string): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Deleting review:', reviewId);
      
      const { error } = await supabase
        .from('review_moderation')
        .update({
          is_deleted: true,
          is_approved: false,
          moderated_by_admin_id: user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: reason,
        })
        .eq('review_id', reviewId);

      if (error) {
        console.error('[AdminControls] Error deleting review:', error);
        return false;
      }

      await supabase.rpc('log_admin_activity', {
        p_admin_id: user.id,
        p_admin_email: profile.email,
        p_action_type: 'delete_review',
        p_target_type: 'review',
        p_target_id: reviewId,
        p_previous_state: { is_deleted: false },
        p_new_state: { is_deleted: true },
        p_notes: reason,
      });

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception deleting review:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const approveReview = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Approving review:', reviewId);
      
      const { error } = await supabase
        .from('review_moderation')
        .update({
          is_approved: true,
          is_reported: false,
          moderated_by_admin_id: user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('review_id', reviewId);

      if (error) {
        console.error('[AdminControls] Error approving review:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception approving review:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const flagReview = useCallback(async (reviewId: string, reason: string): Promise<boolean> => {
    if (!isAdmin || !user || !profile) return false;

    try {
      console.log('[AdminControls] Flagging review:', reviewId);
      
      const { error } = await supabase
        .from('review_moderation')
        .update({
          is_reported: true,
          report_reason: reason,
          moderated_by_admin_id: user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('review_id', reviewId);

      if (error) {
        console.error('[AdminControls] Error flagging review:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception flagging review:', error);
      return false;
    }
  }, [isAdmin, user, profile, loadData]);

  const createDispute = useCallback(async (
    orderId: string,
    issue: string,
    description: string
  ): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      console.log('[AdminControls] Creating dispute for order:', orderId);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('[AdminControls] Error fetching order:', orderError);
        return false;
      }

      const { error } = await supabase
        .from('order_disputes')
        .insert({
          order_id: orderId,
          order_number: order.order_number,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          vendor_id: order.vendor_id,
          vendor_name: order.vendor_name,
          issue,
          description,
          status: 'open',
        });

      if (error) {
        console.error('[AdminControls] Error creating dispute:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception creating dispute:', error);
      return false;
    }
  }, [isAdmin, loadData]);

  const updateDisputeStatus = useCallback(async (
    disputeId: string,
    status: 'open' | 'under_review' | 'resolved' | 'closed',
    notes?: string
  ): Promise<boolean> => {
    if (!isAdmin || !user) return false;

    try {
      console.log('[AdminControls] Updating dispute status:', disputeId, 'to', status);
      
      const updateData: Record<string, unknown> = { status };
      if (notes) {
        updateData.resolution_notes = notes;
      }
      if (status === 'resolved') {
        updateData.resolved_by_admin_id = user.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('order_disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) {
        console.error('[AdminControls] Error updating dispute status:', error);
        return false;
      }

      await loadData();
      return true;
    } catch (error) {
      console.error('[AdminControls] Exception updating dispute status:', error);
      return false;
    }
  }, [isAdmin, user, loadData]);

  const resolveDispute = useCallback(async (disputeId: string, resolutionNotes: string): Promise<boolean> => {
    return updateDisputeStatus(disputeId, 'resolved', resolutionNotes);
  }, [updateDisputeStatus]);

  const getVendorManagement = useCallback((vendorId: string): VendorManagement | null => {
    return vendorManagement.find(vm => vm.vendor_id === vendorId) || null;
  }, [vendorManagement]);

  const getVendorNotifications = useCallback((vendorId: string): VendorNotification[] => {
    return notifications.filter(n => n.vendor_id === vendorId);
  }, [notifications]);

  const getRecentActivity = useCallback((limit: number = 20): AdminActivityLog[] => {
    return activityLog.slice(0, limit);
  }, [activityLog]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return useMemo(() => ({
    vendorManagement,
    notifications,
    reviews,
    disputes,
    activityLog,
    isLoading,
    
    suspendVendor,
    activateVendor,
    featureVendor,
    unfeatureVendor,
    
    sendNotification,
    sendBulkNotification,
    
    deleteReview,
    approveReview,
    flagReview,
    
    createDispute,
    updateDisputeStatus,
    resolveDispute,
    
    getVendorManagement,
    getVendorNotifications,
    getRecentActivity,
    
    refresh,
  }), [
    vendorManagement,
    notifications,
    reviews,
    disputes,
    activityLog,
    isLoading,
    
    suspendVendor,
    activateVendor,
    featureVendor,
    unfeatureVendor,
    
    sendNotification,
    sendBulkNotification,
    
    deleteReview,
    approveReview,
    flagReview,
    
    createDispute,
    updateDisputeStatus,
    resolveDispute,
    
    getVendorManagement,
    getVendorNotifications,
    getRecentActivity,
    
    refresh,
  ]);
});

export { AdminControlsProvider, useAdminControls };
