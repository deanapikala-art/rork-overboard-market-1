import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import { X, Bell, Mail, Smartphone, Volume2, VolumeX } from 'lucide-react-native';
import { useCustomerNotifications } from '@/app/contexts/CustomerNotificationsContext';

type CustomerNotificationPreferencesModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function CustomerNotificationPreferencesModal({
  visible,
  onClose,
}: CustomerNotificationPreferencesModalProps) {
  const { preferences, updatePreferences } = useCustomerNotifications();
  const [isSaving, setIsSaving] = useState(false);

  const [localPrefs, setLocalPrefs] = useState({
    enable_in_app: preferences?.enable_in_app ?? true,
    enable_email: preferences?.enable_email ?? true,
    enable_push: preferences?.enable_push ?? true,
    notify_order_placed: preferences?.notify_order_placed ?? true,
    notify_order_confirmed: preferences?.notify_order_confirmed ?? true,
    notify_order_shipped: preferences?.notify_order_shipped ?? true,
    notify_order_delivered: preferences?.notify_order_delivered ?? true,
    notify_vendor_messages: preferences?.notify_vendor_messages ?? true,
    notify_shipping_updates: preferences?.notify_shipping_updates ?? true,
    notify_review_requests: preferences?.notify_review_requests ?? false,
    mute_non_critical: preferences?.mute_non_critical ?? false,
  });

  React.useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        enable_in_app: preferences.enable_in_app,
        enable_email: preferences.enable_email,
        enable_push: preferences.enable_push,
        notify_order_placed: preferences.notify_order_placed,
        notify_order_confirmed: preferences.notify_order_confirmed,
        notify_order_shipped: preferences.notify_order_shipped,
        notify_order_delivered: preferences.notify_order_delivered,
        notify_vendor_messages: preferences.notify_vendor_messages,
        notify_shipping_updates: preferences.notify_shipping_updates,
        notify_review_requests: preferences.notify_review_requests,
        mute_non_critical: preferences.mute_non_critical,
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePreferences(localPrefs);
      if (result.success) {
        onClose();
      } else {
        console.error('[CustomerNotificationPreferences] Error saving:', result.error);
      }
    } catch (error) {
      console.error('[CustomerNotificationPreferences] Exception saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePref = (key: keyof typeof localPrefs) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notification Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Methods</Text>
              <Text style={styles.sectionDescription}>
                Choose how you want to receive notifications
              </Text>

              <View style={styles.prefItem}>
                <View style={styles.prefInfo}>
                  <Bell size={20} color="#3B82F6" />
                  <View style={styles.prefText}>
                    <Text style={styles.prefLabel}>In-App Notifications</Text>
                    <Text style={styles.prefDescription}>
                      Show notifications inside the app
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localPrefs.enable_in_app}
                  onValueChange={() => togglePref('enable_in_app')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.enable_in_app ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefInfo}>
                  <Mail size={20} color="#8B5CF6" />
                  <View style={styles.prefText}>
                    <Text style={styles.prefLabel}>Email Notifications</Text>
                    <Text style={styles.prefDescription}>
                      Receive updates via email
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localPrefs.enable_email}
                  onValueChange={() => togglePref('enable_email')}
                  trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
                  thumbColor={localPrefs.enable_email ? '#8B5CF6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefInfo}>
                  <Smartphone size={20} color="#10B981" />
                  <View style={styles.prefText}>
                    <Text style={styles.prefLabel}>Push Notifications</Text>
                    <Text style={styles.prefDescription}>
                      Get instant alerts on your device
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localPrefs.enable_push}
                  onValueChange={() => togglePref('enable_push')}
                  trackColor={{ false: '#D1D5DB', true: '#6EE7B7' }}
                  thumbColor={localPrefs.enable_push ? '#10B981' : '#F3F4F6'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Types</Text>
              <Text style={styles.sectionDescription}>
                Select which types of notifications you want to receive
              </Text>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Order Placed</Text>
                  <Text style={styles.prefDescription}>
                    When you place an order
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_order_placed}
                  onValueChange={() => togglePref('notify_order_placed')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_order_placed ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Order Confirmed</Text>
                  <Text style={styles.prefDescription}>
                    When vendor confirms your payment
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_order_confirmed}
                  onValueChange={() => togglePref('notify_order_confirmed')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_order_confirmed ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Order Shipped</Text>
                  <Text style={styles.prefDescription}>
                    When your order is shipped
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_order_shipped}
                  onValueChange={() => togglePref('notify_order_shipped')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_order_shipped ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Order Delivered</Text>
                  <Text style={styles.prefDescription}>
                    When your order is delivered
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_order_delivered}
                  onValueChange={() => togglePref('notify_order_delivered')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_order_delivered ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Vendor Messages</Text>
                  <Text style={styles.prefDescription}>
                    When a vendor sends you a message
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_vendor_messages}
                  onValueChange={() => togglePref('notify_vendor_messages')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_vendor_messages ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Shipping Updates</Text>
                  <Text style={styles.prefDescription}>
                    Tracking and delivery updates
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_shipping_updates}
                  onValueChange={() => togglePref('notify_shipping_updates')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_shipping_updates ? '#3B82F6' : '#F3F4F6'}
                />
              </View>

              <View style={styles.prefItem}>
                <View style={styles.prefText}>
                  <Text style={styles.prefLabel}>Review Requests</Text>
                  <Text style={styles.prefDescription}>
                    Reminders to review your purchases
                  </Text>
                </View>
                <Switch
                  value={localPrefs.notify_review_requests}
                  onValueChange={() => togglePref('notify_review_requests')}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={localPrefs.notify_review_requests ? '#3B82F6' : '#F3F4F6'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority Settings</Text>
              
              <View style={styles.prefItem}>
                <View style={styles.prefInfo}>
                  {localPrefs.mute_non_critical ? (
                    <VolumeX size={20} color="#EF4444" />
                  ) : (
                    <Volume2 size={20} color="#6B7280" />
                  )}
                  <View style={styles.prefText}>
                    <Text style={styles.prefLabel}>Mute Non-Critical</Text>
                    <Text style={styles.prefDescription}>
                      Only show important notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localPrefs.mute_non_critical}
                  onValueChange={() => togglePref('mute_non_critical')}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={localPrefs.mute_non_critical ? '#EF4444' : '#F3F4F6'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  prefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  prefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  prefText: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  prefDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4B5563',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
