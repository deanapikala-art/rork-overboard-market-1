import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, X, Shield, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SafetyWarningModalProps {
  visible: boolean;
  warnings: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  onDismiss: () => void;
  onProceed?: () => void;
  showProceedButton?: boolean;
}

export default function SafetyWarningModal({
  visible,
  warnings,
  severity,
  onDismiss,
  onProceed,
  showProceedButton = true,
}: SafetyWarningModalProps) {
  const severityConfig = getSeverityConfig(severity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: severityConfig.bgColor }]}>
            {severityConfig.icon}
          </View>

          <Text style={styles.title}>{severityConfig.title}</Text>
          <Text style={styles.subtitle}>{severityConfig.subtitle}</Text>

          <ScrollView style={styles.warningsContainer} showsVerticalScrollIndicator={false}>
            {warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}

            <View style={styles.tipsContainer}>
              <View style={styles.tipHeader}>
                <Shield size={16} color={Colors.nautical.teal} />
                <Text style={styles.tipHeaderText}>Safety Tips</Text>
              </View>
              <Text style={styles.tipText}>• Keep all transactions on Overboard Market</Text>
              <Text style={styles.tipText}>• Never share sensitive personal information</Text>
              <Text style={styles.tipText}>• Be wary of deals that seem too good to be true</Text>
              <Text style={styles.tipText}>• Report suspicious behavior immediately</Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>I Understand</Text>
            </TouchableOpacity>

            {showProceedButton && onProceed && (
              <TouchableOpacity
                style={[styles.button, styles.proceedButton]}
                onPress={onProceed}
              >
                <Lock size={16} color={Colors.light.muted} />
                <Text style={styles.proceedButtonText}>Proceed Carefully</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getSeverityConfig(severity: 'low' | 'medium' | 'high' | 'critical') {
  switch (severity) {
    case 'critical':
      return {
        title: 'Critical Security Warning',
        subtitle: 'This message contains potentially dangerous content',
        bgColor: '#FEE2E2',
        icon: <AlertTriangle size={32} color="#DC2626" />,
      };
    case 'high':
      return {
        title: 'Security Warning',
        subtitle: 'Please review this message carefully before proceeding',
        bgColor: '#FEF3C7',
        icon: <AlertTriangle size={32} color="#F59E0B" />,
      };
    case 'medium':
      return {
        title: 'Caution Advised',
        subtitle: 'This message may contain sensitive information',
        bgColor: '#FEF3C7',
        icon: <Shield size={32} color="#F59E0B" />,
      };
    case 'low':
      return {
        title: 'Informational Notice',
        subtitle: 'Please review the following information',
        bgColor: '#DBEAFE',
        icon: <Shield size={32} color="#3B82F6" />,
      };
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  warningsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  warningItem: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.terracotta,
  },
  warningText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  tipText: {
    fontSize: 13,
    color: Colors.nautical.oceanDeep,
    lineHeight: 20,
    marginBottom: 6,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dismissButton: {
    backgroundColor: Colors.nautical.teal,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  proceedButton: {
    backgroundColor: Colors.light.softGray,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
});
