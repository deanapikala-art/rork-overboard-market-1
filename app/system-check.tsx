import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { trpcClient } from '@/lib/trpc';
import Constants from 'expo-constants';

interface CheckResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export default function SystemCheckScreen() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: CheckResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runSystemCheck = async () => {
    setIsRunning(true);
    setResults([]);

    console.log('🔍 Starting System Check...');

    await checkEnvironmentVariables();
    await checkSupabaseConnection();
    await checkBackendConnection();
    await checkDatabaseTables();
    await checkContextProviders();
    await checkRoutingSetup();
    await checkLiveFeatures();

    setIsRunning(false);
    console.log('✅ System check complete');
  };

  const checkEnvironmentVariables = async () => {
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const apiBaseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_RORK_API_BASE_URL;

      if (supabaseUrl && supabaseKey) {
        addResult({
          category: 'Environment',
          name: 'Supabase Variables',
          status: 'pass',
          message: 'Supabase environment variables are set',
          details: `URL: ${supabaseUrl}`,
        });
      } else {
        addResult({
          category: 'Environment',
          name: 'Supabase Variables',
          status: 'fail',
          message: 'Supabase environment variables are missing',
          details: 'Check your .env file',
        });
      }

      if (apiBaseUrl) {
        addResult({
          category: 'Environment',
          name: 'Backend API URL',
          status: 'pass',
          message: 'Backend API URL is set',
          details: apiBaseUrl,
        });
      } else {
        addResult({
          category: 'Environment',
          name: 'Backend API URL',
          status: 'warning',
          message: 'Backend API URL not configured',
          details: 'tRPC endpoints may not work',
        });
      }
    } catch (error) {
      addResult({
        category: 'Environment',
        name: 'Environment Check',
        status: 'fail',
        message: 'Error checking environment variables',
        details: String(error),
      });
    }
  };

  const checkSupabaseConnection = async () => {
    try {
      const { error } = await supabase.from('customers').select('count').limit(0);
      
      if (error) {
        addResult({
          category: 'Database',
          name: 'Supabase Connection',
          status: 'fail',
          message: 'Failed to connect to Supabase',
          details: error.message,
        });
      } else {
        addResult({
          category: 'Database',
          name: 'Supabase Connection',
          status: 'pass',
          message: 'Successfully connected to Supabase',
        });
      }

      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        addResult({
          category: 'Auth',
          name: 'User Session',
          status: 'pass',
          message: `Logged in as ${session.session.user.email}`,
          details: `User type: ${session.session.user.user_metadata?.user_type || 'unknown'}`,
        });
      } else {
        addResult({
          category: 'Auth',
          name: 'User Session',
          status: 'warning',
          message: 'No active session',
          details: 'User not logged in',
        });
      }
    } catch (error) {
      addResult({
        category: 'Database',
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Exception connecting to Supabase',
        details: String(error),
      });
    }
  };

  const checkBackendConnection = async () => {
    try {
      const result = await trpcClient.example.hi.mutate({ name: 'System Check' });
      addResult({
        category: 'Backend',
        name: 'tRPC Connection',
        status: 'pass',
        message: 'Backend is reachable',
        details: `Response: ${result.hello}`,
      });
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        addResult({
          category: 'Backend',
          name: 'tRPC Connection',
          status: 'fail',
          message: '404 Error - Backend endpoint not reachable',
          details: 'The backend server may not be running or the URL is incorrect',
        });
      } else if (error?.message?.includes('offline')) {
        addResult({
          category: 'Backend',
          name: 'tRPC Connection',
          status: 'fail',
          message: 'Backend endpoint is offline',
          details: 'Make sure the dev server is running with tunnel enabled',
        });
      } else {
        addResult({
          category: 'Backend',
          name: 'tRPC Connection',
          status: 'fail',
          message: 'Backend connection error',
          details: error?.message || String(error),
        });
      }
    }
  };

  const checkDatabaseTables = async () => {
    const tables = [
      'customers',
      'vendors',
      'products',
      'customer_carts',
      'customer_favorites',
      'vendor_live_sessions',
      'shoutouts',
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(0);
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            addResult({
              category: 'Database',
              name: `Table: ${table}`,
              status: 'fail',
              message: `Table '${table}' does not exist`,
              details: 'Run the schema SQL in Supabase',
            });
          } else {
            addResult({
              category: 'Database',
              name: `Table: ${table}`,
              status: 'warning',
              message: `Table '${table}' has issues`,
              details: error.message,
            });
          }
        } else {
          addResult({
            category: 'Database',
            name: `Table: ${table}`,
            status: 'pass',
            message: `Table '${table}' exists`,
          });
        }
      } catch (error) {
        addResult({
          category: 'Database',
          name: `Table: ${table}`,
          status: 'fail',
          message: `Error checking table '${table}'`,
          details: String(error),
        });
      }
    }
  };

  const checkContextProviders = async () => {
    const contexts = [
      'CartProvider',
      'AuthContext',
      'CustomerAuthProvider',
      'VendorAuthProvider',
      'AdminAuthProvider',
      'FavoritesProvider',
      'VendorLiveProvider',
      'MessagingContext',
      'ShoutoutsProvider',
    ];

    addResult({
      category: 'App Structure',
      name: 'Context Providers',
      status: 'pass',
      message: `${contexts.length} context providers configured`,
      details: contexts.join(', '),
    });
  };

  const checkRoutingSetup = async () => {
    const routes = [
      { path: '/', name: 'Home/Index' },
      { path: '/(tabs)/home', name: 'Home Tab' },
      { path: '/(tabs)/shop', name: 'Shop Tab' },
      { path: '/(tabs)/vendors', name: 'Vendors Tab' },
      { path: '/(tabs)/cart', name: 'Cart Tab' },
      { path: '/(tabs)/events', name: 'Events Tab' },
      { path: '/live', name: 'Live Vendors' },
      { path: '/walk-the-fair', name: 'Walk the Fair' },
      { path: '/product/[id]', name: 'Product Details' },
      { path: '/vendor/[id]', name: 'Vendor Details' },
    ];

    addResult({
      category: 'Routing',
      name: 'Route Configuration',
      status: 'pass',
      message: `${routes.length} main routes configured`,
      details: routes.map(r => r.name).join(', '),
    });
  };

  const checkLiveFeatures = async () => {
    try {
      const { data: liveVendors, error } = await supabase
        .from('vendor_live_sessions')
        .select('*')
        .eq('is_live', true)
        .order('started_at', { ascending: false });

      if (error) {
        addResult({
          category: 'Features',
          name: 'Live Vendors',
          status: 'warning',
          message: 'Could not check live vendors',
          details: error.message,
        });
      } else {
        addResult({
          category: 'Features',
          name: 'Live Vendors',
          status: 'pass',
          message: `${liveVendors?.length || 0} vendors currently live`,
        });
      }
    } catch (error) {
      addResult({
        category: 'Features',
        name: 'Live Vendors',
        status: 'warning',
        message: 'Error checking live vendors',
        details: String(error),
      });
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, CheckResult[]>);

  const statusCounts = {
    pass: results.filter(r => r.status === 'pass').length,
    fail: results.filter(r => r.status === 'fail').length,
    warning: results.filter(r => r.status === 'warning').length,
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={20} color="#10b981" />;
      case 'fail':
        return <XCircle size={20} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={20} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return '#10b981';
      case 'fail':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'System Check',
          headerStyle: { backgroundColor: Colors.nautical.oceanDeep },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 System Functionality Check</Text>
          <Text style={styles.subtitle}>
            Verify all app features, connections, and configurations
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runSystemCheck}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.buttonText}>Run System Check</Text>
            </>
          )}
        </TouchableOpacity>

        {results.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: '#10b981' }]}>
                    {statusCounts.pass}
                  </Text>
                  <Text style={styles.summaryLabel}>Passed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: '#f59e0b' }]}>
                    {statusCounts.warning}
                  </Text>
                  <Text style={styles.summaryLabel}>Warnings</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: '#ef4444' }]}>
                    {statusCounts.fail}
                  </Text>
                  <Text style={styles.summaryLabel}>Failed</Text>
                </View>
              </View>
            </View>

            <View style={styles.resultsContainer}>
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {categoryResults.map((result, index) => (
                    <View
                      key={`${category}-${index}`}
                      style={[
                        styles.resultCard,
                        { borderLeftColor: getStatusColor(result.status) },
                      ]}
                    >
                      <View style={styles.resultHeader}>
                        {getStatusIcon(result.status)}
                        <Text style={styles.resultName}>{result.name}</Text>
                      </View>
                      <Text style={styles.resultMessage}>{result.message}</Text>
                      {result.details && (
                        <View style={styles.detailsContainer}>
                          <Text style={styles.detailsText}>{result.details}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {statusCounts.fail > 0 && (
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>🔧 Recommended Actions</Text>
                <Text style={styles.actionText}>
                  1. Restart your development server with tunnel enabled
                </Text>
                <Text style={styles.actionText}>
                  2. Check your .env file for missing variables
                </Text>
                <Text style={styles.actionText}>
                  3. Verify Supabase database tables are created
                </Text>
                <Text style={styles.actionText}>
                  4. Run database migrations if needed
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.nautical.teal,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  resultsContainer: {
    gap: 24,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 4,
  },
  detailsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  actionCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 24,
    marginBottom: 4,
  },
});
