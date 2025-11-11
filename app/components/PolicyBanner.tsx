import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { usePolicyAcknowledgment, PolicyType } from '@/contexts/PolicyAcknowledgmentContext';
import Colors from '@/constants/colors';
import { 
  getPolicyIcon, 
  getPolicyTitle, 
  getPolicyBannerTitle, 
  getPolicyBannerMessage, 
  getPolicyCTALabel 
} from '@/constants/policyTemplates';
import { router } from 'expo-router';

interface PolicyBannerProps {
  policyType: PolicyType;
  onDismiss?: () => void;
}

export function PolicyBanner({ policyType, onDismiss }: PolicyBannerProps) {
  const { 
    needsAcknowledgment, 
    pendingNotifications,
    markNotificationRead 
  } = usePolicyAcknowledgment();

  const notification = pendingNotifications.find(n => n.policy_type === policyType);

  if (!needsAcknowledgment(policyType) || !notification) {
    return null;
  }

  const handleReview = async () => {
    await markNotificationRead(notification.id);
    router.push(`/legal/policy-center?tab=${policyType}&requireAck=true`);
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const policyIcon = getPolicyIcon(policyType);
  const policyTitle = getPolicyTitle(policyType);
  const bannerTitle = getPolicyBannerTitle(policyType, notification.new_version);
  const bannerMessage = getPolicyBannerMessage(policyType);
  const ctaLabel = getPolicyCTALabel(policyType);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={20} color={Colors.white} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>
          {policyIcon} {bannerTitle}
        </Text>
        <Text style={styles.message}>
          {bannerMessage}
        </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReview}
            activeOpacity={0.7}
          >
            <Text style={styles.reviewButtonText}>{ctaLabel}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.laterButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleDismiss}
        activeOpacity={0.7}
      >
        <X size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

export function GlobalPolicyBanner() {
  const { hasPendingPolicies, pendingNotifications } = usePolicyAcknowledgment();
  const [dismissed, setDismissed] = React.useState(false);

  if (!hasPendingPolicies || dismissed || pendingNotifications.length === 0) {
    return null;
  }

  const firstNotification = pendingNotifications[0];

  return (
    <PolicyBanner
      policyType={firstNotification.policy_type}
      onDismiss={() => setDismissed(true)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.nautical.teal,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.deepBlue,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 20,
  },
  message: {
    fontSize: 13,
    color: Colors.white,
    lineHeight: 18,
    opacity: 0.95,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  reviewButton: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    textAlign: 'center' as const,
  },
  laterButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  closeButton: {
    padding: 4,
  },
});
