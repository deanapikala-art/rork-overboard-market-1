import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import { useCustomerAuth } from './CustomerAuthContext';
import { useVendorAuth } from './VendorAuthContext';
import { useAdminAuth } from './AdminAuthContext';

export type ReportType = 
  | 'vendor_misconduct' 
  | 'buyer_misconduct' 
  | 'product_violation' 
  | 'harassment' 
  | 'scam' 
  | 'payment_issue' 
  | 'other';

export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type ReportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ReporterType = 'customer' | 'vendor' | 'admin';
export type TargetType = 'vendor' | 'customer' | 'product' | 'order';

export type Report = {
  id: string;
  reporter_id: string;
  reporter_type: ReporterType;
  reporter_email?: string;
  target_id: string;
  target_type: TargetType;
  target_name?: string;
  report_type: ReportType;
  reason: string;
  description: string;
  evidence_urls?: string[];
  order_id?: string;
  message_id?: string;
  status: ReportStatus;
  priority: ReportPriority;
  assigned_admin_id?: string;
  admin_notes?: string;
  resolution_notes?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  resolved_at?: string;
};

export type CreateReportInput = {
  target_id: string;
  target_type: TargetType;
  target_name?: string;
  report_type: ReportType;
  reason: string;
  description: string;
  evidence_urls?: string[];
  order_id?: string;
  message_id?: string;
};

export type UpdateReportInput = {
  status?: ReportStatus;
  priority?: ReportPriority;
  assigned_admin_id?: string;
  admin_notes?: string;
  resolution_notes?: string;
  action_taken?: string;
};

type ReportsContextValue = {
  reports: Report[];
  myReports: Report[];
  isLoading: boolean;
  error: string | null;
  createReport: (input: CreateReportInput) => Promise<{ success: boolean; error?: string }>;
  updateReport: (reportId: string, input: UpdateReportInput) => Promise<{ success: boolean; error?: string }>;
  getReportById: (reportId: string) => Promise<Report | null>;
  getReportsByTarget: (targetId: string, targetType: TargetType) => Promise<Report[]>;
  refreshReports: () => Promise<void>;
  getReportStats: () => {
    total: number;
    open: number;
    inReview: number;
    resolved: number;
    dismissed: number;
    byType: Record<ReportType, number>;
    byPriority: Record<ReportPriority, number>;
  };
};

export const [ReportsProvider, useReports] = createContextHook<ReportsContextValue>(() => {
  const customerAuth = useCustomerAuth();
  const vendorAuth = useVendorAuth();
  const adminAuth = useAdminAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentUser = useCallback(() => {
    if (adminAuth.isAuthenticated && adminAuth.user) {
      return {
        id: adminAuth.user.id,
        type: 'admin' as ReporterType,
        email: adminAuth.profile?.email,
      };
    }
    if (vendorAuth.isAuthenticated && vendorAuth.user) {
      return {
        id: vendorAuth.user.id,
        type: 'vendor' as ReporterType,
        email: vendorAuth.profile?.email,
      };
    }
    if (customerAuth.isAuthenticated && customerAuth.user) {
      return {
        id: customerAuth.user.id,
        type: 'customer' as ReporterType,
        email: customerAuth.profile?.email,
      };
    }
    return null;
  }, [adminAuth, vendorAuth, customerAuth]);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const currentUser = getCurrentUser();

      if (!currentUser) {
        setReports([]);
        setMyReports([]);
        setIsLoading(false);
        return;
      }

      if (currentUser.type === 'admin') {
        const { data: allReports, error: allError } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (allError) {
          console.error('[Reports] Error loading all reports:', allError);
          setError(allError.message);
        } else {
          setReports((allReports as Report[]) || []);
        }
      }

      const { data: userReports, error: userError } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('[Reports] Error loading user reports:', userError);
        setError(userError.message);
      } else {
        setMyReports((userReports as Report[]) || []);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('[Reports] Exception loading reports:', err);
      setError('Failed to load reports');
      setIsLoading(false);
    }
  }, [getCurrentUser]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const createReport = useCallback(
    async (input: CreateReportInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          return { success: false, error: 'You must be logged in to submit a report' };
        }

        console.log('[Reports] Creating report:', input);

        const { data, error: insertError } = await supabase
          .from('reports')
          .insert({
            reporter_id: currentUser.id,
            reporter_type: currentUser.type,
            reporter_email: currentUser.email,
            target_id: input.target_id,
            target_type: input.target_type,
            target_name: input.target_name,
            report_type: input.report_type,
            reason: input.reason,
            description: input.description,
            evidence_urls: input.evidence_urls || [],
            order_id: input.order_id,
            message_id: input.message_id,
            status: 'open',
            priority: 'normal',
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Reports] Error creating report:', insertError);
          return { success: false, error: insertError.message };
        }

        console.log('[Reports] Report created successfully:', data.id);
        await loadReports();
        return { success: true };
      } catch (err) {
        console.error('[Reports] Exception creating report:', err);
        return { success: false, error: 'Failed to submit report' };
      }
    },
    [getCurrentUser, loadReports]
  );

  const updateReport = useCallback(
    async (reportId: string, input: UpdateReportInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.type !== 'admin') {
          return { success: false, error: 'Only admins can update reports' };
        }

        console.log('[Reports] Updating report:', reportId, input);

        const { error: updateError } = await supabase
          .from('reports')
          .update(input)
          .eq('id', reportId);

        if (updateError) {
          console.error('[Reports] Error updating report:', updateError);
          return { success: false, error: updateError.message };
        }

        console.log('[Reports] Report updated successfully');
        await loadReports();
        return { success: true };
      } catch (err) {
        console.error('[Reports] Exception updating report:', err);
        return { success: false, error: 'Failed to update report' };
      }
    },
    [getCurrentUser, loadReports]
  );

  const getReportById = useCallback(
    async (reportId: string): Promise<Report | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (fetchError) {
          console.error('[Reports] Error fetching report:', fetchError);
          return null;
        }

        return data as Report;
      } catch (err) {
        console.error('[Reports] Exception fetching report:', err);
        return null;
      }
    },
    []
  );

  const getReportsByTarget = useCallback(
    async (targetId: string, targetType: TargetType): Promise<Report[]> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .eq('target_id', targetId)
          .eq('target_type', targetType)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[Reports] Error fetching target reports:', fetchError);
          return [];
        }

        return (data as Report[]) || [];
      } catch (err) {
        console.error('[Reports] Exception fetching target reports:', err);
        return [];
      }
    },
    []
  );

  const refreshReports = useCallback(async () => {
    await loadReports();
  }, [loadReports]);

  const getReportStats = useCallback(() => {
    const stats = {
      total: reports.length,
      open: 0,
      inReview: 0,
      resolved: 0,
      dismissed: 0,
      byType: {
        vendor_misconduct: 0,
        buyer_misconduct: 0,
        product_violation: 0,
        harassment: 0,
        scam: 0,
        payment_issue: 0,
        other: 0,
      } as Record<ReportType, number>,
      byPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0,
      } as Record<ReportPriority, number>,
    };

    reports.forEach((report) => {
      if (report.status === 'open') stats.open++;
      else if (report.status === 'in_review') stats.inReview++;
      else if (report.status === 'resolved') stats.resolved++;
      else if (report.status === 'dismissed') stats.dismissed++;

      stats.byType[report.report_type]++;
      stats.byPriority[report.priority]++;
    });

    return stats;
  }, [reports]);

  return {
    reports,
    myReports,
    isLoading,
    error,
    createReport,
    updateReport,
    getReportById,
    getReportsByTarget,
    refreshReports,
    getReportStats,
  };
});
