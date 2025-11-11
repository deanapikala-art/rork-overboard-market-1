import { AlertTriangle, Clock, CheckCircle, XCircle, Filter, ChevronDown, User, Package, ShoppingCart } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useReports, Report, ReportStatus, ReportPriority } from '@/app/contexts/ReportsContext';

export default function AdminReportsDashboard() {
  const { reports, updateReport, isLoading, getReportStats } = useReports();
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<ReportPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const stats = getReportStats();

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter((r) => r.priority === selectedPriority);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.target_name?.toLowerCase().includes(query) ||
          r.reason.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.reporter_email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reports, selectedStatus, selectedPriority, searchQuery]);

  const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
    const result = await updateReport(reportId, { status });
    if (result.success) {
      Alert.alert('Success', 'Report status updated');
      setSelectedReport(null);
    } else {
      Alert.alert('Error', result.error || 'Failed to update report');
    }
  };

  const handleUpdatePriority = async (reportId: string, priority: ReportPriority) => {
    const result = await updateReport(reportId, { priority });
    if (result.success) {
      Alert.alert('Success', 'Report priority updated');
    } else {
      Alert.alert('Error', result.error || 'Failed to update priority');
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'vendor':
        return <User size={16} color="#4C7D7C" />;
      case 'customer':
        return <User size={16} color="#4C7D7C" />;
      case 'product':
        return <Package size={16} color="#4C7D7C" />;
      case 'order':
        return <ShoppingCart size={16} color="#4C7D7C" />;
      default:
        return <AlertTriangle size={16} color="#4C7D7C" />;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'open':
        return '#EE6E56';
      case 'in_review':
        return '#F39C12';
      case 'resolved':
        return '#27AE60';
      case 'dismissed':
        return '#95A5A6';
      default:
        return '#999';
    }
  };

  const getPriorityColor = (priority: ReportPriority) => {
    switch (priority) {
      case 'urgent':
        return '#E74C3C';
      case 'high':
        return '#EE6E56';
      case 'normal':
        return '#4C7D7C';
      case 'low':
        return '#95A5A6';
      default:
        return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Trust & Safety Reports</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Filter size={20} color="#4C7D7C" />
          <Text style={styles.filterButtonText}>Filters</Text>
          <ChevronDown size={16} color="#4C7D7C" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#EE6E56' }]}>
          <Text style={[styles.statNumber, { color: '#EE6E56' }]}>{stats.open}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F39C12' }]}>
          <Text style={[styles.statNumber, { color: '#F39C12' }]}>{stats.inReview}</Text>
          <Text style={styles.statLabel}>In Review</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#27AE60' }]}>
          <Text style={[styles.statNumber, { color: '#27AE60' }]}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </ScrollView>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {['all', 'open', 'in_review', 'resolved', 'dismissed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(status as ReportStatus | 'all')}
                >
                  <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Priority</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
              {['all', 'urgent', 'high', 'normal', 'low'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[styles.filterChip, selectedPriority === priority && styles.filterChipActive]}
                  onPress={() => setSelectedPriority(priority as ReportPriority | 'all')}
                >
                  <Text style={[styles.filterChipText, selectedPriority === priority && styles.filterChipTextActive]}>
                    {priority === 'all' ? 'All' : priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <View style={styles.reportsList}>
        <Text style={styles.resultsCount}>
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </Text>

        {filteredReports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => setSelectedReport(report)}
            activeOpacity={0.7}
          >
            <View style={styles.reportHeader}>
              <View style={styles.reportHeaderLeft}>
                {getTargetIcon(report.target_type)}
                <Text style={styles.reportTarget}>
                  {report.target_name || `${report.target_type} ${report.target_id.slice(0, 8)}`}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(report.priority) }]}>
                <Text style={styles.priorityText}>{report.priority}</Text>
              </View>
            </View>

            <Text style={styles.reportType}>{report.report_type.replace(/_/g, ' ')}</Text>
            <Text style={styles.reportReason} numberOfLines={2}>
              {report.reason}
            </Text>

            <View style={styles.reportFooter}>
              <View style={[styles.statusBadge, { borderColor: getStatusColor(report.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                  {report.status.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.reportMeta}>
                <Clock size={14} color="#999" />
                <Text style={styles.reportDate}>{formatDate(report.created_at)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredReports.length === 0 && (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#CCC" />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </View>

      <Modal
        visible={!!selectedReport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedReport(null)}
      >
        {selectedReport && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Target</Text>
                <Text style={styles.detailValue}>
                  {selectedReport.target_name || selectedReport.target_id} ({selectedReport.target_type})
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Report Type</Text>
                <Text style={styles.detailValue}>{selectedReport.report_type.replace(/_/g, ' ')}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Reason</Text>
                <Text style={styles.detailValue}>{selectedReport.reason}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedReport.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Reporter</Text>
                <Text style={styles.detailValue}>
                  {selectedReport.reporter_email || selectedReport.reporter_id} ({selectedReport.reporter_type})
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.actionButtons}>
                  {['open', 'in_review', 'resolved', 'dismissed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.actionButton,
                        selectedReport.status === status && styles.actionButtonActive,
                      ]}
                      onPress={() => handleUpdateStatus(selectedReport.id, status as ReportStatus)}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          selectedReport.status === status && styles.actionButtonTextActive,
                        ]}
                      >
                        {status.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Priority</Text>
                <View style={styles.actionButtons}>
                  {['low', 'normal', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.actionButton,
                        selectedReport.priority === priority && styles.actionButtonActive,
                      ]}
                      onPress={() => handleUpdatePriority(selectedReport.id, priority as ReportPriority)}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          selectedReport.priority === priority && styles.actionButtonTextActive,
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Timeline</Text>
                <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                    <Text style={styles.timelineLabel}>Created:</Text>
                    <Text style={styles.timelineValue}>{new Date(selectedReport.created_at).toLocaleString()}</Text>
                  </View>
                  {selectedReport.reviewed_at && (
                    <View style={styles.timelineItem}>
                      <Text style={styles.timelineLabel}>Reviewed:</Text>
                      <Text style={styles.timelineValue}>{new Date(selectedReport.reviewed_at).toLocaleString()}</Text>
                    </View>
                  )}
                  {selectedReport.resolved_at && (
                    <View style={styles.timelineItem}>
                      <Text style={styles.timelineLabel}>Resolved:</Text>
                      <Text style={styles.timelineValue}>{new Date(selectedReport.resolved_at).toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4C7D7C',
    backgroundColor: '#FFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4C7D7C',
  },
  statsRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    borderLeftWidth: 4,
    borderLeftColor: '#4C7D7C',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8DCC0',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2B3440',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DCC0',
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4C7D7C',
    borderColor: '#4C7D7C',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
    textTransform: 'capitalize' as const,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E8DCC0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2B3440',
    backgroundColor: '#F9F9F9',
  },
  reportsList: {
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reportTarget: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2B3440',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
  },
  reportType: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#4C7D7C',
    marginBottom: 4,
    textTransform: 'capitalize' as const,
  },
  reportReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300' as const,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailSection: {
    marginTop: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#2B3440',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DCC0',
    backgroundColor: '#FFF',
  },
  actionButtonActive: {
    backgroundColor: '#4C7D7C',
    borderColor: '#4C7D7C',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
    textTransform: 'capitalize' as const,
  },
  actionButtonTextActive: {
    color: '#FFF',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    width: 80,
  },
  timelineValue: {
    fontSize: 14,
    color: '#2B3440',
    flex: 1,
  },
});
