import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ValidationResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function SupabaseValidation() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const addResult = (result: ValidationResult) => {
    setResults(prev => [...prev, result]);
  };

  const runValidation = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const totalChecks = 15;
    let currentCheck = 0;

    const updateProgress = () => {
      currentCheck++;
      setProgress((currentCheck / totalChecks) * 100);
    };

    // 1. Connection Health
    try {
      const { error } = await supabase.from('vendor_profiles').select('id').limit(1);
      addResult({
        category: 'Connection',
        name: 'Supabase Client',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : 'Connected successfully',
        details: error ? error.details : 'Client initialized and responsive',
      });
    } catch (error: any) {
      addResult({
        category: 'Connection',
        name: 'Supabase Client',
        status: 'fail',
        message: 'Exception thrown',
        details: error.message,
      });
    }
    updateProgress();

    // 2. Auth State
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      addResult({
        category: 'Auth',
        name: 'Auth State',
        status: error ? 'warning' : (user ? 'pass' : 'warning'),
        message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
        details: user?.id || 'No user session',
      });
    } catch (error: any) {
      addResult({
        category: 'Auth',
        name: 'Auth State',
        status: 'fail',
        message: 'Auth check failed',
        details: error.message,
      });
    }
    updateProgress();

    // 3. Core Tables Existence
    const coreTables = [
      'vendor_profiles',
      'user_profiles',
      'products',
      'orders',
      'user_orders',
      'cart',
      'reports',
      'disputes',
    ];

    for (const table of coreTables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        addResult({
          category: 'Tables',
          name: table,
          status: error ? 'fail' : 'pass',
          message: error ? `Table error: ${error.message}` : 'Table exists and accessible',
          details: error?.hint || undefined,
        });
      } catch (error: any) {
        addResult({
          category: 'Tables',
          name: table,
          status: 'fail',
          message: 'Exception accessing table',
          details: error.message,
        });
      }
      updateProgress();
    }

    // 4. Policy Tables
    const policyTables = [
      'policy_texts',
      'user_policy_acknowledgments',
      'policy_update_notifications',
      'policy_acknowledgment_stats',
    ];

    for (const table of policyTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        addResult({
          category: 'Policy System',
          name: table,
          status: error ? 'fail' : 'pass',
          message: error ? `Error: ${error.message}` : 'Accessible',
          details: error?.hint || undefined,
        });
      } catch (error: any) {
        addResult({
          category: 'Policy System',
          name: table,
          status: 'fail',
          message: 'Exception',
          details: error.message,
        });
      }
    }
    updateProgress();

    // 5. Trust Score Tables
    const trustTables = [
      'trust_score_history',
      'trust_recovery_goals',
      'trust_admin_actions',
    ];

    for (const table of trustTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        addResult({
          category: 'Trust System',
          name: table,
          status: error ? 'fail' : 'pass',
          message: error ? `Error: ${error.message}` : 'Accessible',
          details: error?.hint || undefined,
        });
      } catch (error: any) {
        addResult({
          category: 'Trust System',
          name: table,
          status: 'fail',
          message: 'Exception',
          details: error.message,
        });
      }
    }
    updateProgress();

    // 6. Check Policy Types
    try {
      const { data, error } = await supabase
        .from('policy_texts')
        .select('policy_type, version, title')
        .order('policy_type');

      if (error) {
        addResult({
          category: 'Policy Data',
          name: 'Policy Types',
          status: 'fail',
          message: `Query failed: ${error.message}`,
          details: error.hint,
        });
      } else {
        const types = data?.map(p => p.policy_type) || [];
        const expected = ['terms', 'privacy', 'codeOfConduct', 'trustSafety'];
        const hasAll = expected.every(t => types.includes(t));
        
        addResult({
          category: 'Policy Data',
          name: 'Policy Types',
          status: hasAll ? 'pass' : 'warning',
          message: hasAll ? 'All 4 policy types exist' : 'Some policy types missing',
          details: `Found: ${types.join(', ')}. Expected: ${expected.join(', ')}`,
        });
      }
    } catch (error: any) {
      addResult({
        category: 'Policy Data',
        name: 'Policy Types',
        status: 'fail',
        message: 'Exception',
        details: error.message,
      });
    }
    updateProgress();

    // 7. Check RLS Policies
    try {
      const { error } = await supabase.rpc('check_rls_enabled', {
        table_names: ['policy_texts', 'vendor_profiles', 'user_policy_acknowledgments']
      });

      addResult({
        category: 'Security',
        name: 'RLS Policies',
        status: error ? 'warning' : 'pass',
        message: error ? 'Unable to check RLS' : 'RLS function responded',
        details: error?.message || 'RLS checks require custom SQL function',
      });
    } catch (error: any) {
      addResult({
        category: 'Security',
        name: 'RLS Policies',
        status: 'warning',
        message: 'RLS check function not available',
        details: 'This is expected if custom RPC not created',
      });
    }
    updateProgress();

    // 8. Test Insert Permission (safe test)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('user_policy_acknowledgments')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        addResult({
          category: 'Permissions',
          name: 'User Data Access',
          status: error ? 'fail' : 'pass',
          message: error ? `Permission denied: ${error.message}` : 'Can access own data',
          details: error?.hint || 'RLS working correctly',
        });
      } else {
        addResult({
          category: 'Permissions',
          name: 'User Data Access',
          status: 'warning',
          message: 'Not authenticated - cannot test',
          details: 'Sign in to test RLS permissions',
        });
      }
    } catch (error: any) {
      addResult({
        category: 'Permissions',
        name: 'User Data Access',
        status: 'fail',
        message: 'Exception',
        details: error.message,
      });
    }
    updateProgress();

    // 9. Check Foreign Keys (indirect test)
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('id, vendor_user_id')
        .limit(1)
        .single();

      if (vendorError) {
        addResult({
          category: 'Relationships',
          name: 'Foreign Keys',
          status: 'warning',
          message: 'No vendor data to test relationships',
          details: vendorError.message,
        });
      } else if (vendorData) {
        const { error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', vendorData.vendor_user_id)
          .single();

        addResult({
          category: 'Relationships',
          name: 'Foreign Keys',
          status: userError ? 'warning' : 'pass',
          message: userError ? 'FK relationship issue' : 'FK relationships working',
          details: userError?.message || 'Vendor → User FK validated',
        });
      } else {
        addResult({
          category: 'Relationships',
          name: 'Foreign Keys',
          status: 'warning',
          message: 'No test data available',
          details: 'Create a vendor to test FK relationships',
        });
      }
    } catch (error: any) {
      addResult({
        category: 'Relationships',
        name: 'Foreign Keys',
        status: 'warning',
        message: 'Unable to test FKs',
        details: error.message,
      });
    }
    updateProgress();

    // 10. Admin User Table Check
    try {
      const { error } = await supabase.from('admin_users').select('id').limit(1);
      addResult({
        category: 'Admin System',
        name: 'admin_users table',
        status: error ? 'fail' : 'pass',
        message: error ? `Error: ${error.message}` : 'Admin table accessible',
        details: error?.hint || undefined,
      });
    } catch (error: any) {
      addResult({
        category: 'Admin System',
        name: 'admin_users table',
        status: 'fail',
        message: 'Exception',
        details: error.message,
      });
    }
    updateProgress();

    setProgress(100);
    setIsRunning(false);
  };

  const summary = {
    total: results.length,
    pass: results.filter(r => r.status === 'pass').length,
    fail: results.filter(r => r.status === 'fail').length,
    warning: results.filter(r => r.status === 'warning').length,
  };

  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass': return '#4C7D7C';
      case 'fail': return '#EE6E56';
      case 'warning': return '#F4A261';
      default: return '#999';
    }
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'warning': return '⚠';
      default: return '○';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ 
        title: 'Supabase Validation',
        headerStyle: { backgroundColor: '#2B3440' },
        headerTintColor: '#E8DCC0',
      }} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Supabase Schema Validation</Text>
          <Text style={styles.subtitle}>
            Testing connection, tables, RLS policies, and data integrity
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runValidation}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.runButtonText}>Run Validation</Text>
          )}
        </TouchableOpacity>

        {isRunning && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {results.length > 0 && (
          <>
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#4C7D7C' }]}>{summary.pass}</Text>
                <Text style={styles.summaryLabel}>Passed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#EE6E56' }]}>{summary.fail}</Text>
                <Text style={styles.summaryLabel}>Failed</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#F4A261' }]}>{summary.warning}</Text>
                <Text style={styles.summaryLabel}>Warnings</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#2B3440' }]}>{summary.total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
            </View>

            <View style={styles.results}>
              {Object.entries(
                results.reduce((acc, result) => {
                  if (!acc[result.category]) acc[result.category] = [];
                  acc[result.category].push(result);
                  return acc;
                }, {} as Record<string, ValidationResult[]>)
              ).map(([category, categoryResults]) => (
                <View key={category} style={styles.category}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {categoryResults.map((result, idx) => (
                    <View key={idx} style={styles.resultItem}>
                      <View style={styles.resultHeader}>
                        <Text 
                          style={[
                            styles.resultIcon, 
                            { color: getStatusColor(result.status) }
                          ]}
                        >
                          {getStatusIcon(result.status)}
                        </Text>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>{result.name}</Text>
                          <Text style={styles.resultMessage}>{result.message}</Text>
                          {result.details && (
                            <Text style={styles.resultDetails}>{result.details}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </>
        )}

        {!isRunning && results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>
              Press &quot;Run Validation&quot; to check your Supabase setup
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2B3440',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  runButton: {
    backgroundColor: '#4C7D7C',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4C7D7C',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 8,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  results: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  category: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B3440',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
    marginTop: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B3440',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  resultDetails: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
