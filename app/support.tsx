import { router, Stack } from 'expo-router';
import { Mail, MessageCircle, Send, ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendEmail = () => {
    if (!subject.trim() && !message.trim()) {
      Alert.alert('Empty Message', 'Please enter a subject or message before sending.');
      return;
    }

    const emailSubject = subject.trim() || 'Support Request from Overboard Market App';
    const emailBody = message.trim() || 'No message provided';

    const mailtoUrl = `mailto:info@overboardnorth.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Unable to Open Email',
        'Please email us directly at info@overboardnorth.com',
        [{ text: 'OK' }]
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={Colors.nautical.oceanDeep} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MessageCircle size={28} color={Colors.nautical.teal} />
          <Text style={styles.headerTitle}>Support</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>How can we help?</Text>
          <Text style={styles.introText}>
            Have an issue, feedback, or enhancement idea? Send us a message and we&apos;ll get back to you within 24–48 hours.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="What's this about?"
              placeholderTextColor={Colors.light.muted}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Describe your issue, feedback, or idea..."
              placeholderTextColor={Colors.light.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendEmail}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Send email"
          >
            <Send size={20} color={Colors.white} />
            <Text style={styles.sendButtonText}>Send Email</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            This will open your default email app with your message pre-filled.
          </Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or reach out directly</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactInfoTitle}>Contact Information</Text>
          
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:info@overboardnorth.com')}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <Mail size={22} color={Colors.nautical.teal} />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>info@overboardnorth.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryChips}>
          <Text style={styles.categoryChipsTitle}>Common topics:</Text>
          <View style={styles.chips}>
            {['Technical Issue', 'Feature Request', 'Account Help', 'Order Question', 'Vendor Inquiry', 'General Feedback'].map((topic) => (
              <TouchableOpacity
                key={topic}
                style={styles.chip}
                onPress={() => setSubject(topic)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.responseNote}>
          <Text style={styles.responseNoteText}>
            💬 We typically respond within 24–48 hours. For urgent issues, please include &quot;URGENT&quot; in your subject line.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  intro: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  introTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.darkGray,
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.charcoal,
  },
  messageInput: {
    minHeight: 150,
    paddingTop: 14,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 32,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '500' as const,
  },
  contactInfo: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contactInfoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.nautical.teal}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  categoryChips: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  categoryChipsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.darkGray,
  },
  responseNote: {
    marginTop: 32,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: `${Colors.nautical.teal}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.nautical.teal,
  },
  responseNoteText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.darkGray,
  },
});
