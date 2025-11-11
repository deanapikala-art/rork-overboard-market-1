import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Bell, X, CheckCircle, AlertTriangle, AlertCircle, Settings, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAdminNotifications, AdminNotification, NotificationSeverity } from '@/app/contexts/AdminNotificationsContext';
import { router } from 'expo-router';



const getSeverityIcon = (severity: NotificationSeverity) => {
  const iconSize = 20 as const;
  switch (severity) {
    case 'critical':
      return <AlertCircle size={iconSize} color={Colors.light.terracotta} />;
    case 'warning':
      return <AlertTriangle size={iconSize} color={Colors.nautical.mustard} />;
    default:
      return <CheckCircle size={iconSize} color={Colors.nautical.teal} />;
  }
};

const getSeverityColor = (severity: NotificationSeverity): string => {
  switch (severity) {
    case 'critical':
      return Colors.light.terracotta;
    case 'warning':
      return Colors.nautical.mustard;
    default:
      return Colors.nautical.teal;
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const handleNotificationTap = (notification: AdminNotification) => {
  if (notification.related_vendor) {
    router.push(`/admin/vendor/${notification.related_vendor}`);
  } else if (notification.related_order) {
    router.push(`/order/${notification.related_order}`);
  }
};

interface NotificationBellProps {
  onPreferencesPress?: () => void;
}

export default function NotificationBell({ onPreferencesPress }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useAdminNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationPress = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    handleNotificationTap(notification);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string, event: any) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Bell size={24} color={Colors.white} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Bell size={24} color={Colors.nautical.teal} />
              <Text style={styles.modalTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {onPreferencesPress && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={onPreferencesPress}
                  activeOpacity={0.7}
                >
                  <Settings size={20} color={Colors.nautical.driftwood} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsOpen(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={Colors.nautical.driftwood} />
              </TouchableOpacity>
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <CheckCircle size={16} color={Colors.nautical.teal} />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={styles.notificationsList}
            contentContainerStyle={styles.notificationsContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color={Colors.nautical.sand} />
                <Text style={styles.emptyText}>Loading notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color={Colors.nautical.sand} />
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                  You&apos;ll be notified about orders, vendors, and marketplace activity
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.is_read && styles.notificationCardUnread,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationMain}>
                    <View
                      style={[
                        styles.notificationIconContainer,
                        { backgroundColor: getSeverityColor(notification.severity) + '20' },
                      ]}
                    >
                      {getSeverityIcon(notification.severity)}
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {!notification.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimestamp(notification.created_at)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => handleDelete(notification.id, e)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={Colors.nautical.driftwood} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    position: 'relative' as const,
  },
  badge: {
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
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
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
  headerBadge: {
    backgroundColor: Colors.light.terracotta,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.sand,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.nautical.sand,
    marginTop: 8,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.nautical.teal,
    backgroundColor: Colors.nautical.sandLight,
  },
  notificationMain: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.nautical.teal,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.nautical.sand,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
