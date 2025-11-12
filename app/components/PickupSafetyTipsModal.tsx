import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Shield, AlertTriangle, MapPin, MessageCircle, Users, Eye, X } from 'lucide-react-native';
import Colors from '@/app/constants/colors';

interface PickupSafetyTipsModalProps {
  visible: boolean;
  onClose: () => void;
  userType: 'vendor' | 'customer';
  onDontShowAgain?: (value: boolean) => void;
  showDontShowAgain?: boolean;
}

export default function PickupSafetyTipsModal({
  visible,
  onClose,
  userType,
  onDontShowAgain,
  showDontShowAgain = true,
}: PickupSafetyTipsModalProps) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const handleClose = () => {
    if (onDontShowAgain && dontShowAgain) {
      onDontShowAgain(true);
    }
    onClose();
  };

  const vendorTips = [
    {
      icon: MapPin,
      title: 'Choose a public, well-lit meeting spot',
      description: 'Police station parking lots, community centers, or busy retail lots are ideal. Avoid meeting at your home unless you know the buyer personally.',
    },
    {
      icon: MessageCircle,
      title: 'Coordinate pickup times in-app',
      description: 'Keep all communication within Overboard Market messages. Avoid sharing phone numbers or personal info until you feel comfortable.',
    },
    {
      icon: Users,
      title: 'Bring a friend if possible',
      description: 'Having someone with you adds an extra layer of safety and can make the exchange feel more secure.',
    },
    {
      icon: AlertTriangle,
      title: 'Confirm payment before handing over goods',
      description: 'If you\'re using external payment methods (Venmo, PayPal, etc.), verify payment is complete before releasing items.',
    },
    {
      icon: Eye,
      title: 'Trust your instincts',
      description: 'If something feels off, don\'t hesitate to cancel the pickup or contact support. Your safety comes first.',
    },
  ];

  const customerTips = [
    {
      icon: MapPin,
      title: 'Meet in public, well-lit areas',
      description: 'Choose safe meeting locations like shopping center parking lots, community centers, or police station lobbies.',
    },
    {
      icon: MessageCircle,
      title: 'Use in-app messaging',
      description: 'Coordinate all pickup details through Overboard Market messages. This protects both you and the seller.',
    },
    {
      icon: AlertTriangle,
      title: 'Inspect items before leaving',
      description: 'Check that the item matches the description and photos before finalizing the exchange.',
    },
    {
      icon: Eye,
      title: 'Trust your instincts',
      description: 'If a seller seems suspicious or the situation feels unsafe, cancel the pickup and contact support.',
    },
  ];

  const tips = userType === 'vendor' ? vendorTips : customerTips;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Shield size={28} color={Colors.nautical.teal} />
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Local Pickup Safety Tips</Text>
                <Text style={styles.modalSubtitle}>
                  {userType === 'vendor' ? 'Protect yourself and your buyers' : 'Stay safe during pickup'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.tipsIntro}>
              <Text style={styles.tipsIntroText}>
                Follow these best practices to ensure safe in-person exchanges:
              </Text>
            </View>

            <View style={styles.tipsList}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <tip.icon size={22} color={Colors.nautical.teal} />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoTitle}>Remember</Text>
              <Text style={styles.additionalInfoText}>
                Keep communication in Overboard Market messages so both sides are protected. If you experience any issues or feel unsafe, contact our support team immediately.
              </Text>
            </View>

            {showDontShowAgain && (
              <View style={styles.dontShowContainer}>
                <View style={styles.dontShowContent}>
                  <Text style={styles.dontShowLabel}>Don't show this again</Text>
                </View>
                <Switch
                  value={dontShowAgain}
                  onValueChange={setDontShowAgain}
                  trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
                  thumbColor={Colors.white}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.gotItButton}
              onPress={handleClose}
            >
              <Text style={styles.gotItButtonText}>Got It</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  tipsIntro: {
    backgroundColor: Colors.nautical.sandLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsIntroText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 14,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.nautical.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipContent: {
    flex: 1,
    paddingTop: 2,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  tipDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  additionalInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.nautical.teal,
  },
  additionalInfoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  additionalInfoText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  dontShowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  dontShowContent: {
    flex: 1,
  },
  dontShowLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  gotItButton: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gotItButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
