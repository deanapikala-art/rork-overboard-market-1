import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReports, ReportStatus } from './contexts/ReportsContext';

export default function MyReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myReports, isLoading } = useReports();

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#2B3440" />
        </TouchableOpacity>
        <Text style={styles.title}>My Reports</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : myReports.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color="#CCC" />
            <Text style={styles.emptyText}>No Reports Yet</Text>
            <Text style={styles.emptySubtext}>
              You haven't submitted any reports. If you experience issues with vendors, products, or buyers, you can
              report them for review.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {myReports.length} report{myReports.length !== 1 ? 's' : ''}
            </Text>

            {myReports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportHeaderLeft}>
                    <Text style={styles.reportType}>{report.report_type.replace(/_/g, ' ')}</Text>
                    <View style={[styles.statusBadge, { borderColor: getStatusColor(report.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                        {report.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.targetInfo}>
                  <Text style={styles.targetLabel}>Reporting:</Text>
                  <Text style={styles.targetName}>
                    {report.target_name || `${report.target_type} ${report.target_id.slice(0, 8)}`}
                  </Text>
                </View>

                <Text style={styles.reason}>{report.reason}</Text>

                {report.description && (
                  <Text style={styles.description} numberOfLines={3}>
                    {report.description}
                  </Text>
                )}

                <View style={styles.reportFooter}>
                  <View style={styles.dateInfo}>
                    <Clock size={14} color="#999" />
                    <Text style={styles.dateText}>Submitted {formatDate(report.created_at)}</Text>
                  </View>

                  {report.resolved_at && (
                    <Text style={styles.resolvedText}>Resolved {formatDate(report.resolved_at)}</Text>
                  )}
                </View>

                {report.resolution_notes && (
                  <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionLabel}>Admin Response:</Text>
                    <Text style={styles.resolutionNotes}>{report.resolution_notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#2B3440',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reportType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#4C7D7C',
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 13,
    color: '#999',
  },
  targetName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2B3440',
  },
  reason: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#2B3440',
    marginBottom: 8,
    lineHeight: 21,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  resolvedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500' as const,
  },
  resolutionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F7F7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4C7D7C',
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#4C7D7C',
    marginBottom: 4,
  },
  resolutionNotes: {
    fontSize: 13,
    color: '#2B3440',
    lineHeight: 19,
  },
});
