import React, { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';

export interface RecoveryGoal {
  id: string;
  goalType: string;
  goalDescription: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

export interface TrustScoreData {
  trustScore: number;
  trustTier: string;
  verifiedVendor: boolean;
  lastUpdate: string;
  warningsCount: number;
  disputesCount: number;
  ordersFulfilled: number;
  positiveReviews: number;
  acknowledgedLatestPolicies: boolean;
  trustRecoveryActive: boolean;
  trustRecoveryStart: string | null;
  trustRecoveryGoals: RecoveryGoal[];
  trustRecoveryProgress: number;
  trustRecoveryCompleted: boolean;
  trustScoreLastDropReason: string | null;
}

export interface TrustScoreBreakdown {
  fulfillmentPoints: number;
  reviewPoints: number;
  disputePoints: number;
  policyPoints: number;
  warningPoints: number;
  maxPoints: {
    fulfillment: number;
    review: number;
    dispute: number;
    policy: number;
    warning: number;
  };
}

export const [TrustScoreContext, useTrustScore] = createContextHook(() => {
  const vendorAuth = useVendorAuth() || { profile: null };
  const vendorProfile = vendorAuth.profile;
  const [trustData, setTrustData] = useState<TrustScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrustData = useCallback(async () => {
    if (!vendorProfile?.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', vendorProfile.id)
        .single();

      if (error) throw error;

      if (data && isMounted) {
        setTrustData({
          trustScore: data.trust_score || 70,
          trustTier: data.trust_tier || 'New or Improving',
          verifiedVendor: data.verified_vendor || false,
          lastUpdate: data.last_trust_score_update,
          warningsCount: data.warnings_count || 0,
          disputesCount: data.disputes_count || 0,
          ordersFulfilled: data.orders_fulfilled || 0,
          positiveReviews: data.positive_reviews || 0,
          acknowledgedLatestPolicies: data.acknowledged_latest_policies || false,
          trustRecoveryActive: data.trust_recovery_active || false,
          trustRecoveryStart: data.trust_recovery_start,
          trustRecoveryGoals: data.trust_recovery_goals || [],
          trustRecoveryProgress: data.trust_recovery_progress || 0,
          trustRecoveryCompleted: data.trust_recovery_completed || false,
          trustScoreLastDropReason: data.trust_score_last_drop_reason,
        });
      }
    } catch (error) {
      if (!isMounted) return;
      console.error('Error fetching trust data:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [vendorProfile?.id]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (isMounted) {
        await fetchTrustData();
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [fetchTrustData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrustData();
  }, [fetchTrustData]);

  const calculateBreakdown = useCallback((): TrustScoreBreakdown => {
    if (!trustData) {
      return {
        fulfillmentPoints: 0,
        reviewPoints: 0,
        disputePoints: 0,
        policyPoints: 0,
        warningPoints: 0,
        maxPoints: {
          fulfillment: 35,
          review: 25,
          dispute: 15,
          policy: 15,
          warning: 10,
        },
      };
    }

    const totalOrders = Math.max(trustData.ordersFulfilled, 1);
    const fulfillmentRate = trustData.ordersFulfilled / totalOrders;
    const fulfillmentPoints = Math.round(fulfillmentRate * 35);

    const reviewPoints = trustData.positiveReviews > 0 ? 25 : 15;

    const disputeRatio = trustData.disputesCount / totalOrders;
    const disputePoints = Math.max(0, Math.round((1 - disputeRatio) * 15));

    const policyPoints = trustData.acknowledgedLatestPolicies ? 15 : 0;

    const warningPoints = Math.max(0, 10 - trustData.warningsCount * 2);

    return {
      fulfillmentPoints,
      reviewPoints,
      disputePoints,
      policyPoints,
      warningPoints,
      maxPoints: {
        fulfillment: 35,
        review: 25,
        dispute: 15,
        policy: 15,
        warning: 10,
      },
    };
  }, [trustData]);

  const generateRecoveryGoals = useCallback(async () => {
    if (!vendorProfile?.id || !trustData) return;

    const goals: Omit<RecoveryGoal, 'id'>[] = [];

    if (trustData.ordersFulfilled < 5) {
      goals.push({
        goalType: 'orders',
        goalDescription: 'Complete 5 on-time orders',
        targetValue: 5,
        currentValue: trustData.ordersFulfilled,
        completed: false,
      });
    }

    if (trustData.disputesCount > 0) {
      goals.push({
        goalType: 'disputes',
        goalDescription: 'Resolve all open disputes',
        targetValue: 0,
        currentValue: trustData.disputesCount,
        completed: false,
      });
      goals.push({
        goalType: 'dispute_free',
        goalDescription: 'Maintain 30 days dispute-free',
        targetValue: 30,
        currentValue: 0,
        completed: false,
      });
    }

    if (trustData.positiveReviews < 3) {
      goals.push({
        goalType: 'reviews',
        goalDescription: 'Achieve 3 new 4★+ reviews',
        targetValue: 3,
        currentValue: trustData.positiveReviews,
        completed: false,
      });
    }

    if (!trustData.acknowledgedLatestPolicies) {
      goals.push({
        goalType: 'policies',
        goalDescription: 'Re-acknowledge all active policies',
        targetValue: 1,
        currentValue: 0,
        completed: false,
      });
    }

    if (trustData.warningsCount > 0) {
      goals.push({
        goalType: 'warnings',
        goalDescription: 'Zero new reports in 30 days',
        targetValue: 30,
        currentValue: 0,
        completed: false,
      });
    }

    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          trust_recovery_goals: goals,
        })
        .eq('id', vendorProfile.id);

      if (error) throw error;

      await refresh();
    } catch (error) {
      console.error('Error generating recovery goals:', error);
    }
  }, [vendorProfile?.id, trustData, refresh]);

  const updateRecoveryGoalProgress = useCallback(
    async (goalIndex: number, newValue: number) => {
      if (!vendorProfile?.id || !trustData) return;

      const updatedGoals = [...trustData.trustRecoveryGoals];
      updatedGoals[goalIndex].currentValue = newValue;
      updatedGoals[goalIndex].completed = newValue >= updatedGoals[goalIndex].targetValue;

      const completedCount = updatedGoals.filter((g) => g.completed).length;
      const totalGoals = updatedGoals.length;
      const progress = totalGoals > 0 ? (completedCount / totalGoals) * 100 : 0;

      try {
        const { error } = await supabase
          .from('vendor_profiles')
          .update({
            trust_recovery_goals: updatedGoals,
            trust_recovery_progress: progress,
          })
          .eq('id', vendorProfile.id);

        if (error) throw error;

        await refresh();
      } catch (error) {
        console.error('Error updating recovery goal:', error);
      }
    },
    [vendorProfile?.id, trustData, refresh]
  );

  const completeRecovery = useCallback(async () => {
    if (!vendorProfile?.id) return;

    try {
      const { error } = await supabase.rpc('update_vendor_trust_score', {
        vendor_uuid: vendorProfile.id,
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('vendor_profiles')
        .update({
          trust_recovery_active: false,
          trust_recovery_completed: true,
        })
        .eq('id', vendorProfile.id);

      if (updateError) throw updateError;

      await refresh();
    } catch (error) {
      console.error('Error completing recovery:', error);
    }
  }, [vendorProfile?.id, refresh]);

  const requestVerification = useCallback(async () => {
    if (!vendorProfile?.id) return;

    try {
      await supabase.from('trust_admin_actions').insert({
        vendor_id: vendorProfile.id,
        action_type: 'verification_requested',
        notes: 'Vendor requested verification badge',
      });

      console.log('Verification request submitted');
    } catch (error) {
      console.error('Error requesting verification:', error);
    }
  }, [vendorProfile?.id]);

  return {
    trustData,
    loading,
    refreshing,
    refresh,
    calculateBreakdown,
    generateRecoveryGoals,
    updateRecoveryGoalProgress,
    completeRecovery,
    requestVerification,
  };
});
