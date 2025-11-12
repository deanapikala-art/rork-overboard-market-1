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
import { BarChart3, Users, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Colors from '@/app/constants/colors';
import { PolicyType } from '@/app/contexts/PolicyAcknowledgmentContext';
import { getPolicyIcon, getPolicyTitle } from '@/app/constants/policyTemplates';

interface PolicyStats {
  policy_type: PolicyType;
  version: number;
  total_users: number;
  acknowledged_count: number;
  pending_count: number;
  last_updated: string;
}

interface OverallStats {
  totalPolicies: number;
  totalUsers: number;
  overallCompletionRate: number;
  totalPending: number;
}

export function AdminAcknowledgmentStats() {
  const [stats, setStats] = useState<PolicyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      console.log('[AdminAckStats] Loading acknowledgment stats');
      
      const { data, error } = await supabase
        .from('policy_acknowledgment_stats')
        .select('*')
        .order('policy_type', { ascending: true });

      if (error) {
        console.error('[AdminAckStats] Error loading stats:', error);
        return;
      }

      const policyStats = (data as PolicyStats[]) || [];
      setStats(policyStats);

      if (policyStats.length > 0) {
        const totalUsers = policyStats[0]?.total_users || 0;
        const totalAcknowledgments = policyStats.reduce((sum, stat) => sum + stat.acknowledged_count, 0);
        const totalPending = policyStats.reduce((sum, stat) => sum + stat.pending_count, 0);
        const maxPossibleAcks = totalUsers * policyStats.length;
        const overallCompletionRate = maxPossibleAcks > 0 
          ? Math.round((totalAcknowledgments / maxPossibleAcks) * 100) 
          : 0;

        setOverallStats({
          totalPolicies: policyStats.length,
          totalUsers,
          overallCompletionRate,
          totalPending,
        });
      } else {
        setOverallStats(null);
      }

      console.log('[AdminAckStats] Loaded', policyStats.length, 'policy stats');
    } catch (error) {
      console.error('[AdminAckStats] Exception loading stats:', error);
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

  const getCompletionPercentage = (stat: PolicyStats) => {
    if (stat.total_users === 0) return 0;
    return Math.round((stat.acknowledged_count / stat.total_users) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return Colors.success;
    if (percentage >= 70) return Colors.warning;
    return Colors.error;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.nautical.teal} />
        <Text style={styles.loadingText}>Loading acknowledgment statistics...</Text>
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
        <View style={styles.headerTitleContainer}>
          <BarChart3 size={28} color={Colors.nautical.teal} />
          <Text style={styles.headerTitle}>Acknowledgment Statistics</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Overview of policy acknowledgment rates across all users
        </Text>
      </View>

      {overallStats && (
        <View style={styles.overallStatsContainer}>
          <View style={styles.overallStatCard}>
            <Users size={24} color={Colors.nautical.teal} />
            <Text style={styles.overallStatValue}>{overallStats.totalUsers}</Text>
            <Text style={styles.overallStatLabel}>Total Users</Text>
          </View>

          <View style={styles.overallStatCard}>
            <BarChart3 size={24} color={Colors.nautical.coral} />
            <Text style={styles.overallStatValue}>{overallStats.totalPolicies}</Text>
            <Text style={styles.overallStatLabel}>Active Policies</Text>
          </View>

          <View style={styles.overallStatCard}>
            <TrendingUp size={24} color={Colors.success} />
            <Text style={[styles.overallStatValue, { color: getStatusColor(overallStats.overallCompletionRate) }]}>
              {overallStats.overallCompletionRate}%
            </Text>
            <Text style={styles.overallStatLabel}>Completion Rate</Text>
          </View>

          <View style={styles.overallStatCard}>
            <Clock size={24} color={Colors.warning} />
            <Text style={[styles.overallStatValue, { color: Colors.warning }]}>
              {overallStats.totalPending}
            </Text>
            <Text style={styles.overallStatLabel}>Total Pending</Text>
          </View>
        </View>
      )}

      {stats.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={Colors.light.muted} />
          <Text style={styles.emptyStateTitle}>No Statistics Available</Text>
          <Text style={styles.emptyStateText}>
            Policy acknowledgment statistics will appear here once policies are published and users start acknowledging them.
          </Text>
        </View>
      ) : (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Policy Details</Text>
          
          {stats.map((stat) => {
            const completionPercentage = getCompletionPercentage(stat);
            const statusColor = getStatusColor(completionPercentage);
            const isComplete = completionPercentage === 100;

            return (
              <View key={`${stat.policy_type}-${stat.version}`} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.statIconText}>{getPolicyIcon(stat.policy_type)}</Text>
                    </View>
                    <View style={styles.statTitleInfo}>
                      <Text style={styles.statTitle}>{getPolicyTitle(stat.policy_type)}</Text>
                      <Text style={styles.statVersion}>Version {stat.version.toFixed(1)}</Text>
                    </View>
                  </View>
                  
                  {isComplete && (
                    <View style={styles.completeBadge}>
                      <CheckCircle size={20} color={Colors.success} />
                    </View>
                  )}
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Acknowledgment Progress</Text>
                    <Text style={[styles.progressPercentage, { color: statusColor }]}>
                      {completionPercentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { 
                          width: `${completionPercentage}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <View style={styles.statItemHeader}>
                      <Users size={14} color={Colors.nautical.teal} />
                      <Text style={styles.statItemLabel}>Total</Text>
                    </View>
                    <Text style={styles.statItemValue}>{stat.total_users}</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <View style={styles.statItemHeader}>
                      <CheckCircle size={14} color={Colors.success} />
                      <Text style={styles.statItemLabel}>Acknowledged</Text>
                    </View>
                    <Text style={[styles.statItemValue, { color: Colors.success }]}>
                      {stat.acknowledged_count}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <View style={styles.statItemHeader}>
                      <Clock size={14} color={Colors.warning} />
                      <Text style={styles.statItemLabel}>Pending</Text>
                    </View>
                    <Text style={[styles.statItemValue, { color: Colors.warning }]}>
                      {stat.pending_count}
                    </Text>
                  </View>
                </View>

                <View style={styles.statFooter}>
                  <Text style={styles.lastUpdated}>
                    Last updated: {new Date(stat.last_updated).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📊 About These Stats</Text>
        <Text style={styles.infoText}>
          • Stats are automatically calculated when policies are published{'\n'}
          • Completion rate shows the percentage of users who have acknowledged each policy{'\n'}
          • Pending users will receive notifications prompting them to acknowledge{'\n'}
          • Pull down to refresh statistics
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    gap: 12,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralGray,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.nautical.navyBlue,
    lineHeight: 20,
  },
  overallStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  overallStatCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallStatValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
  },
  overallStatLabel: {
    fontSize: 12,
    color: Colors.nautical.navyBlue,
    textAlign: 'center' as const,
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
    color: Colors.nautical.darkBlue,
    textAlign: 'center' as const,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.nautical.navyBlue,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  statsSection: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 4,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.neutralGray,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.nautical.lightBlue,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statIconText: {
    fontSize: 24,
  },
  statTitleInfo: {
    flex: 1,
    gap: 2,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
  },
  statVersion: {
    fontSize: 13,
    color: Colors.nautical.navyBlue,
  },
  completeBadge: {
    padding: 4,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' as const,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.nautical.navyBlue,
    fontWeight: '600' as const,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.neutralGray,
    marginHorizontal: 8,
  },
  statItemHeader: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 4,
  },
  statItemLabel: {
    fontSize: 11,
    color: Colors.nautical.navyBlue,
    fontWeight: '600' as const,
  },
  statItemValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
  },
  statFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralGray,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.nautical.navyBlue,
    textAlign: 'center' as const,
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.nautical.lightBlue,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.nautical.navyBlue,
    lineHeight: 20,
  },
});
