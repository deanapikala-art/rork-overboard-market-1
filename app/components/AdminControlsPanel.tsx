import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import {
  Shield,
  ShieldOff,
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Flag,
  RefreshCw,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAdminControls } from '@/app/contexts/AdminControlsContext';
import { vendors } from '@/mocks/vendors';

export default function AdminControlsPanel() {
  const {
    vendorManagement,
    notifications,
    reviews,
    disputes,
    isLoading,
    suspendVendor,
    activateVendor,
    featureVendor,
    unfeatureVendor,
    sendNotification,
    sendBulkNotification,
    deleteReview,
    approveReview,
    updateDisputeStatus,
    refresh,
  } = useAdminControls();

  const [activeSection, setActiveSection] = useState<'vendors' | 'reviews' | 'disputes' | 'notifications'>('vendors');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [notificationModal, setNotificationModal] = useState<{ visible: boolean; vendorId?: string; isBulk?: boolean }>({ visible: false });
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', severity: 'info' as 'info' | 'warning' | 'urgent' });
  const [featureModal, setFeatureModal] = useState<{ visible: boolean; vendorId?: string }>({ visible: false });
  const [featureDuration, setFeatureDuration] = useState<string>('7');

  const renderRopeDivider = () => (
    <View style={styles.ropeDivider}>
      <View style={styles.ropeSegment} />
      <View style={styles.ropeSegment} />
    </View>
  );

  const handleSuspendVendor = (vendorId: string) => {
    Alert.alert(
      'Suspend Vendor',
      'Are you sure you want to suspend this vendor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            Alert.prompt(
              'Suspension Reason',
              'Please provide a reason for suspension:',
              async (reason) => {
                if (reason) {
                  const success = await suspendVendor(vendorId, reason);
                  if (success) {
                    Alert.alert('Success', 'Vendor suspended successfully');
                  } else {
                    Alert.alert('Error', 'Failed to suspend vendor');
                  }
                }
              }
            );
          },
        },
      ]
    );
  };

  const handleActivateVendor = async (vendorId: string) => {
    const success = await activateVendor(vendorId);
    if (success) {
      Alert.alert('Success', 'Vendor activated successfully');
    } else {
      Alert.alert('Error', 'Failed to activate vendor');
    }
  };

  const handleFeatureVendor = async () => {
    if (!featureModal.vendorId) return;
    
    const days = parseInt(featureDuration, 10);
    if (isNaN(days) || days < 1) {
      Alert.alert('Error', 'Please enter a valid number of days');
      return;
    }

    const success = await featureVendor(featureModal.vendorId, days);
    if (success) {
      Alert.alert('Success', 'Vendor featured successfully');
      setFeatureModal({ visible: false });
      setFeatureDuration('7');
    } else {
      Alert.alert('Error', 'Failed to feature vendor');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    let success = false;
    if (notificationModal.isBulk) {
      success = await sendBulkNotification(notificationForm.title, notificationForm.message, notificationForm.severity);
    } else if (notificationModal.vendorId) {
      success = await sendNotification(notificationModal.vendorId, notificationForm.title, notificationForm.message, notificationForm.severity);
    }

    if (success) {
      Alert.alert('Success', 'Notification sent successfully');
      setNotificationModal({ visible: false });
      setNotificationForm({ title: '', message: '', severity: 'info' });
    } else {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.prompt(
      'Delete Review',
      'Please provide a reason for deletion:',
      async (reason) => {
        if (reason) {
          const success = await deleteReview(reviewId, reason);
          if (success) {
            Alert.alert('Success', 'Review deleted successfully');
          } else {
            Alert.alert('Error', 'Failed to delete review');
          }
        }
      }
    );
  };

  const getVendorStatus = (vendorId: string) => {
    const mgmt = vendorManagement.find(vm => vm.vendor_id === vendorId);
    if (!mgmt) return { isActive: true, isSuspended: false, isFeatured: false };
    return {
      isActive: mgmt.is_active,
      isSuspended: mgmt.is_suspended,
      isFeatured: mgmt.is_featured,
      featuredUntil: mgmt.featured_until,
    };
  };

  const renderVendorManagement = () => (
    <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vendor Management</Text>
        <TouchableOpacity
          style={styles.bulkActionButton}
          onPress={() => setNotificationModal({ visible: true, isBulk: true })}
        >
          <MessageSquare size={16} color={Colors.white} />
          <Text style={styles.bulkActionText}>Bulk Notify</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.nautical.teal} style={{ marginTop: 40 }} />
      ) : (
        vendors.map((vendor) => {
          const status = getVendorStatus(vendor.id);
          return (
            <View key={vendor.id} style={styles.vendorCard}>
              <View style={styles.vendorHeader}>
                <Text style={styles.vendorName}>{vendor.name}</Text>
                <View style={styles.vendorStatusBadges}>
                  {status.isSuspended && (
                    <View style={[styles.statusBadge, { backgroundColor: Colors.light.terracotta }]}>
                      <Text style={styles.statusBadgeText}>Suspended</Text>
                    </View>
                  )}
                  {status.isFeatured && (
                    <View style={[styles.statusBadge, { backgroundColor: Colors.nautical.mustard }]}>
                      <Star size={12} color={Colors.white} fill={Colors.white} />
                    </View>
                  )}
                  {!status.isActive && !status.isSuspended && (
                    <View style={[styles.statusBadge, { backgroundColor: Colors.nautical.sand }]}>
                      <Text style={styles.statusBadgeText}>Inactive</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.vendorSpecialty}>{vendor.specialty}</Text>
              
              {status.isFeatured && status.featuredUntil && (
                <Text style={styles.featuredUntilText}>
                  Featured until {new Date(status.featuredUntil).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.vendorActions}>
                {status.isSuspended ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.nautical.teal }]}
                    onPress={() => handleActivateVendor(vendor.id)}
                  >
                    <CheckCircle size={16} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Activate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.light.terracotta }]}
                    onPress={() => handleSuspendVendor(vendor.id)}
                  >
                    <ShieldOff size={16} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Suspend</Text>
                  </TouchableOpacity>
                )}

                {status.isFeatured ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.nautical.sand }]}
                    onPress={async () => {
                      const success = await unfeatureVendor(vendor.id);
                      if (success) Alert.alert('Success', 'Vendor unfeatured');
                    }}
                  >
                    <XCircle size={16} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Unfeature</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.nautical.mustard }]}
                    onPress={() => setFeatureModal({ visible: true, vendorId: vendor.id })}
                  >
                    <Star size={16} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Feature</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.nautical.oceanDeep }]}
                  onPress={() => setNotificationModal({ visible: true, vendorId: vendor.id })}
                >
                  <MessageSquare size={16} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Notify</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderReviewModeration = () => (
    <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Review Moderation</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.nautical.teal} style={{ marginTop: 40 }} />
      ) : reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Eye size={48} color={Colors.nautical.sand} />
          <Text style={styles.emptyStateText}>No reviews to moderate</Text>
        </View>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewRating}>
                <Star size={16} color={Colors.nautical.mustard} fill={Colors.nautical.mustard} />
                <Text style={styles.reviewRatingText}>{review.rating}/5</Text>
              </View>
              {review.is_reported && (
                <View style={[styles.statusBadge, { backgroundColor: Colors.light.terracotta }]}>
                  <Flag size={12} color={Colors.white} />
                  <Text style={styles.statusBadgeText}>Reported</Text>
                </View>
              )}
            </View>

            <Text style={styles.reviewComment}>{review.comment || 'No comment provided'}</Text>
            
            {review.report_reason && (
              <View style={styles.reportReasonBox}>
                <AlertTriangle size={14} color={Colors.light.terracotta} />
                <Text style={styles.reportReasonText}>{review.report_reason}</Text>
              </View>
            )}

            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.nautical.teal }]}
                onPress={async () => {
                  const success = await approveReview(review.review_id);
                  if (success) Alert.alert('Success', 'Review approved');
                }}
              >
                <CheckCircle size={16} color={Colors.white} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.light.terracotta }]}
                onPress={() => handleDeleteReview(review.review_id)}
              >
                <Trash2 size={16} color={Colors.white} />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderDisputes = () => (
    <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Order Disputes</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.nautical.teal} style={{ marginTop: 40 }} />
      ) : disputes.length === 0 ? (
        <View style={styles.emptyState}>
          <CheckCircle size={48} color={Colors.nautical.sand} />
          <Text style={styles.emptyStateText}>No active disputes</Text>
        </View>
      ) : (
        disputes.map((dispute) => (
          <View key={dispute.id} style={styles.disputeCard}>
            <View style={styles.disputeHeader}>
              <Text style={styles.disputeOrderNumber}>Order #{dispute.order_number}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: dispute.status === 'resolved' ? Colors.nautical.teal : Colors.light.terracotta }
              ]}>
                <Text style={styles.statusBadgeText}>{dispute.status}</Text>
              </View>
            </View>

            <Text style={styles.disputeParties}>
              {dispute.customer_name} vs {dispute.vendor_name}
            </Text>

            <Text style={styles.disputeIssue}>{dispute.issue}</Text>
            {dispute.description && (
              <Text style={styles.disputeDescription}>{dispute.description}</Text>
            )}

            <View style={styles.disputeActions}>
              {dispute.status === 'open' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.nautical.oceanDeep }]}
                  onPress={async () => {
                    const success = await updateDisputeStatus(dispute.id, 'under_review');
                    if (success) Alert.alert('Success', 'Dispute marked under review');
                  }}
                >
                  <Eye size={16} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Review</Text>
                </TouchableOpacity>
              )}
              
              {dispute.status !== 'resolved' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.nautical.teal }]}
                  onPress={() => {
                    Alert.prompt(
                      'Resolve Dispute',
                      'Enter resolution notes:',
                      async (notes) => {
                        if (notes) {
                          const success = await updateDisputeStatus(dispute.id, 'resolved', notes);
                          if (success) Alert.alert('Success', 'Dispute resolved');
                        }
                      }
                    );
                  }}
                >
                  <CheckCircle size={16} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderNotifications = () => (
    <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Recent Notifications</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.nautical.teal} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={48} color={Colors.nautical.sand} />
          <Text style={styles.emptyStateText}>No notifications sent</Text>
        </View>
      ) : (
        notifications.slice(0, 20).map((notification) => (
          <View key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <View style={[
                styles.severityBadge,
                {
                  backgroundColor:
                    notification.severity === 'urgent' ? Colors.light.terracotta :
                    notification.severity === 'warning' ? Colors.nautical.mustard :
                    Colors.nautical.teal
                }
              ]}>
                <Text style={styles.severityBadgeText}>{notification.severity}</Text>
              </View>
            </View>

            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationMeta}>
              Sent to {notification.vendor_id} • {new Date(notification.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Controls</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
          <RefreshCw size={20} color={Colors.nautical.teal} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'vendors' && styles.activeTab]}
          onPress={() => setActiveSection('vendors')}
        >
          <Shield size={20} color={activeSection === 'vendors' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeSection === 'vendors' && styles.activeTabText]}>Vendors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === 'reviews' && styles.activeTab]}
          onPress={() => setActiveSection('reviews')}
        >
          <Star size={20} color={activeSection === 'reviews' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeSection === 'reviews' && styles.activeTabText]}>Reviews</Text>
          {reviews.filter(r => r.is_reported).length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{reviews.filter(r => r.is_reported).length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === 'disputes' && styles.activeTab]}
          onPress={() => setActiveSection('disputes')}
        >
          <AlertTriangle size={20} color={activeSection === 'disputes' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeSection === 'disputes' && styles.activeTabText]}>Disputes</Text>
          {disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{disputes.filter(d => d.status !== 'resolved' && d.status !== 'closed').length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === 'notifications' && styles.activeTab]}
          onPress={() => setActiveSection('notifications')}
        >
          <MessageSquare size={20} color={activeSection === 'notifications' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeSection === 'notifications' && styles.activeTabText]}>Notifs</Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'vendors' && renderVendorManagement()}
      {activeSection === 'reviews' && renderReviewModeration()}
      {activeSection === 'disputes' && renderDisputes()}
      {activeSection === 'notifications' && renderNotifications()}

      <Modal
        visible={notificationModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotificationModal({ visible: false })}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {notificationModal.isBulk ? 'Send Bulk Notification' : 'Send Notification'}
            </Text>
            <TouchableOpacity onPress={() => setNotificationModal({ visible: false })}>
              <XCircle size={28} color={Colors.nautical.driftwood} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={notificationForm.title}
              onChangeText={(text) => setNotificationForm({ ...notificationForm, title: text })}
              placeholder="Notification title"
              placeholderTextColor={Colors.nautical.sand}
            />

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notificationForm.message}
              onChangeText={(text) => setNotificationForm({ ...notificationForm, message: text })}
              placeholder="Notification message"
              placeholderTextColor={Colors.nautical.sand}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Severity</Text>
            <View style={styles.severityButtons}>
              {(['info', 'warning', 'urgent'] as const).map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    notificationForm.severity === severity && styles.severityButtonActive,
                    { borderColor: 
                      severity === 'urgent' ? Colors.light.terracotta :
                      severity === 'warning' ? Colors.nautical.mustard :
                      Colors.nautical.teal
                    }
                  ]}
                  onPress={() => setNotificationForm({ ...notificationForm, severity })}
                >
                  <Text style={[
                    styles.severityButtonText,
                    notificationForm.severity === severity && styles.severityButtonTextActive
                  ]}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: Colors.nautical.teal }]}
              onPress={handleSendNotification}
            >
              <Text style={styles.modalActionButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={featureModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFeatureModal({ visible: false })}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feature Vendor</Text>
            <TouchableOpacity onPress={() => setFeatureModal({ visible: false })}>
              <XCircle size={28} color={Colors.nautical.driftwood} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Duration (days)</Text>
            <TextInput
              style={styles.input}
              value={featureDuration}
              onChangeText={setFeatureDuration}
              placeholder="7"
              placeholderTextColor={Colors.nautical.sand}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: Colors.nautical.mustard }]}
              onPress={handleFeatureVendor}
            >
              <Text style={styles.modalActionButtonText}>Feature</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.sand,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.nautical.sandLight,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.sand,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
    position: 'relative' as const,
  },
  activeTab: {
    backgroundColor: Colors.nautical.sandLight,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  activeTabText: {
    color: Colors.nautical.teal,
  },
  tabBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: Colors.light.terracotta,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  ropeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  ropeSegment: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.nautical.driftwood,
    opacity: 0.3,
  },
  vendorCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    flex: 1,
  },
  vendorStatusBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  vendorSpecialty: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    marginBottom: 12,
  },
  featuredUntilText: {
    fontSize: 12,
    color: Colors.nautical.mustard,
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  vendorActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    marginBottom: 12,
    lineHeight: 20,
  },
  reportReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  reportReasonText: {
    fontSize: 13,
    color: Colors.light.terracotta,
    flex: 1,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  disputeCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disputeOrderNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  disputeParties: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
    marginBottom: 8,
  },
  disputeIssue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 6,
  },
  disputeDescription: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    marginBottom: 12,
    lineHeight: 20,
  },
  disputeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationMeta: {
    fontSize: 12,
    color: Colors.nautical.sand,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.nautical.driftwood,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.sand,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.nautical.oceanDeep,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top' as const,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  severityButtonActive: {
    backgroundColor: Colors.nautical.sandLight,
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  severityButtonTextActive: {
    color: Colors.nautical.teal,
  },
  modalActions: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  modalActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
