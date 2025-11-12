import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { FileText, BarChart3, ArrowLeft } from 'lucide-react-native';
import { PolicyType } from '@/app/contexts/PolicyAcknowledgmentContext';
import { AdminPolicyEditor } from '@/app/components/AdminPolicyEditor';
import { AdminAcknowledgmentStats } from '@/app/components/AdminAcknowledgmentStats';
import { usePolicyAcknowledgment } from '@/app/contexts/PolicyAcknowledgmentContext';
import Colors from '@/app/constants/colors';
import { getPolicyIcon, getPolicyTitle } from '@/app/constants/policyTemplates';
import { router } from 'expo-router';

type ViewMode = 'list' | 'editor' | 'stats';

export default function AdminPolicyManagementScreen() {
  const { currentPolicies, refreshPolicies } = usePolicyAcknowledgment();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType | null>(null);

  const handleEditPolicy = (policyType: PolicyType) => {
    setSelectedPolicyType(policyType);
    setViewMode('editor');
  };

  const handleViewStats = () => {
    setViewMode('stats');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedPolicyType(null);
    refreshPolicies();
  };

  const policyTypes: PolicyType[] = ['terms', 'privacy', 'codeOfConduct'];

  const renderListView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Policy Management</Text>
        <Text style={styles.headerSubtitle}>
          Create, update, and track policy acknowledgments
        </Text>
      </View>

      <TouchableOpacity
        style={styles.statsButton}
        onPress={handleViewStats}
        activeOpacity={0.7}
      >
        <BarChart3 size={20} color={Colors.white} />
        <Text style={styles.statsButtonText}>View Acknowledgment Statistics</Text>
      </TouchableOpacity>

      <View style={styles.policiesSection}>
        <Text style={styles.sectionTitle}>Active Policies</Text>
        
        {policyTypes.map((policyType) => {
          const policy = currentPolicies.find(p => p.policy_type === policyType);
          const icon = getPolicyIcon(policyType);
          const title = getPolicyTitle(policyType);

          return (
            <TouchableOpacity
              key={policyType}
              style={styles.policyCard}
              onPress={() => handleEditPolicy(policyType)}
              activeOpacity={0.7}
            >
              <View style={styles.policyIcon}>
                <Text style={styles.policyIconText}>{icon}</Text>
              </View>
              
              <View style={styles.policyInfo}>
                <Text style={styles.policyTitle}>{title}</Text>
                <Text style={styles.policyVersion}>
                  {policy ? `Version ${policy.version.toFixed(1)}` : 'No active version'}
                </Text>
                {policy && (
                  <Text style={styles.policyDate}>
                    Last updated: {new Date(policy.last_updated).toLocaleDateString()}
                  </Text>
                )}
              </View>

              <FileText size={20} color={Colors.nautical.teal} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 How it works</Text>
        <Text style={styles.infoText}>
          • Select a policy to create a new version{'\n'}
          • Toggle acknowledgment requirements{'\n'}
          • Publish to notify all users automatically{'\n'}
          • Track acceptance in the Statistics dashboard
        </Text>
      </View>
    </ScrollView>
  );

  const renderEditorView = () => {
    if (!selectedPolicyType) return null;

    const currentPolicy = currentPolicies.find(p => p.policy_type === selectedPolicyType);
    const currentVersion = currentPolicy?.version || 0;

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={20} color={Colors.nautical.teal} />
          <Text style={styles.backButtonText}>Back to Policies</Text>
        </TouchableOpacity>

        <AdminPolicyEditor
          policyType={selectedPolicyType}
          currentVersion={currentVersion}
          onSave={handleBack}
        />
      </View>
    );
  };

  const renderStatsView = () => (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={20} color={Colors.nautical.teal} />
        <Text style={styles.backButtonText}>Back to Policies</Text>
      </TouchableOpacity>

      <AdminAcknowledgmentStats />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'Policy Management',
          headerStyle: { backgroundColor: Colors.nautical.teal },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' as const },
        }}
      />

      {viewMode === 'list' && renderListView()}
      {viewMode === 'editor' && renderEditorView()}
      {viewMode === 'stats' && renderStatsView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralGray,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.nautical.navyBlue,
    lineHeight: 20,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.teal,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  statsButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  policiesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 12,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  policyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.nautical.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyIconText: {
    fontSize: 24,
  },
  policyInfo: {
    flex: 1,
    gap: 2,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
  },
  policyVersion: {
    fontSize: 14,
    color: Colors.nautical.navyBlue,
  },
  policyDate: {
    fontSize: 12,
    color: Colors.nautical.navyBlue,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralGray,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
});
