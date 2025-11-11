import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import { router } from 'expo-router';
import { User, Mail, Lock, Phone, Shield, Eye } from 'lucide-react-native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

export default function CustomerAuthScreen() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wantsSms, setWantsSms] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, signInWithOAuth } = useCustomerAuth();

  const handleSSO = async (provider: 'google' | 'apple') => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await signInWithOAuth(provider);
      if (!result.success) {
        Alert.alert(
          'Authentication Error',
          result.error || `Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error(`[CustomerAuth] SSO error:`, err);
      Alert.alert(
        'Error',
        'An unexpected error occurred during sign in',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (isSignUp && !name) {
      setError('Name is required');
      return;
    }

    if (isSignUp && wantsSms && !phone) {
      setError('Phone number is required for SMS notifications');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, name, phone || undefined, wantsSms);
        if (result.success) {
          if (result.error && result.error.includes('confirm')) {
            setSuccessMessage(result.error);
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          if (result.error?.includes('already registered')) {
            setError(result.error);
          } else {
            setError(result.error || 'Failed to sign up');
          }
        }
      } else {
        const result = await signIn(email, password);
        if (result.success) {
          router.replace('/(tabs)/home');
        } else {
          setError(result.error || 'Failed to sign in');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.nautical.tealLight, Colors.nautical.sand]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source="https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2xy6wz02y7785e8tudlx0"
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.title}>
                {isSignUp ? 'Create Customer Account' : 'Customer Sign In'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp
                  ? 'Join Overboard Market — save your favorites, connect with local makers, and never miss a fair.'
                  : 'Welcome back! Sign in to see your favorite makers and discover what\u2019s new at the market.'}
              </Text>
              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.switchModeText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text style={styles.switchModeTextBold}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.browseAsGuestButton}
                onPress={() => router.replace('/(tabs)/home')}
                activeOpacity={0.7}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Browse as Guest"
              >
                <Eye size={16} color={Colors.nautical.teal} strokeWidth={2} />
                <Text style={styles.browseAsGuestText}>Browse as Guest</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <User color="#666" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!isSubmitting}
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Mail color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isSubmitting}
                />
              </View>

              {!isSignUp && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => {
                    Alert.alert(
                      'Reset Password',
                      'Password reset functionality will be available soon. Please contact support if you need immediate assistance.',
                      [{ text: 'OK' }]
                    );
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>
              )}

              {isSignUp && (
                <View style={styles.securityNote}>
                  <Shield size={14} color={Colors.nautical.teal} />
                  <Text style={styles.securityText}>
                    Your information is secure and never shared
                  </Text>
                </View>
              )}

              {isSignUp && (
                <>
                  <View style={styles.inputContainer}>
                    <Phone color="#666" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={wantsSms ? "Phone" : "Phone (optional)"}
                      placeholderTextColor="#999"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      editable={!isSubmitting}
                    />
                  </View>

                  <View style={styles.switchContainer}>
                    <View style={styles.switchTextContainer}>
                      <Text style={styles.switchLabel}>SMS Notifications</Text>
                      <Text style={styles.switchDescription}>
                        We&apos;ll notify you about upcoming events. We&apos;ll never spam you.
                      </Text>
                    </View>
                    <Switch
                      value={wantsSms}
                      onValueChange={setWantsSms}
                      disabled={isSubmitting}
                      trackColor={{ false: '#ddd', true: Colors.nautical.teal }}
                    />
                  </View>
                </>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  {error.includes('already registered') && isSignUp && (
                    <TouchableOpacity
                      style={styles.switchToSignInButton}
                      onPress={() => {
                        setIsSignUp(false);
                        setError('');
                      }}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.switchToSignInButtonText}>Go to Sign In</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
              {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {isSignUp && (
                <Text style={styles.nextStepText}>
                  Once you sign up, you&apos;ll be taken to the marketplace.
                </Text>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.ssoButton}
                onPress={() => handleSSO('google')}
                activeOpacity={0.7}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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

            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/login');
                }
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.skipButtonText}>← Back to Account Options</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 400,
    opacity: 0.15,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  browseAsGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: 'rgba(74, 124, 126, 0.08)',
    borderRadius: 8,
  },
  browseAsGuestText: {
    fontSize: 14,
    color: Colors.nautical.teal,
    fontWeight: '600' as const,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  form: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  securityText: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: Colors.nautical.teal,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  nextStepText: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
    textAlign: 'center',
    marginTop: 8,
  },
  switchModeButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  switchModeText: {
    fontSize: 14,
    color: '#666',
  },
  switchModeTextBold: {
    color: Colors.nautical.teal,
    fontWeight: '600' as const,
  },
  skipButton: {
    marginTop: 'auto',
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#999',
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorContainer: {
    gap: 12,
  },
  switchToSignInButton: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  switchToSignInButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#999',
    fontWeight: '500' as const,
  },
  ssoButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  ssoButtonApple: {
    backgroundColor: '#000',
    borderColor: '#000',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 2,
  },
  appleLeaf: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    right: 4,
    transform: [{ rotate: '30deg' }],
  },
  ssoButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
  },
  ssoButtonAppleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.nautical.teal,
    fontWeight: '500' as const,
  },
});
