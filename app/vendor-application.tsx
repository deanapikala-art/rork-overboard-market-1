import { router, Stack } from 'expo-router';
import { ArrowLeft, Store, Image as ImageIcon, Send, CheckCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Colors from '@/app/constants/colors';

export default function VendorApplicationPage() {
  const insets = useSafeAreaInsets();
  const [submitted, setSubmitted] = useState(false);
  
  const [applicantName, setApplicantName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  
  const [portfolioImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    'https://images.unsplash.com/photo-1487700160041-babef9c3cb55?w=400&q=80',
  ]);

  const handleSubmit = () => {
    if (!applicantName || !businessName || !email || !phone || !specialty || !description) {
      Alert.alert('Required Fields', 'Please fill in all required fields to submit your application.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    console.log('[VendorApplication] Submitting application:', {
      applicantName,
      businessName,
      email,
      phone,
      specialty,
      description,
      websiteUrl,
      instagramHandle,
      portfolioImages,
    });

    setSubmitted(true);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[Colors.nautical.oceanDeep, Colors.nautical.teal]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={[styles.successContainer, { paddingTop: insets.top + 60 }]}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={80} color={Colors.nautical.sandLight} strokeWidth={2.5} />
            </View>
            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successMessage}>
              Thank you for applying to become a vendor at Overboard North. We&apos;ll review your application and get back to you within 3-5 business days.
            </Text>
            <Text style={styles.successSubtext}>
              We&apos;ll send updates to {email}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => router.replace('/')}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, Colors.nautical.teal]}
        style={[styles.topSection, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Store size={56} color={Colors.nautical.sandLight} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Vendor Application</Text>
          <Text style={styles.subtitle}>
            Join Overboard North&apos;s craft marketplace and showcase your handmade goods
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="First and Last Name"
                placeholderTextColor={Colors.light.mediumGray}
                value={applicantName}
                onChangeText={setApplicantName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your shop or booth name"
                placeholderTextColor={Colors.light.mediumGray}
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.light.mediumGray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={Colors.light.mediumGray}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>About Your Craft</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specialty/Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Candles, Jewelry, Woodwork, etc."
                placeholderTextColor={Colors.light.mediumGray}
                value={specialty}
                onChangeText={setSpecialty}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your craft, your process, and what makes your work special..."
                placeholderTextColor={Colors.light.mediumGray}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Online Presence (Optional)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={Colors.light.mediumGray}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instagram Handle</Text>
              <TextInput
                style={styles.input}
                placeholder="@yourusername"
                placeholderTextColor={Colors.light.mediumGray}
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Portfolio</Text>
            <Text style={styles.portfolioHint}>
              Upload 2-5 images showcasing your work
            </Text>

            <View style={styles.portfolioGrid}>
              {portfolioImages.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.portfolioImage}
                  contentFit="cover"
                />
              ))}
              <TouchableOpacity style={styles.addImageButton} activeOpacity={0.7}>
                <ImageIcon size={32} color={Colors.nautical.teal} />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                By submitting this application, you acknowledge that you are an independent merchant and agree to review the Vendor Agreement if approved.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.light.terracotta, Colors.light.terracottaDark]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Send size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  gradient: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.nautical.sandLight,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
    lineHeight: 22,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.charcoal,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 24,
  },
  portfolioHint: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  portfolioImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.light.softGray,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.sandLight,
  },
  addImageText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: Colors.nautical.sandLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.charcoal,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.nautical.sandLight,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  successSubtext: {
    fontSize: 14,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic' as const,
  },
  successButton: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  successButtonText: {
    color: Colors.nautical.teal,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
});
