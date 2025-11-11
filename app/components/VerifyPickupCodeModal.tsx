import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface VerifyPickupCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<{ success: boolean; message: string }>;
  orderNumber: string;
}

export default function VerifyPickupCodeModal({
  visible,
  onClose,
  onVerify,
  orderNumber,
}: VerifyPickupCodeModalProps) {
  const [code, setCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await onVerify(code);
      
      if (result.success) {
        Alert.alert(
          'Pickup Confirmed',
          'Order has been successfully marked as picked up.',
          [
            {
              text: 'OK',
              onPress: () => {
                setCode('');
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to verify pickup code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ShieldCheck size={24} color={Colors.nautical.teal} />
              <Text style={styles.title}>Verify Pickup</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.orderNumber}>Order {orderNumber}</Text>
            <Text style={styles.description}>
              Ask the customer for their 6-digit pickup code to confirm order collection.
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Pickup Code</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={Colors.light.muted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!isVerifying}
              />
              <Text style={styles.hint}>Enter the 6-digit code from the customer</Text>
            </View>

            <View style={styles.safetyBox}>
              <Text style={styles.safetyText}>
                🔒 Verify customer identity before accepting the code
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isVerifying}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (code.length !== 6 || isVerifying) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={code.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <ShieldCheck size={20} color={Colors.white} />
                  <Text style={styles.verifyButtonText}>Verify & Confirm</Text>
                </>
              )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.cream,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    letterSpacing: 12,
    fontFamily: 'monospace' as const,
  },
  hint: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  safetyBox: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 12,
  },
  safetyText: {
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
    paddingVertical: 14,
    borderRadius: 12,
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
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.nautical.teal,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
