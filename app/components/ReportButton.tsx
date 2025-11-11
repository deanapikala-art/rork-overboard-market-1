import { AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useReports, ReportType, TargetType } from '@/app/contexts/ReportsContext';

type ReportButtonProps = {
  targetId: string;
  targetType: TargetType;
  targetName?: string;
  orderId?: string;
  messageId?: string;
  compact?: boolean;
};

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'vendor_misconduct', label: 'Vendor Misconduct', description: 'Scams, no shipment, rude behavior' },
  { value: 'buyer_misconduct', label: 'Buyer Misconduct', description: 'Fraudulent payment, harassment' },
  { value: 'product_violation', label: 'Product Violation', description: 'Counterfeit or banned goods' },
  { value: 'harassment', label: 'Harassment', description: 'Threatening or abusive behavior' },
  { value: 'scam', label: 'Scam or Fraud', description: 'Suspected fraudulent activity' },
  { value: 'payment_issue', label: 'Payment Issue', description: 'Payment disputes or problems' },
  { value: 'other', label: 'Other', description: 'Other issues not listed above' },
];

export default function ReportButton({
  targetId,
  targetType,
  targetName,
  orderId,
  messageId,
  compact = false,
}: ReportButtonProps) {
  const { createReport } = useReports();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Missing Information', 'Please select a report type');
      return;
    }

    if (!reason.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please provide both a reason and description');
      return;
    }

    setIsSubmitting(true);

    const result = await createReport({
      target_id: targetId,
      target_type: targetType,
      target_name: targetName,
      report_type: selectedType,
      reason: reason.trim(),
      description: description.trim(),
      order_id: orderId,
      message_id: messageId,
    });

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our team will review it within 24-72 hours.',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
      setSelectedType(null);
      setReason('');
      setDescription('');
    } else {
      Alert.alert('Error', result.error || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, compact && styles.buttonCompact]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <AlertTriangle size={compact ? 16 : 20} color="#EE6E56" />
        <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>Report</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Submit Report</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>
                Reporting: <Text style={styles.targetName}>{targetName || `${targetType} ${targetId.slice(0, 8)}`}</Text>
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Type</Text>
              {REPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeOption, selectedType === type.value && styles.typeOptionSelected]}
                  onPress={() => setSelectedType(type.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeHeader}>
                    <View style={[styles.radio, selectedType === type.value && styles.radioSelected]}>
                      {selectedType === type.value && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.typeLabel, selectedType === type.value && styles.typeLabelSelected]}>
                      {type.label}
                    </Text>
                  </View>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Brief Reason</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., No response to messages, item not shipped"
                placeholderTextColor="#999"
                value={reason}
                onChangeText={setReason}
                maxLength={100}
              />
              <Text style={styles.charCount}>{reason.length}/100</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please provide as much detail as possible about this issue..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            <View style={styles.disclaimer}>
              <AlertTriangle size={16} color="#EE6E56" />
              <Text style={styles.disclaimerText}>
                False reports may result in account penalties. All reports are reviewed by our Trust & Safety team.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EE6E56',
    backgroundColor: '#FFF5F3',
  },
  buttonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EE6E56',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  targetName: {
    fontWeight: '600' as const,
    color: '#2B3440',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2B3440',
    marginBottom: 12,
  },
  typeOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DCC0',
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  typeOptionSelected: {
    borderColor: '#4C7D7C',
    backgroundColor: '#F0F7F7',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#4C7D7C',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4C7D7C',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2B3440',
  },
  typeLabelSelected: {
    color: '#4C7D7C',
  },
  typeDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8DCC0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2B3440',
    backgroundColor: '#FFF',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF5F3',
    borderRadius: 8,
    marginTop: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#4C7D7C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
});
