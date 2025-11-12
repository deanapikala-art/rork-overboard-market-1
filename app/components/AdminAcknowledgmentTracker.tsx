import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FileText, Users, CheckCircle, Clock, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Colors from '@/app/constants/colors';
import { PolicyType } from '@/app/contexts/PolicyAcknowledgmentContext';

interface PolicyStats {
  policy_type: PolicyType;
  version: number;
  total_users: number;
  acknowledged_count: number;
  pending_count: number;
  last_updated: string;
}

export function AdminAcknowledgmentTracker() {
  const [stats, setStats] = useState<PolicyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      console.log('[AdminAckTracker] Loading acknowledgment stats');
      
      const { data, error } = await supabase
        .from('policy_acknowledgment_stats')
        .select('*')
        .order('policy_type', { ascending: true });

      if (error) {
        console.error('[AdminAckTracker] Error loading stats:', error);
        return;
      }

      setStats((data as PolicyStats[]) || []);
      console.log('[AdminAckTracker] Loaded', data?.length || 0, 'policy stats');
    } catch (error) {
      console.error('[AdminAckTracker] Exception loading stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
  };

  const recalculateStats = async () => {
    setIsRefreshing(true);
    try {
      console.log('[AdminAckTracker] Recalculating stats');
      
      const { data: policies, error: policiesError } = await supabase
        .from('policy_texts')
        .select('policy_type, version')
        .eq('is_active', true);

      if (policiesError) {
        console.error('[AdminAckTracker] Error loading policies:', policiesError);
        return;
      }

      const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error('[AdminAckTracker] Error loading users:', usersError);
        return;
      }

      const totalUsers = allUsers.users.length;

      for (const policy of policies || []) {
        const { data: acks, error: acksError } = await supabase
          .from('user_policy_acknowledgments')
          .select('acknowledged_version')
          .eq('policy_type', policy.policy_type);

        if (acksError) {
          console.error('[AdminAckTracker] Error loading acknowledgments:', acksError);
          continue;
        }

        const acknowledgedCount = acks?.filter(a => a.acknowledged_version >= policy.version).length || 0;
        const pendingCount = totalUsers - acknowledgedCount;

        await supabase
          .from('policy_acknowledgment_stats')
          .upsert({
            policy_type: policy.policy_type,
            version: policy.version,
            total_users: totalUsers,
            acknowledged_count: acknowledgedCount,
            pending_count: pendingCount,
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'policy_type,version',
          });
      }

      await loadStats();
      console.log('[AdminAckTracker] Stats recalculated');
    } catch (error) {
      console.error('[AdminAckTracker] Exception recalculating stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPolicyIcon = (policyType: PolicyType) => {
    switch (policyType) {
      case 'privacy':
        return '🔒';
      case 'terms':
        return '📄';
      case 'codeOfConduct':
        return '🌊';
    }
  };

  const getPolicyTitle = (policyType: PolicyType) => {
    switch (policyType) {
      case 'privacy':
        return 'Privacy Policy';
      case 'terms':
        return 'Terms of Use';
      case 'codeOfConduct':
        return 'Code of Conduct';
    }
  };

  const getCompletionPercentage = (stat: PolicyStats) => {
    if (stat.total_users === 0) return 0;
    return Math.round((stat.acknowledged_count / stat.total_users) * 100);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.nautical.teal} />
        <Text style={styles.loadingText}>Loading acknowledgment stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.nautical.teal}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <FileText size={24} color={Colors.nautical.teal} />
            <Text style={styles.headerTitle}>Policy Acknowledgment Tracker</Text>
          </View>
          
          <TouchableOpacity
            style={styles.recalculateButton}
            onPress={recalculateStats}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={Colors.nautical.teal} />
            <Text style={styles.recalculateButtonText}>Recalculate</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerSubtitle}>
          Track which users have acknowledged the latest policy versions
        </Text>
      </View>

      {stats.length === 0 ? (
        <View style={styles.emptyState}>
          <FileText size={48} color={Colors.light.muted} />
          <Text style={styles.emptyStateTitle}>No Policy Stats Available</Text>
          <Text style={styles.emptyStateText}>
            Policy acknowledgment stats will appear here once policies are published.
          </Text>
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {stats.map((stat) => {
            const completionPercentage = getCompletionPercentage(stat);
            const isComplete = completionPercentage === 100;

            return (
              <View key={`${stat.policy_type}-${stat.version}`} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <Text style={styles.statIcon}>{getPolicyIcon(stat.policy_type)}</Text>
                    <View>
                      <Text style={styles.statTitle}>{getPolicyTitle(stat.policy_type)}</Text>
                      <Text style={styles.statVersion}>Version {stat.version}</Text>
                    </View>
                  </View>
                  
                  {isComplete && (
                    <View style={styles.completeBadge}>
                      <CheckCircle size={16} color={Colors.success} />
                    </View>
                  )}
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${completionPercentage}%` },
                        isComplete && styles.progressFillComplete,
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{completionPercentage}%</Text>
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Users size={16} color={Colors.light.muted} />
                    <Text style={styles.statLabel}>Total Users</Text>
                    <Text style={styles.statValue}>{stat.total_users}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.statLabel}>Acknowledged</Text>
                    <Text style={[styles.statValue, styles.statValueSuccess]}>
                      {stat.acknowledged_count}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Clock size={16} color={Colors.warning} />
                    <Text style={styles.statLabel}>Pending</Text>
                    <Text style={[styles.statValue, styles.statValueWarning]}>
                      {stat.pending_count}
                    </Text>
                  </View>
                </View>

                <Text style={styles.lastUpdated}>
                  Last updated: {new Date(stat.last_updated).toLocaleDateString()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.light.cream,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  recalculateButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 16,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  statIcon: {
    fontSize: 28,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statVersion: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  completeBadge: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.nautical.teal,
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: Colors.success,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    minWidth: 45,
    textAlign: 'right' as const,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    gap: 4,
    alignItems: 'center' as const,
    padding: 12,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 4,
  },
  statValueSuccess: {
    color: Colors.success,
  },
  statValueWarning: {
    color: Colors.warning,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});
