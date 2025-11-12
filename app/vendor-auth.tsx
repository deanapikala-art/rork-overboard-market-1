import { router, Stack } from 'expo-router';
import { Store, Lock, Mail, ArrowLeft, Eye, EyeOff, Phone, CheckSquare, Square } from 'lucide-react-native';
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

import Colors from '@/app/constants/colors';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';

type AuthMode = 'signin' | 'signup';

export default function VendorAuthPage() {
  const insets = useSafeAreaInsets();
  const { signUp, signIn } = useVendorAuth();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (mode === 'signup' && !termsAccepted) {
      Alert.alert('Error', 'Please acknowledge the terms to continue');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(
          email,
          password,
          businessName || 'Vendor Business',
          undefined,
          phone || undefined
        );

        if (result.success) {
          if (result.error && result.error.includes('confirm')) {
            Alert.alert('Success', result.error);
          } else {
            console.log('[VendorAuth] Vendor signed up successfully - redirecting to onboarding');
            router.replace({
              pathname: '/vendor-onboarding',
              params: {
                businessName: businessName || '',
                phone: phone || '',
              },
            });
          }
        } else {
          Alert.alert('Error', result.error || 'Failed to sign up');
        }
      } else {
        const result = await signIn(email, password);

        if (result.success) {
          console.log('[VendorAuth] Vendor signed in successfully');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          router.replace('/vendor-dashboard');
        } else {
          Alert.alert('Error', result.error || 'Failed to sign in');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSSO = (provider: 'google' | 'apple') => {
    Alert.alert(
      'Coming Soon',
      `${provider === 'google' ? 'Google' : 'Apple'} sign-in will be available soon.`,
      [{ text: 'OK' }]
    );
    console.log(`[VendorAuth] SSO requested: ${provider}`);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be available soon. Please contact support if you need assistance.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, Colors.nautical.teal]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
              <Text style={styles.title}>Vendor Portal</Text>
              <Text style={styles.subtitle}>
                {mode === 'signup'
                  ? 'Open your booth, manage listings, go live on fair weekends'
                  : 'Welcome back to your booth'}
              </Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.modeToggleLink}
                onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                activeOpacity={0.7}
              >
                <Text style={styles.modeToggleLinkText}>
                  {mode === 'signup' ? "I already have an account" : "I'm new here"}
                </Text>
              </TouchableOpacity>

              {mode === 'signup' && (
                <>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabel}>
                      <Store size={18} color={Colors.nautical.teal} />
                      <Text style={styles.labelText}>Business Name (Optional)</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Your business or booth name"
                      placeholderTextColor={Colors.light.mediumGray}
                      value={businessName}
                      onChangeText={setBusinessName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabel}>
                      <Phone size={18} color={Colors.nautical.teal} />
                      <Text style={styles.labelText}>Phone (Optional)</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Your contact number"
                      placeholderTextColor={Colors.light.mediumGray}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Mail size={18} color={Colors.nautical.teal} />
                  <Text style={styles.labelText}>Email</Text>
                </View>
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
                <View style={styles.inputLabel}>
                  <Lock size={18} color={Colors.nautical.teal} />
                  <Text style={styles.labelText}>Password</Text>
                </View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor={Colors.light.mediumGray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={Colors.light.mediumGray} />
                    ) : (
                      <Eye size={20} color={Colors.light.mediumGray} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {mode === 'signup' && (
                <View style={styles.termsSection}>
                  <TouchableOpacity
                    style={styles.termsContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: termsAccepted }}
                  >
                    {termsAccepted ? (
                      <CheckSquare size={22} color={Colors.nautical.teal} strokeWidth={2.5} />
                    ) : (
                      <Square size={22} color={Colors.light.mediumGray} strokeWidth={2} />
                    )}
                    <Text style={styles.termsText}>
                      I acknowledge that I am an independent merchant and agree to the Vendor Agreement.
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.termsLink}
                    onPress={() => router.push('/legal/vendor-agreement')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.termsLinkText}>Read Vendor Agreement</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={mode === 'signup' ? 'Create account' : 'Sign in'}
              >
                <LinearGradient
                  colors={[Colors.light.terracotta, Colors.light.terracottaDark]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Processing...' : 'Continue'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.ssoButton}
                onPress={() => handleSSO('google')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <View style={styles.ssoButtonContent}>
                  <View style={styles.googleIconContainer}>
                    <View style={[styles.googleIconQuadrant, styles.googleBlue]} />
                    <View style={[styles.googleIconQuadrant, styles.googleRed]} />
                    <View style={[styles.googleIconQuadrant, styles.googleYellow]} />
                    <View style={[styles.googleIconQuadrant, styles.googleGreen]} />
                  </View>
                  <Text style={styles.ssoButtonText}>Continue with Google</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ssoButton, styles.ssoButtonApple]}
                onPress={() => handleSSO('apple')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple"
              >
                <View style={styles.ssoButtonContent}>
                  <View style={styles.appleIconContainer}>
                    <View style={styles.appleShape} />
                    <View style={styles.appleLeaf} />
                  </View>
                  <Text style={styles.ssoButtonAppleText}>Continue with Apple</Text>
                </View>
              </TouchableOpacity>

              {mode === 'signin' && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.footerButtonText}>Back to Welcome</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backButton: {
    marginLeft: 20,
    marginBottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modeToggleLink: {
    alignSelf: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modeToggleLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  input: {
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.charcoal,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.charcoal,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  termsSection: {
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.charcoal,
    lineHeight: 20,
  },
  termsLink: {
    alignSelf: 'flex-start',
    marginLeft: 34,
    paddingVertical: 4,
  },
  termsLinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textDecorationLine: 'underline',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.softGray,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: Colors.light.mediumGray,
    fontWeight: '500' as const,
  },
  ssoButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.light.softGray,
  },
  ssoButtonApple: {
    backgroundColor: Colors.light.charcoal,
    borderColor: Colors.light.charcoal,
  },
  ssoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 2,
    overflow: 'hidden',
  },
  googleIconQuadrant: {
    width: 11,
    height: 11,
  },
  googleBlue: {
    backgroundColor: '#4285F4',
  },
  googleRed: {
    backgroundColor: '#EA4335',
  },
  googleYellow: {
    backgroundColor: '#FBBC05',
  },
  googleGreen: {
    backgroundColor: '#34A853',
  },
  appleIconContainer: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  appleShape: {
    width: 16,
    height: 18,
    backgroundColor: Colors.white,
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 2,
  },
  appleLeaf: {
    width: 6,
    height: 6,
    backgroundColor: Colors.white,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    right: 4,
    transform: [{ rotate: '30deg' }],
  },
  ssoButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  ssoButtonAppleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.nautical.teal,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
  },
});
