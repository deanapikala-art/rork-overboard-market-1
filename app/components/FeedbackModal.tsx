import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useFeedback } from '../contexts/FeedbackContext';
import { trpc } from '../../lib/trpc';
import Colors from '../../constants/colors';

interface FeedbackModalProps {
  currentPage: string;
}

export function FeedbackModal({ currentPage }: FeedbackModalProps) {
  const { isVisible, hideFeedback } = useFeedback();
  const [issue, setIssue] = useState('');
  const [email, setEmail] = useState('');

  const submitFeedbackMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      console.log('✅ Feedback submitted successfully');
      Alert.alert('Thank you!', 'Your feedback has been submitted. We\'ll review it shortly.');
      setIssue('');
      setEmail('');
      hideFeedback();
    },
    onError: (error) => {
      console.error('❌ Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!issue.trim()) {
      Alert.alert('Missing Information', 'Please describe the issue you encountered.');
      return;
    }

    const deviceInfo = Platform.select({
      ios: 'iOS',
      android: 'Android',
      web: 'Web',
      default: 'Unknown',
    });

    console.log('📤 Submitting feedback:', {
      page: currentPage,
      issue: issue.trim(),
      email: email.trim() || undefined,
      timestamp: new Date().toISOString(),
      deviceInfo: `${deviceInfo} - ${Platform.OS}`,
    });

    submitFeedbackMutation.mutate({
      page: currentPage,
      issue: issue.trim(),
      email: email.trim() || undefined,
      timestamp: new Date().toISOString(),
      deviceInfo: `${deviceInfo} - ${Platform.OS}`,
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={hideFeedback}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={hideFeedback}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Report Issue / Feedback</Text>
              <Text style={styles.modalSubtitle}>Page: {currentPage}</Text>
            </View>
            <TouchableOpacity onPress={hideFeedback} style={styles.closeButton}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>What happened? *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              placeholder="Describe the issue you encountered..."
              placeholderTextColor={Colors.light.muted}
              value={issue}
              onChangeText={setIssue}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.light.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.helperText}>
              We&apos;ll use this to follow up if needed
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={hideFeedback}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                submitFeedbackMutation.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitFeedbackMutation.isPending}
            >
              <Text style={styles.submitButtonText}>
                {submitFeedbackMutation.isPending ? 'Sending...' : 'Submit'}
              </Text>
              {!submitFeedbackMutation.isPending && (
                <Send size={18} color={Colors.light.card} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...Platform.select({
      web: {
        maxHeight: 600,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 140,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
});
