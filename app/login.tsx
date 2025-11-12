import { router, Stack } from 'expo-router';
import { Lock, Mail, LogIn, UserPlus, Compass } from 'lucide-react-native';
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/app/constants/colors';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import { useAuth } from '@/app/contexts/AuthContext';

const ADMIN_EMAIL = 'admin@overboardnorth.com';
const ADMIN_PASSWORD = 'admin123';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn: customerSignIn } = useCustomerAuth();
  const { signInAsAdmin } = useAuth();

  const handleSignIn = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const success = await signInAsAdmin(email);
        if (success) {
          router.replace('/admin');
        } else {
          setError('Failed to sign in as admin');
        }
        return;
      }

      const vendorSession = await AsyncStorage.getItem('@overboard_vendor_session');
      if (vendorSession) {
        const session = JSON.parse(vendorSession);
        if (session.email === email) {
          router.replace('/vendor-dashboard');
          return;
        }
      }

      const result = await customerSignIn(email, password);
      if (result.success) {
        router.replace('/(tabs)/shop');
      } else {
        if (result.error?.includes('Invalid login credentials')) {
          setError('Account not found. Please sign up first or check your credentials.');
        } else {
          setError(result.error || 'Failed to sign in');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('[Login] Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    router.push('/user-type-selection' as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, Colors.nautical.teal, Colors.nautical.sandLight]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
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
                <View style={styles.compassMark}>
                  <Compass size={64} color={Colors.nautical.sandLight} strokeWidth={2} />
                </View>
                <Text style={styles.title}>Overboard Market</Text>
                <Text style={styles.subtitle}>Presented by Overboard North</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <LogIn size={32} color={Colors.nautical.teal} strokeWidth={2} />
                  <Text style={styles.cardTitle}>Welcome Back</Text>
                  <Text style={styles.cardSubtitle}>
                    Sign in to discover local makers or manage your small shop
                  </Text>
                </View>

                <View style={styles.form}>
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

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.signInButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleSignIn}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <UserPlus size={20} color={Colors.nautical.teal} style={styles.buttonIcon} />
                  <Text style={styles.signUpButtonText}>Create New Account</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Where small shops set sail.
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  compassMark: {
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '800' as const,
    color: Colors.nautical.sandLight,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginTop: 16,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 15,
    color: Colors.light.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    height: 56,
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
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
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
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.light.mediumGray,
    fontWeight: '500' as const,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  signUpButtonText: {
    color: Colors.nautical.teal,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic' as const,
    letterSpacing: 0.5,
  },
});
