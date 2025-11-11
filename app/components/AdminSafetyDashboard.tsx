import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { AlertTriangle, CheckCircle, XCircle, Flag, Shield, TrendingDown, TrendingUp, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafetyFilters, FlaggedMessage } from '@/app/contexts/SafetyFiltersContext';
import { getSeverityColor, getSeverityLabel } from '@/app/utils/safetyFilters';

export default function AdminSafetyDashboard() {
  const {
    flaggedMessages,
    safetyScores,
    reviewFlaggedMessage,
  } = useSafetyFilters();

  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = flaggedMessages.filter(msg => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && msg.status === 'pending') ||
      (filter === 'reviewed' && msg.status !== 'pending');

    const matchesSearch =
      !searchQuery ||
      msg.senderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.matchedContent.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: flaggedMessages.length,
    pending: flaggedMessages.filter(m => m.status === 'pending').length,
    critical: flaggedMessages.filter(m => m.severity === 'critical').length,
    resolved: flaggedMessages.filter(m => m.status === 'resolved').length,
  };

  const avgSafetyScore =
    Object.values(safetyScores).reduce((sum, score) => sum + score.safetyScore, 0) /
      Math.max(Object.values(safetyScores).length, 1) || 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Shield size={28} color={Colors.nautical.teal} />
        <View>
          <Text style={styles.title}>Safety & Moderation</Text>
          <Text style={styles.subtitle}>Monitor and review flagged messages</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: Colors.nautical.teal }]}>
          <Flag size={20} color={Colors.nautical.teal} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Flagged</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <AlertTriangle size={20} color="#F59E0B" />
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#DC2626' }]}>
          <XCircle size={20} color="#DC2626" />
          <Text style={styles.statValue}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical Risk</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.statValue}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Platform Safety Score</Text>
          {avgSafetyScore >= 90 ? (
            <TrendingUp size={20} color="#10B981" />
          ) : (
            <TrendingDown size={20} color="#EF4444" />
          )}
        </View>
        <Text style={styles.scoreValue}>{Math.round(avgSafetyScore)}/100</Text>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${avgSafetyScore}%`,
                backgroundColor: avgSafetyScore >= 90 ? '#10B981' : avgSafetyScore >= 70 ? '#F59E0B' : '#EF4444',
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.light.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user or content..."
            placeholderTextColor={Colors.light.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All ({flaggedMessages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            Pending ({stats.pending})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'reviewed' && styles.filterButtonActive]}
          onPress={() => setFilter('reviewed')}
        >
          <Text style={[styles.filterButtonText, filter === 'reviewed' && styles.filterButtonTextActive]}>
            Reviewed ({stats.resolved})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.messagesList}>
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Shield size={48} color={Colors.light.muted} />
            <Text style={styles.emptyStateTitle}>No flagged messages</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'pending'
                ? 'All messages have been reviewed'
                : 'The platform is operating safely'}
            </Text>
          </View>
        ) : (
          filteredMessages.map(message => (
            <FlaggedMessageCard
              key={message.flagId}
              message={message}
              onReview={reviewFlaggedMessage}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

interface FlaggedMessageCardProps {
  message: FlaggedMessage;
  onReview: (
    flagId: string,
    status: FlaggedMessage['status'],
    adminNotes?: string,
    reviewedBy?: string
  ) => void;
}

function FlaggedMessageCard({ message, onReview }: FlaggedMessageCardProps) {
  const severityColor = getSeverityColor(message.severity as any);
  const isPending = message.status === 'pending';

  return (
    <View style={[styles.messageCard, { borderLeftColor: severityColor }]}>
      <View style={styles.messageCardHeader}>
        <View style={styles.messageBadges}>
          <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>
              {getSeverityLabel(message.severity as any)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  message.status === 'pending'
                    ? '#FEF3C7'
                    : message.status === 'resolved'
                    ? '#D1FAE5'
                    : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    message.status === 'pending'
                      ? '#92400E'
                      : message.status === 'resolved'
                      ? '#065F46'
                      : '#991B1B',
                },
              ]}
            >
              {message.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.messageDate}>{new Date(message.createdAt).toLocaleDateString()}</Text>
      </View>

      <Text style={styles.messageContent}>"{message.matchedContent}"</Text>
      <Text style={styles.messageSender}>Sender: {message.senderId}</Text>

      {isPending && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onReview(message.flagId, 'false_positive', undefined, 'admin')}
          >
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.approveButtonText}>False Positive</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReview(message.flagId, 'confirmed_unsafe', undefined, 'admin')}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={styles.rejectButtonText}>Confirm Unsafe</Text>
          </TouchableOpacity>
        </View>
      )}

      {message.adminNotes && (
        <View style={styles.adminNotesContainer}>
          <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
          <Text style={styles.adminNotesText}>{message.adminNotes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  scoreCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 12,
  },
  scoreBar: {
    height: 8,
    backgroundColor: Colors.light.softGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  filtersRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 12,
  },
  messageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  messageBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  messageDate: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  messageContent: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  messageSender: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#065F46',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#991B1B',
  },
  adminNotesContainer: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  adminNotesLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
