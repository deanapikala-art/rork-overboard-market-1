import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { X, Truck, Package, Calendar } from 'lucide-react-native';
import Colors from '@/app/constants/colors';

interface AddShippingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (shippingInfo: ShippingInfo) => Promise<void>;
  orderNumber: string;
}

export interface ShippingInfo {
  provider: string;
  trackingNumber: string;
  estimatedDelivery?: string;
  notes?: string;
  enableAutoTracking?: boolean;
}

const SHIPPING_PROVIDERS = [
  'USPS',
  'UPS',
  'FedEx',
  'DHL',
  'DHL Express',
  'Other',
];

export default function AddShippingModal({
  visible,
  onClose,
  onSubmit,
  orderNumber,
}: AddShippingModalProps) {
  const [provider, setProvider] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [enableAutoTracking, setEnableAutoTracking] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!provider.trim()) {
      Alert.alert('Error', 'Please select a shipping provider');
      return;
    }

    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        provider: provider.trim(),
        trackingNumber: trackingNumber.trim(),
        estimatedDelivery: estimatedDelivery.trim() || undefined,
        notes: notes.trim() || undefined,
        enableAutoTracking,
      });

      setProvider('');
      setTrackingNumber('');
      setEstimatedDelivery('');
      setNotes('');
      setEnableAutoTracking(true);
      
      onClose();
      Alert.alert('Success', 'Shipping information added successfully');
    } catch (error) {
      console.error('[AddShippingModal] Error submitting:', error);
      Alert.alert('Error', 'Failed to add shipping information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Truck size={24} color={Colors.nautical.teal} />
              <Text style={styles.headerTitle}>Add Shipping Info</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.orderInfo}>
              <Package size={18} color={Colors.light.muted} />
              <Text style={styles.orderInfoText}>Order {orderNumber}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Provider *</Text>
              <View style={styles.providersGrid}>
                {SHIPPING_PROVIDERS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.providerChip,
                      provider === p && styles.providerChipSelected,
                    ]}
                    onPress={() => setProvider(p)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.providerChipText,
                        provider === p && styles.providerChipTextSelected,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tracking Number *</Text>
              <TextInput
                style={styles.input}
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                placeholder="Enter tracking number"
                placeholderTextColor={Colors.light.muted}
                autoCapitalize="characters"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estimated Delivery (Optional)</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color={Colors.light.muted} />
                <TextInput
                  style={styles.inputWithIconInput}
                  value={estimatedDelivery}
                  onChangeText={setEstimatedDelivery}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.muted}
                  editable={!isSubmitting}
                />
              </View>
              <Text style={styles.helperText}>
                Format: 2025-01-15 or leave blank
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g., Left at front door, signed by recipient"
                placeholderTextColor={Colors.light.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.switchSection}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Enable Auto Tracking</Text>
                <Text style={styles.switchDescription}>
                  Automatically update delivery status when carrier reports delivery
                </Text>
              </View>
              <Switch
                value={enableAutoTracking}
                onValueChange={setEnableAutoTracking}
                trackColor={{
                  false: Colors.light.border,
                  true: Colors.nautical.teal,
                }}
                thumbColor={Colors.white}
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Once you add shipping info, customers will be notified and can
                track their package. The order status will automatically update to
                &quot;Shipped&quot;.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Truck size={18} color={Colors.white} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Adding...' : 'Mark as Shipped'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  content: {
    padding: 20,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.sandLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  orderInfoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.cream,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  providerChipSelected: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  providerChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  providerChipTextSelected: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputWithIconInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  helperText: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 6,
  },
  switchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.nautical.teal,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
