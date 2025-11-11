import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { runComprehensiveCheck, generateFixScript, DiagnosticResult } from '@/app/utils/comprehensiveCheck';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiagnosticScreen() {
  const [results, setResults] = useState<DiagnosticResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fixScript, setFixScript] = useState<string>('');

  const runCheck = async () => {
    setIsRunning(true);
    setResults(null);
    setFixScript('');
    
    try {
      const checkResults = await runComprehensiveCheck();
      setResults(checkResults);
      const script = generateFixScript(checkResults);
      setFixScript(script);
    } catch (error) {
      console.error('Error running diagnostic:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
    }
  };

  const errorCount = results?.filter(r => r.status === 'error').length || 0;
  const warningCount = results?.filter(r => r.status === 'warning').length || 0;
  const successCount = results?.filter(r => r.status === 'success').length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'System Diagnostic',
          headerStyle: {
            backgroundColor: '#1f2937',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Comprehensive System Check</Text>
          <Text style={styles.subtitle}>
            This will test all database connections, tables, and authentication systems
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runCheck}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Run Diagnostic Check</Text>
          )}
        </TouchableOpacity>

        {results && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: '#10b981' }]}>{successCount}</Text>
                  <Text style={styles.summaryLabel}>Passed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: '#f59e0b' }]}>{warningCount}</Text>
                  <Text style={styles.summaryLabel}>Warnings</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: '#ef4444' }]}>{errorCount}</Text>
                  <Text style={styles.summaryLabel}>Errors</Text>
                </View>
              </View>
            </View>

            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Detailed Results</Text>
              {results.map((result, index) => (
                <View key={index} style={[styles.resultCard, { borderLeftColor: getStatusColor(result.status) }]}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                    <Text style={styles.resultSection}>{result.section}</Text>
                  </View>
                  <Text style={styles.resultMessage}>{result.message}</Text>
                  {result.details && (
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsLabel}>Details:</Text>
                      <Text style={styles.detailsText}>
                        {JSON.stringify(result.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {fixScript && fixScript !== '// No fixes needed - all checks passed!' && (
              <View style={styles.fixScriptContainer}>
                <Text style={styles.fixScriptTitle}>🔧 Recommended Fixes</Text>
                <View style={styles.fixScriptBox}>
                  <Text style={styles.fixScriptText}>{fixScript}</Text>
                </View>
                <Text style={styles.fixScriptNote}>
                  Copy the SQL from app/utils/FINAL_COMPREHENSIVE_FIX.sql and run it in your Supabase SQL Editor
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
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#4b5563',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
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
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  resultSection: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
  fixScriptContainer: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  fixScriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  fixScriptBox: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  fixScriptText: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  fixScriptNote: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
});
