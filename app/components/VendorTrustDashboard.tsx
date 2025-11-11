import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTrustScore } from '../contexts/TrustScoreContext';
import { Shield, Award, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react-native';

export default function VendorTrustDashboard() {
  const {
    trustData,
    loading,
    refreshing,
    refresh,
    calculateBreakdown,
    generateRecoveryGoals,
    completeRecovery,
    requestVerification,
  } = useTrustScore();

  const [generatingGoals, setGeneratingGoals] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7D7C" />
        <Text style={styles.loadingText}>Loading trust score...</Text>
      </View>
    );
  }

  if (!trustData) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#EE6E56" />
        <Text style={styles.errorText}>Unable to load trust data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const breakdown = calculateBreakdown();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Trusted Vendor':
        return '#4C7D7C';
      case 'Verified & Reliable':
        return '#10B981';
      case 'New or Improving':
        return '#F59E0B';
      case 'Under Review':
        return '#EE6E56';
      default:
        return '#6B7280';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Trusted Vendor':
        return <Award size={24} color="#FFF" />;
      case 'Verified & Reliable':
        return <CheckCircle size={24} color="#FFF" />;
      case 'New or Improving':
        return <Clock size={24} color="#FFF" />;
      case 'Under Review':
        return <AlertCircle size={24} color="#FFF" />;
      default:
        return <Shield size={24} color="#FFF" />;
    }
  };

  const handleGenerateGoals = async () => {
    setGeneratingGoals(true);
    try {
      await generateRecoveryGoals();
      Alert.alert('Success', 'Recovery plan generated successfully!');
    } catch (err) {
      console.error('Generate goals error:', err);
      Alert.alert('Error', 'Failed to generate recovery plan');
    } finally {
      setGeneratingGoals(false);
    }
  };

  const handleCompleteRecovery = async () => {
    Alert.alert(
      'Complete Recovery',
      'Have you completed all recovery goals? Your trust score will be recalculated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await completeRecovery();
            Alert.alert('Success', 'Recovery completed! Your trust score has been updated.');
          },
        },
      ]
    );
  };

  const handleRequestVerification = () => {
    Alert.alert(
      'Request Verification',
      'Submit a request to become a Verified Vendor. Our team will review your account and contact you with next steps.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          onPress: async () => {
            await requestVerification();
            Alert.alert('Request Submitted', 'Thank you! We will review your request shortly.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <ActivityIndicator animating={refreshing} color="#4C7D7C" />
      }
    >
      <View style={styles.header}>
        <Shield size={32} color="#4C7D7C" />
        <Text style={styles.headerTitle}>Trust & Reputation</Text>
      </View>

      <View style={[styles.scoreCard, { borderColor: getTierColor(trustData.trustTier) }]}>
        <View
          style={[
            styles.scoreHeader,
            { backgroundColor: getTierColor(trustData.trustTier) },
          ]}
        >
          {getTierIcon(trustData.trustTier)}
          <Text style={styles.scoreTier}>{trustData.trustTier}</Text>
        </View>

        <View style={styles.scoreBody}>
          <Text style={styles.scoreLabel}>Trust Score</Text>
          <Text style={styles.scoreValue}>{trustData.trustScore} / 100</Text>

          {trustData.verifiedVendor && (
            <View style={styles.verifiedBadge}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.verifiedText}>Verified Vendor</Text>
            </View>
          )}

          {!trustData.verifiedVendor && trustData.trustScore >= 75 && (
            <TouchableOpacity style={styles.verifyButton} onPress={handleRequestVerification}>
              <Text style={styles.verifyButtonText}>Request Verification</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Score Breakdown</Text>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Order Fulfillment</Text>
          <Text style={styles.breakdownValue}>
            {breakdown.fulfillmentPoints} / {breakdown.maxPoints.fulfillment}
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Reviews</Text>
          <Text style={styles.breakdownValue}>
            {breakdown.reviewPoints} / {breakdown.maxPoints.review}
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Disputes</Text>
          <Text style={styles.breakdownValue}>
            {breakdown.disputePoints} / {breakdown.maxPoints.dispute}
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Policy Compliance</Text>
          <Text style={styles.breakdownValue}>
            {breakdown.policyPoints} / {breakdown.maxPoints.policy}
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Warnings</Text>
          <Text style={styles.breakdownValue}>
            {breakdown.warningPoints} / {breakdown.maxPoints.warning}
          </Text>
        </View>
      </View>

      {trustData.trustRecoveryActive && (
        <View style={styles.recoveryCard}>
          <View style={styles.recoveryHeader}>
            <TrendingUp size={24} color="#4C7D7C" />
            <Text style={styles.recoveryTitle}>Rebuild Your Trust Score</Text>
          </View>

          {trustData.trustScoreLastDropReason && (
            <View style={styles.dropReasonCard}>
              <AlertCircle size={16} color="#EE6E56" />
              <Text style={styles.dropReasonText}>{trustData.trustScoreLastDropReason}</Text>
            </View>
          )}

          <Text style={styles.recoverySubtitle}>
            Complete these steps to reach &ldquo;Verified & Reliable&rdquo; status again.
          </Text>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${trustData.trustRecoveryProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(trustData.trustRecoveryProgress)}%</Text>

          {trustData.trustRecoveryGoals.length === 0 ? (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateGoals}
              disabled={generatingGoals}
            >
              {generatingGoals ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Recovery Plan</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.goalsContainer}>
                {trustData.trustRecoveryGoals.map((goal, index) => (
                  <View key={index} style={styles.goalItem}>
                    {goal.completed ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <Clock size={20} color="#F59E0B" />
                    )}
                    <View style={styles.goalContent}>
                      <Text style={styles.goalDescription}>{goal.goalDescription}</Text>
                      <Text style={styles.goalProgress}>
                        {goal.currentValue} / {goal.targetValue}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {trustData.trustRecoveryProgress >= 100 && (
                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteRecovery}>
                  <Text style={styles.completeButtonText}>Mark as Complete</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {trustData.trustScore < 75 && !trustData.trustRecoveryActive && (
        <View style={styles.warningCard}>
          <AlertCircle size={24} color="#EE6E56" />
          <Text style={styles.warningTitle}>Action Needed</Text>
          <Text style={styles.warningText}>
            Your trust score has dropped below the recommended threshold. Start a recovery plan to
            improve your standing.
          </Text>
          <TouchableOpacity
            style={styles.startRecoveryButton}
            onPress={handleGenerateGoals}
            disabled={generatingGoals}
          >
            {generatingGoals ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.startRecoveryButtonText}>Start Recovery Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {trustData.trustRecoveryCompleted && (
        <View style={styles.successCard}>
          <Award size={32} color="#4C7D7C" />
          <Text style={styles.successTitle}>Congratulations!</Text>
          <Text style={styles.successText}>
            You&apos;ve successfully rebuilt your reputation and regained trusted status. Keep up the
            great work!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F9F9F9',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#2B3440',
    textAlign: 'center' as const,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4C7D7C',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  scoreCard: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden' as const,
  },
  scoreHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 12,
  },
  scoreTier: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  scoreBody: {
    padding: 20,
    alignItems: 'center' as const,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#2B3440',
  },
  verifiedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  verifyButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4C7D7C',
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  breakdownCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2B3440',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2B3440',
  },
  recoveryCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4C7D7C',
  },
  recoveryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  recoveryTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  dropReasonCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    gap: 8,
  },
  dropReasonText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  recoverySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4C7D7C',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4C7D7C',
    textAlign: 'right' as const,
    marginBottom: 20,
  },
  generateButton: {
    paddingVertical: 14,
    backgroundColor: '#4C7D7C',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  goalsContainer: {
    marginBottom: 20,
  },
  goalItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalDescription: {
    fontSize: 15,
    color: '#2B3440',
    marginBottom: 4,
  },
  goalProgress: {
    fontSize: 13,
    color: '#6B7280',
  },
  completeButton: {
    paddingVertical: 14,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  warningCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EE6E56',
    alignItems: 'center' as const,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2B3440',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  startRecoveryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#4C7D7C',
    borderRadius: 8,
  },
  startRecoveryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  successCard: {
    margin: 16,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#2B3440',
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center' as const,
  },
});
