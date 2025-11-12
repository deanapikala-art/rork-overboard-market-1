import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { X, Bell, Mail, Smartphone, Settings as SettingsIcon } from 'lucide-react-native';
import Colors from '@/app/constants/colors';
import { useAdminNotifications, AdminPreference } from '@/app/contexts/AdminNotificationsContext';

interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PreferenceCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const categories: PreferenceCategory[] = [
  {
    key: 'orders',
    label: 'Orders',
    description: 'Order confirmations and updates',
    icon: <Bell size={20} color={Colors.nautical.teal} />,
  },
  {
    key: 'shipping',
    label: 'Shipping',
    description: 'Shipment and delivery notifications',
    icon: <Bell size={20} color={Colors.nautical.teal} />,
  },
  {
    key: 'vendors',
    label: 'Vendors',
    description: 'New vendors and account changes',
    icon: <Bell size={20} color={Colors.nautical.teal} />,
  },
  {
    key: 'disputes',
    label: 'Disputes',
    description: 'Customer issues and complaints',
    icon: <Bell size={20} color={Colors.nautical.teal} />,
  },
  {
    key: 'ratings',
    label: 'Ratings',
    description: 'Low ratings and review alerts',
    icon: <Bell size={20} color={Colors.nautical.teal} />,
  },
  {
    key: 'milestones',
    label: 'Milestones',
    description: 'Revenue goals and achievements',
    icon: <Bell size={20} color={Colors.nautical.teal} />,
  },
];

export default function NotificationPreferencesModal({
  visible,
  onClose,
}: NotificationPreferencesModalProps) {
  const { preferences, isLoadingPreferences, updatePreference } = useAdminNotifications();
  const [localPreferences, setLocalPreferences] = useState<Record<string, AdminPreference>>({});

  useEffect(() => {
    if (preferences.length > 0) {
      const prefMap: Record<string, AdminPreference> = {};
      preferences.forEach(pref => {
        prefMap[pref.category] = pref;
      });
      setLocalPreferences(prefMap);
    }
  }, [preferences]);

  const handleToggle = async (category: string, field: 'enable_in_app' | 'enable_email' | 'enable_push', value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));

    await updatePreference(category, { [field]: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <SettingsIcon size={24} color={Colors.nautical.teal} />
            <Text style={styles.modalTitle}>Notification Settings</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={Colors.nautical.driftwood} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionDescription}>
            Choose which notifications you want to receive for each category.
          </Text>

          {isLoadingPreferences ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading preferences...</Text>
            </View>
          ) : (
            categories.map((category) => {
              const pref = localPreferences[category.key];
              if (!pref) return null;

              return (
                <View key={category.key} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryIcon}>{category.icon}</View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                  </View>

                  <View style={styles.preferencesGrid}>
                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceLeft}>
                        <Bell size={18} color={Colors.nautical.driftwood} />
                        <Text style={styles.preferenceLabel}>In-App</Text>
                      </View>
                      <Switch
                        value={pref.enable_in_app}
                        onValueChange={(value) => handleToggle(category.key, 'enable_in_app', value)}
                        trackColor={{ false: Colors.nautical.sand, true: Colors.nautical.teal }}
                        thumbColor={Colors.white}
                      />
                    </View>

                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceLeft}>
                        <Mail size={18} color={Colors.nautical.driftwood} />
                        <Text style={styles.preferenceLabel}>Email</Text>
                      </View>
                      <Switch
                        value={pref.enable_email}
                        onValueChange={(value) => handleToggle(category.key, 'enable_email', value)}
                        trackColor={{ false: Colors.nautical.sand, true: Colors.nautical.teal }}
                        thumbColor={Colors.white}
                      />
                    </View>

                    <View style={styles.preferenceRow}>
                      <View style={styles.preferenceLeft}>
                        <Smartphone size={18} color={Colors.nautical.driftwood} />
                        <Text style={styles.preferenceLabel}>Push</Text>
                      </View>
                      <Switch
                        value={pref.enable_push}
                        onValueChange={(value) => handleToggle(category.key, 'enable_push', value)}
                        trackColor={{ false: Colors.nautical.sand, true: Colors.nautical.teal }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              In-app notifications appear in your admin notification center. Email and push
              notifications are sent to your registered admin account.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.sand,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionDescription: {
    fontSize: 15,
    color: Colors.nautical.driftwood,
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.nautical.driftwood,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.nautical.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
    lineHeight: 18,
  },
  preferencesGrid: {
    gap: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  infoCard: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.nautical.teal,
  },
  infoText: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
    lineHeight: 20,
  },
});
