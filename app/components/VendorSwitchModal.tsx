import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';

import Colors from '@/app/constants/colors';

interface VendorSwitchModalProps {
  visible: boolean;
  currentVendorName: string;
  newVendorName: string;
  onStartNew: () => void;
  onKeepCurrent: () => void;
}

export default function VendorSwitchModal({
  visible,
  currentVendorName,
  newVendorName,
  onStartNew,
  onKeepCurrent,
}: VendorSwitchModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepCurrent}
    >
      <Pressable style={styles.backdrop} onPress={onKeepCurrent}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modal}>
            <Text style={styles.title}>Switch Vendor Cart?</Text>
            <Text style={styles.message}>
              This cart belongs to <Text style={styles.vendorName}>{currentVendorName}</Text>.
            </Text>
            <Text style={styles.message}>
              Start a new cart with <Text style={styles.vendorName}>{newVendorName}</Text>?
            </Text>
            <Text style={styles.saveNote}>You can save your current cart for later.</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onKeepCurrent}
              >
                <Text style={styles.secondaryButtonText}>Keep Current Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onStartNew}
              >
                <Text style={styles.primaryButtonText}>Start New Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  saveNote: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.light.terracotta,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
});
