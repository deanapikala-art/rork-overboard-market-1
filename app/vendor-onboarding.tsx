import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Store,
  Upload,
  CreditCard,
  MapPin,
  Package,
  Eye,
  CheckCircle,
  ChevronRight,
  Image as ImageIcon,
  DollarSign,
  CheckSquare,
  Square,
  FileText,
  ExternalLink,
  ShoppingBag,
  Video,
  Share2,
  Link,
  Heart,
  Users,
  Award,
  Clock,
} from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';

type StepType = 'booth' | 'payments' | 'location' | 'product' | 'goLive';

interface OnboardingData {
  booth: {
    logoUrl: string;
    bannerUrl: string;
    bio: string;
    businessName: string;
  };
  payments: {
    ecommerce_url: string;
    paypal_link: string;
    venmo_handle: string;
    cashapp_handle: string;
  };
  location: {
    address_line1: string;
    city: string;
    state: string;
    zip: string;
    pickup_available: boolean;
    pickup_instructions: string;
    pickup_scheduler_url: string;
  };
  product: {
    created: boolean;
  };
  goLive: {
    booth_visible: boolean;
    accepted_vendor_agreement: boolean;
    accepted_insurance_terms: boolean;
  };
}

interface StepCompletion {
  booth: boolean;
  payments: boolean;
  location: boolean;
  product: boolean;
  goLive: boolean;
}

export default function VendorOnboardingPage() {
  const insets = useSafeAreaInsets();
  const { user } = useVendorAuth();
  const params = useLocalSearchParams<{ businessName?: string; phone?: string }>();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepType>('booth');
  const [data, setData] = useState<OnboardingData>({
    booth: {
      logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80',
      bio: '',
      businessName: params.businessName || '',
    },
    payments: {
      ecommerce_url: '',
      paypal_link: '',
      venmo_handle: '',
      cashapp_handle: '',
    },
    location: {
      address_line1: '',
      city: '',
      state: '',
      zip: '',
      pickup_available: false,
      pickup_instructions: '',
      pickup_scheduler_url: params.phone || '',
    },
    product: {
      created: false,
    },
    goLive: {
      booth_visible: false,
      accepted_vendor_agreement: false,
      accepted_insurance_terms: false,
    },
  });

  const [completion, setCompletion] = useState<StepCompletion>({
    booth: false,
    payments: false,
    location: false,
    product: false,
    goLive: false,
  });

  const loadProgress = useCallback(async () => {
    if (!user?.id) {
      console.log('[VendorOnboarding] No user ID, skipping progress load');
      return;
    }

    try {
      const storageKey = `@overboard_vendor_onboarding_${user.id}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed.data);
        setCompletion(parsed.completion);
        console.log('[VendorOnboarding] Progress loaded for user:', user.id);
      } else {
        console.log('[VendorOnboarding] No saved progress found for user:', user.id);
      }
    } catch (error) {
      console.error('[VendorOnboarding] Error loading progress:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadProgress();
    }
  }, [user?.id, loadProgress]);

  useEffect(() => {
    const checkProductCreation = async () => {
      if (!user?.id) return;
      
      const productsKey = '@overboard_vendor_products';
      const stored = await AsyncStorage.getItem(productsKey);
      
      if (stored) {
        const products = JSON.parse(stored);
        const userProducts = products.filter((p: { vendorId: string }) => p.vendorId === user.id);
        
        if (userProducts.length > 0 && !data.product.created) {
          console.log('[VendorOnboarding] Product detected, marking step as complete');
          const newData = { ...data, product: { created: true } };
          const newCompletion = { ...completion, product: true };
          setData(newData);
          setCompletion(newCompletion);
          await saveProgress(newData, newCompletion);
        }
      }
    };
    
    checkProductCreation();
  }, [user?.id]);

  const saveProgress = async (
    newData: OnboardingData,
    newCompletion: StepCompletion
  ) => {
    if (!user?.id) {
      console.log('[VendorOnboarding] No user ID, skipping progress save');
      return;
    }

    try {
      const storageKey = `@overboard_vendor_onboarding_${user.id}`;
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({ data: newData, completion: newCompletion })
      );
      console.log('[VendorOnboarding] Progress saved for user:', user.id);
    } catch (error) {
      console.error('[VendorOnboarding] Error saving progress:', error);
    }
  };

  const updateData = (
    step: StepType,
    field: string,
    value: string | boolean
  ) => {
    setData((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value,
      },
    }));
  };

  const isStepComplete = (step: StepType): boolean => {
    switch (step) {
      case 'booth':
        return !!(
          data.booth.businessName.trim() &&
          data.booth.bio.trim() &&
          data.booth.logoUrl &&
          data.booth.bannerUrl
        );
      case 'payments':
        return !!(
          data.payments.ecommerce_url ||
          data.payments.paypal_link ||
          data.payments.venmo_handle ||
          data.payments.cashapp_handle
        );
      case 'location':
        return !!(
          data.location.address_line1.trim() &&
          data.location.city.trim() &&
          data.location.state.trim() &&
          data.location.zip.trim()
        );
      case 'product':
        return data.product.created;
      case 'goLive':
        return (
          data.goLive.booth_visible &&
          data.goLive.accepted_vendor_agreement &&
          data.goLive.accepted_insurance_terms
        );
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    if (!isStepComplete(currentStep)) {
      Alert.alert('Incomplete', 'Please fill in all required fields to continue.');
      return;
    }

    const newCompletion = { ...completion, [currentStep]: true };
    setCompletion(newCompletion);

    await saveProgress(data, newCompletion);

    if (currentStep === 'booth' && data.booth.businessName) {
      try {
        const sessionData = await AsyncStorage.getItem('@overboard_vendor_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.businessName = data.booth.businessName;
          await AsyncStorage.setItem('@overboard_vendor_session', JSON.stringify(session));
          console.log('[VendorOnboarding] Updated session with business name:', data.booth.businessName);
        }
      } catch (error) {
        console.error('[VendorOnboarding] Error updating session:', error);
      }
    }

    const steps: StepType[] = ['booth', 'payments', 'location', 'product', 'goLive'];
    const currentIndex = steps.indexOf(currentStep);
    const nextStep = steps[currentIndex + 1];

    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      const allComplete = Object.values(newCompletion).every((v) => v);
      if (allComplete) {
        Alert.alert(
          'Onboarding Complete!',
          'Your vendor booth is ready. Welcome to Overboard Market!',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => router.replace('/vendor-dashboard'),
            },
          ]
        );
      }
    }
  };

  const handleCreateProduct = async () => {
    console.log('[VendorOnboarding] Create Product button pressed');
    
    if (!user?.id) {
      console.error('[VendorOnboarding] No user found');
      Alert.alert('Error', 'Please try again. If the problem persists, sign out and sign back in.');
      return;
    }
    
    Alert.alert(
      'Create Product',
      'Would you like to add your first product now or skip this step?\n\nYou can always add products later from your vendor dashboard.',
      [
        {
          text: 'Skip for Now',
          style: 'cancel',
          onPress: () => {
            Alert.alert(
              'Skip Product Creation?',
              'Are you sure you want to skip? You can add products later from your dashboard.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Skip',
                  onPress: async () => {
                    console.log('[VendorOnboarding] Marking product step as complete (skipped)');
                    const newData = { ...data, product: { created: true } };
                    const newCompletion = { ...completion, product: true };
                    setData(newData);
                    setCompletion(newCompletion);
                    await saveProgress(newData, newCompletion);
                    console.log('[VendorOnboarding] Product step marked as complete');
                  },
                },
              ]
            );
          },
        },
        {
          text: 'Add Product',
          onPress: () => {
            console.log('[VendorOnboarding] Navigating to product creation');
            router.push('/vendor-product-create?fromOnboarding=true');
          },
        },
      ]
    );
  };

  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log(`[VendorOnboarding] ${type} image selected:`, uri);
        
        if (type === 'logo') {
          updateData('booth', 'logoUrl', uri);
        } else {
          updateData('booth', 'bannerUrl', uri);
        }
      }
    } catch (error) {
      console.error(`[VendorOnboarding] Error picking ${type} image:`, error);
      Alert.alert('Error', `Failed to pick ${type} image. Please try again.`);
    }
  };

  const handleGoLive = () => {
    const newData = {
      ...data,
      goLive: {
        booth_visible: true,
        accepted_vendor_agreement: data.goLive.accepted_vendor_agreement,
        accepted_insurance_terms: data.goLive.accepted_insurance_terms,
      },
    };
    const newCompletion = { ...completion, goLive: true };
    setData(newData);
    setCompletion(newCompletion);
    saveProgress(newData, newCompletion);
    
    Alert.alert(
      'Booth is Now Live!',
      'Congratulations! Your booth is visible to customers.',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => router.replace('/vendor-dashboard'),
        },
      ]
    );
  };

  const completionPercentage = (): number => {
    const total = 5;
    const completed = Object.values(completion).filter((v) => v).length;
    return Math.round((completed / total) * 100);
  };

  const renderProgressBar = () => {
    const percentage = completionPercentage();
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{percentage}% Complete</Text>
      </View>
    );
  };

  const renderStepIndicator = (step: StepType, label: string, icon: React.ReactNode) => {
    const isActive = currentStep === step;
    const isComplete = completion[step];
    return (
      <TouchableOpacity
        style={[
          styles.stepIndicator,
          isActive && styles.stepIndicatorActive,
          isComplete && styles.stepIndicatorComplete,
        ]}
        onPress={() => setCurrentStep(step)}
        activeOpacity={0.7}
      >
        <View style={styles.stepIconContainer}>
          {isComplete ? (
            <CheckCircle size={20} color={Colors.nautical.teal} strokeWidth={2.5} />
          ) : (
            icon
          )}
        </View>
        <Text
          style={[
            styles.stepIndicatorText,
            isActive && styles.stepIndicatorTextActive,
            isComplete && styles.stepIndicatorTextComplete,
          ]}
        >
          {label}
        </Text>
        {!isComplete && isActive && <ChevronRight size={16} color={Colors.nautical.teal} />}
      </TouchableOpacity>
    );
  };

  const renderBoothStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Store size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Booth Basics</Text>
        <Text style={styles.stepDescription}>
          Step 1: Create your booth&apos;s visual identity.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Name *</Text>
        <TextInput
          style={styles.input}
          value={data.booth.businessName}
          onChangeText={(text) => updateData('booth', 'businessName', text)}
          placeholder="Your business or booth name"
          placeholderTextColor={Colors.light.mediumGray}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Logo / Avatar</Text>
        <Text style={styles.helperText}>
          Add your shop logo or profile photo to help customers recognize your brand.
        </Text>
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: data.booth.logoUrl }}
            style={styles.logoImage}
            contentFit="cover"
          />
          <TouchableOpacity 
            style={styles.uploadOverlayButton}
            onPress={() => pickImage('logo')}
            activeOpacity={0.8}
          >
            <Upload size={18} color={Colors.white} />
            <Text style={styles.uploadOverlayText}>Change Logo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Booth Banner</Text>
        <Text style={styles.helperText}>
          Recommended size: 1200x400 pixels for best display.
        </Text>
        <View style={styles.bannerPreviewContainer}>
          <Image
            source={{ uri: data.booth.bannerUrl }}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <View style={styles.bannerOverlay}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage('banner')}
              activeOpacity={0.8}
            >
              <Upload size={18} color={Colors.white} />
              <Text style={styles.uploadButtonText}>Change Banner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.inputGroup, styles.bioInputGroup]}>
        <Text style={styles.inputLabel}>Booth Bio *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={data.booth.bio}
          onChangeText={(text) => updateData('booth', 'bio', text)}
          placeholder="Share your story! Tell shoppers what inspires your craft and what makes your products unique."
          placeholderTextColor={Colors.light.mediumGray}
          multiline
          numberOfLines={5}
        />
      </View>

      <TouchableOpacity
        style={[styles.continueButtonWrapper, !isStepComplete('booth') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('booth')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Save & Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <CreditCard size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Payment Methods</Text>
        <Text style={styles.stepDescription}>
          Step 2 of 3 — Payments
        </Text>
        <Text style={styles.stepSubtext}>
          Connect your checkout links so customers can buy directly from you, commission-free.
        </Text>
        <Text style={styles.helperNote}>
          Add one or more payment methods below. You only need to include the options you actively use.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>E-commerce Website URL</Text>
        <TextInput
          style={styles.input}
          value={data.payments.ecommerce_url}
          onChangeText={(text) => updateData('payments', 'ecommerce_url', text)}
          placeholder="https://yourstore.com/shop"
          placeholderTextColor={Colors.light.mediumGray}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>PayPal.me or Checkout Link</Text>
        <TextInput
          style={styles.input}
          value={data.payments.paypal_link}
          onChangeText={(text) => updateData('payments', 'paypal_link', text)}
          placeholder="https://paypal.me/yourusername"
          placeholderTextColor={Colors.light.mediumGray}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Venmo Handle (without @)</Text>
        <TextInput
          style={styles.input}
          value={data.payments.venmo_handle}
          onChangeText={(text) => updateData('payments', 'venmo_handle', text)}
          placeholder="yourusername"
          placeholderTextColor={Colors.light.mediumGray}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cash App Handle (without $)</Text>
        <TextInput
          style={styles.input}
          value={data.payments.cashapp_handle}
          onChangeText={(text) => updateData('payments', 'cashapp_handle', text)}
          placeholder="yourusername"
          placeholderTextColor={Colors.light.mediumGray}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.disclaimerCard}>
        <View style={styles.disclaimerIcon}>
          <DollarSign size={22} color={Colors.nautical.teal} strokeWidth={2.5} />
        </View>
        <View style={styles.disclaimerContent}>
          <Text style={styles.disclaimerTitle}>💡 Note: You are the merchant of record.</Text>
          <Text style={styles.disclaimerText}>
            Orders are processed directly through your payment accounts.
          </Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          🛠️ Tip: You can update or add more payment options anytime after setup.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.continueButtonWrapper,
          !isStepComplete('payments') && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('payments')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Save & Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.editAnytimeText}>
        You can edit these details anytime in your vendor dashboard.
      </Text>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <MapPin size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Location & Pickup</Text>
        <Text style={styles.stepDescription}>
          Step 3: Add your shop&apos;s location and pickup details so local customers can find you easily.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address Line 1 *</Text>
        <TextInput
          style={styles.input}
          value={data.location.address_line1}
          onChangeText={(text) => updateData('location', 'address_line1', text)}
          placeholder="123 Main St"
          placeholderTextColor={Colors.light.mediumGray}
        />
        <Text style={styles.helperText}>
          Your address helps customers find you for local pickup. This will only be visible if you enable local pickup below.
        </Text>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={styles.input}
            value={data.location.city}
            onChangeText={(text) => updateData('location', 'city', text)}
            placeholder="Portland"
            placeholderTextColor={Colors.light.mediumGray}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.inputLabel}>State *</Text>
          <TextInput
            style={styles.input}
            value={data.location.state}
            onChangeText={(text) => updateData('location', 'state', text)}
            placeholder="OR"
            placeholderTextColor={Colors.light.mediumGray}
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ZIP Code *</Text>
        <TextInput
          style={styles.input}
          value={data.location.zip}
          onChangeText={(text) => updateData('location', 'zip', text)}
          placeholder="97209"
          placeholderTextColor={Colors.light.mediumGray}
          keyboardType="number-pad"
          maxLength={5}
        />
      </View>

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() =>
          updateData('location', 'pickup_available', !data.location.pickup_available)
        }
        activeOpacity={0.7}
      >
        <View style={styles.switchIconContainer}>
          <MapPin size={20} color={Colors.nautical.teal} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Offer Local Pickup</Text>
          <Text style={styles.switchSubtext}>Let nearby customers pick up their orders directly from you.</Text>
          {data.location.pickup_available && (
            <Text style={styles.switchActiveSubtext}>
              You&apos;ll be able to share pickup instructions after setup.
            </Text>
          )}
        </View>
        {data.location.pickup_available ? (
          <CheckSquare size={26} color={Colors.nautical.teal} strokeWidth={2.5} />
        ) : (
          <Square size={26} color={Colors.light.mediumGray} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {data.location.pickup_available && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={data.location.pickup_instructions}
              onChangeText={(text) => updateData('location', 'pickup_instructions', text)}
              placeholder="Provide details like hours, parking, location..."
              placeholderTextColor={Colors.light.mediumGray}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Scheduler URL (Optional)</Text>
            <TextInput
              style={styles.input}
              value={data.location.pickup_scheduler_url}
              onChangeText={(text) => updateData('location', 'pickup_scheduler_url', text)}
              placeholder="https://calendly.com/yourname/pickup"
              placeholderTextColor={Colors.light.mediumGray}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.continueButtonWrapper,
          !isStepComplete('location') && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('location')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Finish Setup</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.editAnytimeText}>
        💡 You can update your address or pickup settings anytime in your vendor dashboard.
      </Text>
    </View>
  );

  const renderProductStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Package size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>First Product</Text>
        <Text style={styles.stepDescription}>
          Step 4: Create your first product listing.
        </Text>
      </View>

      {!data.product.created ? (
        <View style={styles.emptyStateCard}>
          <ImageIcon size={48} color={Colors.light.muted} />
          <Text style={styles.emptyStateTitle}>No Products Yet</Text>
          <Text style={styles.emptyStateText}>
            Add your first product to start selling at the fair.
          </Text>
          <TouchableOpacity style={styles.createProductButton} onPress={handleCreateProduct}>
            <Package size={20} color={Colors.white} />
            <Text style={styles.createProductButtonText}>Create Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.successCard}>
          <CheckCircle size={48} color={Colors.nautical.teal} strokeWidth={2} />
          <Text style={styles.successTitle}>Product Created!</Text>
          <Text style={styles.successText}>
            Great! You&apos;ve added your first product. You can add more anytime from your dashboard.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.continueButtonWrapper,
          !isStepComplete('product') && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!isStepComplete('product')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Save & Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGoLiveStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Eye size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Go Live</Text>
        <Text style={styles.stepDescription}>
          Step 5: Review and accept our terms, then make your booth visible!
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Setup Summary</Text>
        <View style={styles.summaryRow}>
          <CheckCircle size={18} color={Colors.nautical.teal} strokeWidth={2} />
          <Text style={styles.summaryText}>Booth basics configured</Text>
        </View>
        <View style={styles.summaryRow}>
          <CheckCircle size={18} color={Colors.nautical.teal} strokeWidth={2} />
          <Text style={styles.summaryText}>Payment methods added</Text>
        </View>
        <View style={styles.summaryRow}>
          <CheckCircle size={18} color={Colors.nautical.teal} strokeWidth={2} />
          <Text style={styles.summaryText}>Location & pickup set</Text>
        </View>
        <View style={styles.summaryRow}>
          <CheckCircle size={18} color={Colors.nautical.teal} strokeWidth={2} />
          <Text style={styles.summaryText}>First product created</Text>
        </View>
      </View>

      {!data.goLive.booth_visible ? (
        <>
          <View style={styles.legalSection}>
            <View style={styles.legalHeader}>
              <FileText size={24} color={Colors.nautical.teal} strokeWidth={2} />
              <Text style={styles.legalHeaderText}>Legal Agreements</Text>
            </View>
            <Text style={styles.legalSubtext}>
              Please review and accept the following agreements to continue.
            </Text>

            <TouchableOpacity
              style={styles.agreementRow}
              onPress={() =>
                updateData('goLive', 'accepted_vendor_agreement', !data.goLive.accepted_vendor_agreement)
              }
              activeOpacity={0.7}
            >
              {data.goLive.accepted_vendor_agreement ? (
                <CheckSquare size={24} color={Colors.nautical.teal} strokeWidth={2.5} />
              ) : (
                <Square size={24} color={Colors.light.mediumGray} strokeWidth={2} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.agreementLabel}>
                  I have read and agree to the Vendor Agreement *
                </Text>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.push('/legal/vendor-agreement')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>Read Vendor Agreement</Text>
                  <ExternalLink size={14} color={Colors.nautical.teal} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.agreementRow}
              onPress={() =>
                updateData('goLive', 'accepted_insurance_terms', !data.goLive.accepted_insurance_terms)
              }
              activeOpacity={0.7}
            >
              {data.goLive.accepted_insurance_terms ? (
                <CheckSquare size={24} color={Colors.nautical.teal} strokeWidth={2.5} />
              ) : (
                <Square size={24} color={Colors.light.mediumGray} strokeWidth={2} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.agreementLabel}>
                  I understand the insurance requirements *
                </Text>
                <Text style={styles.agreementSubtext}>
                  Vendors are encouraged to maintain liability insurance and may be required to provide
                  proof for live events.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Eye size={20} color={Colors.nautical.teal} />
            <Text style={styles.infoCardText}>
              Once you go live, customers will be able to browse your booth and purchase your
              products.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.goLiveButton,
              (!data.goLive.accepted_vendor_agreement || !data.goLive.accepted_insurance_terms) &&
                styles.goLiveButtonDisabled,
            ]}
            onPress={handleGoLive}
            disabled={!data.goLive.accepted_vendor_agreement || !data.goLive.accepted_insurance_terms}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.light.terracotta, Colors.light.terracottaDark]}
              style={styles.goLiveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Eye size={22} color={Colors.white} />
              <Text style={styles.goLiveButtonText}>Make Booth Visible</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.nautical.teal} strokeWidth={2} />
          <Text style={styles.successTitle}>Your Booth is Live!</Text>
          <Text style={styles.successText}>
            Congratulations! Your booth is now visible to customers at the fair.
          </Text>
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => router.replace('/vendor-dashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            <ChevronRight size={20} color={Colors.nautical.teal} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeEmoji}>🧺</Text>
        <Text style={styles.welcomeTitle}>Welcome to Overboard Market!</Text>
        <Text style={styles.welcomeSubtitle}>
          Where small shops set sail.
        </Text>
        <Text style={styles.welcomeDescription}>
          We&apos;ve kept pricing simple and transparent — no confusing tiers, no surprise fees, and absolutely no commissions taken from your sales.
        </Text>
      </View>

      <View style={styles.pricingSection}>
        <View style={styles.pricingSectionHeader}>
          <DollarSign size={28} color={Colors.nautical.teal} strokeWidth={2.5} />
          <Text style={styles.pricingSectionTitle}>How It Works</Text>
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.pricingCardHeader}>
            <Text style={styles.pricingAmount}>$15/month</Text>
            <Text style={styles.pricingBadge}>One flat fee</Text>
          </View>
          <Text style={styles.pricingCardLabel}>Includes:</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <ShoppingBag size={18} color={Colors.nautical.teal} strokeWidth={2.5} />
              <Text style={styles.featureText}>Marketplace listing (your booth stays live all month)</Text>
            </View>
            <View style={styles.featureItem}>
              <Video size={18} color={Colors.nautical.teal} strokeWidth={2.5} />
              <Text style={styles.featureText}>Entry to all live fairs that month</Text>
            </View>
            <View style={styles.featureItem}>
              <Share2 size={18} color={Colors.nautical.teal} strokeWidth={2.5} />
              <Text style={styles.featureText}>Social and event exposure</Text>
            </View>
            <View style={styles.featureItem}>
              <Link size={18} color={Colors.nautical.teal} strokeWidth={2.5} />
              <Text style={styles.featureText}>Direct customer links (you keep 100%)</Text>
            </View>
          </View>
        </View>

        <View style={styles.trialCard}>
          <Text style={styles.trialBadge}>💡 Try It First</Text>
          <Text style={styles.trialAmount}>$20 one-time</Text>
          <Text style={styles.trialText}>Want to test it first? Try one fair for a one-time $20 pass before joining monthly.</Text>
        </View>

        <View style={styles.simpleBox}>
          <Text style={styles.simpleBoxText}>
            That&apos;s it — no per-item fees, no percentages, no extras to track.
          </Text>
          <Text style={styles.simpleBoxBold}>What you see is what you pay.</Text>
        </View>
      </View>

      <View style={styles.benefitsSection}>
        <View style={styles.benefitsHeader}>
          <Heart size={28} color={Colors.nautical.teal} strokeWidth={2.5} />
          <Text style={styles.benefitsTitle}>Why Vendors Love It</Text>
        </View>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Award size={20} color={Colors.nautical.teal} strokeWidth={2.5} />
            <Text style={styles.benefitText}>Keep 100% of your profits — no platform cuts</Text>
          </View>
          <View style={styles.benefitItem}>
            <Clock size={20} color={Colors.nautical.teal} strokeWidth={2.5} />
            <Text style={styles.benefitText}>Stay visible 24/7, not just during events</Text>
          </View>
          <View style={styles.benefitItem}>
            <Share2 size={20} color={Colors.nautical.teal} strokeWidth={2.5} />
            <Text style={styles.benefitText}>Get featured in curated fairs and social spotlights</Text>
          </View>
          <View style={styles.benefitItem}>
            <Users size={20} color={Colors.nautical.teal} strokeWidth={2.5} />
            <Text style={styles.benefitText}>Join a supportive community of small-shop owners</Text>
          </View>
        </View>
      </View>

      <View style={styles.closingSection}>
        <Text style={styles.closingEmoji}>🌟</Text>
        <Text style={styles.closingTitle}>Simple, Fair, and Built for Makers</Text>
        <Text style={styles.closingText}>
          We know what it&apos;s like to set up for in-person fairs — table fees, travel, and long weekends.
        </Text>
        <Text style={styles.closingHighlight}>
          Here, your booth stays open 24/7 for just $15 a month.
        </Text>
        <Text style={styles.closingTagline}>Start once. Get discovered everywhere.</Text>
      </View>

      <View style={styles.trustSection}>
        <View style={styles.testimonialCard}>
          <Text style={styles.testimonialQuote}>&quot;I love how simple Overboard Market is — I made my first sale the same weekend I joined!&quot;</Text>
          <Text style={styles.testimonialAuthor}>— Local Artisan</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => setShowWelcome(false)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.startButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.startButtonText}>Sign Up and Get Started</Text>
          <ChevronRight size={22} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.reassuranceSection}>
        <Text style={styles.disclaimer}>No setup fee. Cancel anytime.</Text>
        <Text style={styles.readyText}>Start today — you&apos;ll be live in minutes.</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'booth':
        return renderBoothStep();
      case 'payments':
        return renderPaymentsStep();
      case 'location':
        return renderLocationStep();
      case 'product':
        return renderProductStep();
      case 'goLive':
        return renderGoLiveStep();
      default:
        return null;
    }
  };

  if (showWelcome) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          style={styles.welcomeScrollView}
          contentContainerStyle={[styles.welcomeScrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderWelcomeScreen()}
        </ScrollView>
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
        <Text style={styles.mainTitle}>Vendor Onboarding</Text>
        <Text style={styles.mainSubtitle}>
          Let&apos;s set up your booth and get you ready to sell
        </Text>
        {renderProgressBar()}
      </LinearGradient>

      <View style={styles.stepsIndicatorRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsScrollContent}>
          {renderStepIndicator('booth', 'Booth', <Store size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('payments', 'Payments', <CreditCard size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('location', 'Location', <MapPin size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('product', 'Product', <Package size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('goLive', 'Go Live', <Eye size={20} color={Colors.light.muted} />)}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
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
  topSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.nautical.sandLight,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  mainSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanFoam,
    marginBottom: 20,
    lineHeight: 20,
  },
  progressContainer: {
    gap: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'right',
  },
  stepsIndicatorRow: {
    backgroundColor: Colors.light.softGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 12,
  },
  stepsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  stepIndicatorActive: {
    backgroundColor: Colors.nautical.sandLight,
    borderColor: Colors.nautical.teal,
    borderWidth: 2,
  },
  stepIndicatorComplete: {
    backgroundColor: Colors.white,
    borderColor: Colors.nautical.teal,
  },
  stepIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  stepIndicatorTextActive: {
    color: Colors.nautical.teal,
    fontWeight: '700' as const,
  },
  stepIndicatorTextComplete: {
    color: Colors.nautical.teal,
  },
  keyboardView: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stepContent: {
    gap: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginTop: 12,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  stepSubtext: {
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  helperNote: {
    fontSize: 14,
    color: Colors.light.charcoal,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  helperText: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
    marginTop: -4,
  },
  bioInputGroup: {
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.charcoal,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative' as const,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: Colors.light.border,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlayButton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  uploadOverlayText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  bannerPreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  continueButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.nautical.sandLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.charcoal,
    lineHeight: 20,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  disclaimerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.nautical.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerContent: {
    flex: 1,
    gap: 6,
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    lineHeight: 20,
  },
  disclaimerText: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: Colors.nautical.oceanFoam,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    marginTop: -8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.light.charcoal,
    lineHeight: 20,
    textAlign: 'center',
  },
  editAnytimeText: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  switchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.nautical.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  switchSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  switchActiveSubtext: {
    fontSize: 12,
    color: Colors.nautical.teal,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  emptyStateCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.terracotta,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createProductButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.light.charcoal,
  },
  legalSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 16,
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalHeaderText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  legalSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  agreementRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  agreementLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    lineHeight: 20,
  },
  agreementSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  linkButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  goLiveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  goLiveButtonDisabled: {
    opacity: 0.4,
  },
  goLiveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  goLiveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  dashboardButtonText: {
    color: Colors.nautical.teal,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  welcomeScrollView: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  welcomeScrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  welcomeContainer: {
    gap: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    gap: 12,
  },
  welcomeEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.light.charcoal,
    textAlign: 'center',
    lineHeight: 36,
  },
  welcomeSubtitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeDescription: {
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  pricingSection: {
    gap: 20,
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pricingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pricingSectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  pricingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    gap: 16,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  pricingAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.nautical.teal,
  },
  pricingBadge: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
    backgroundColor: Colors.nautical.oceanDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pricingCardLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  featureList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.charcoal,
    lineHeight: 21,
  },
  trialCard: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    alignItems: 'center',
    gap: 8,
  },
  trialBadge: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  trialAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  trialText: {
    fontSize: 14,
    color: Colors.light.charcoal,
    textAlign: 'center',
    lineHeight: 20,
  },
  simpleBox: {
    backgroundColor: Colors.nautical.oceanFoam,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    alignItems: 'center',
    gap: 6,
  },
  simpleBoxText: {
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  simpleBoxBold: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    textAlign: 'center',
  },
  benefitsSection: {
    gap: 20,
    backgroundColor: Colors.nautical.sandLight,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  benefitEmoji: {
    fontSize: 28,
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  benefitsList: {
    gap: 18,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  benefitText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.charcoal,
    lineHeight: 21,
  },
  closingSection: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  closingEmoji: {
    fontSize: 40,
  },
  closingTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    textAlign: 'center',
  },
  closingText: {
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  closingHighlight: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
    lineHeight: 22,
  },
  closingTagline: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
    marginTop: 8,
  },
  trustSection: {
    gap: 16,
  },
  testimonialCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 12,
  },
  testimonialQuote: {
    fontSize: 16,
    fontStyle: 'italic' as const,
    color: Colors.light.charcoal,
    textAlign: 'center',
    lineHeight: 24,
  },
  testimonialAuthor: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  reassuranceSection: {
    gap: 8,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
