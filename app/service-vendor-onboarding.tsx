import { router, Stack } from 'expo-router';
import {
  Briefcase,
  Upload,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  ChevronRight,
  Square,
  CheckSquare,
  FileText,
  ExternalLink,
  Tag,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
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

import Colors from '@/constants/colors';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';
import {
  ALL_SERVICE_CATEGORIES,
  VENDOR_TYPES,
  SERVICE_AREA_TYPES,
  PRICING_MODELS,
  VendorType,
  ServiceAreaType,
  PricingModel,
} from '@/constants/serviceCategories';

type StepType = 'profile' | 'type' | 'pricing' | 'booking' | 'portfolio' | 'policies';

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  active: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  quote: string;
}

interface OnboardingData {
  profile: {
    displayName: string;
    logoUrl: string;
    shortBio: string;
    contactEmail: string;
  };
  type: {
    vendorType: VendorType;
    serviceCategories: string[];
    serviceAreaType: ServiceAreaType;
    localZipCodes: string[];
  };
  pricing: {
    pricingModel: PricingModel;
    startingPrice: string;
    packages: ServicePackage[];
  };
  booking: {
    bookingLink: string;
    availabilityNotes: string;
  };
  portfolio: {
    portfolioImages: string[];
    testimonials: Testimonial[];
  };
  policies: {
    tosAccepted: boolean;
    verificationRequested: boolean;
  };
}

interface StepCompletion {
  profile: boolean;
  type: boolean;
  pricing: boolean;
  booking: boolean;
  portfolio: boolean;
  policies: boolean;
}

export default function ServiceVendorOnboardingPage() {
  const insets = useSafeAreaInsets();
  const { user } = useVendorAuth();
  const [currentStep, setCurrentStep] = useState<StepType>('profile');
  const [zipInputValue, setZipInputValue] = useState('');
  
  const [data, setData] = useState<OnboardingData>({
    profile: {
      displayName: '',
      logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      shortBio: '',
      contactEmail: user?.email || '',
    },
    type: {
      vendorType: 'service',
      serviceCategories: [],
      serviceAreaType: 'virtual',
      localZipCodes: [],
    },
    pricing: {
      pricingModel: 'flat_rate',
      startingPrice: '',
      packages: [],
    },
    booking: {
      bookingLink: '',
      availabilityNotes: '',
    },
    portfolio: {
      portfolioImages: [],
      testimonials: [],
    },
    policies: {
      tosAccepted: false,
      verificationRequested: false,
    },
  });

  const [completion, setCompletion] = useState<StepCompletion>({
    profile: false,
    type: false,
    pricing: false,
    booking: false,
    portfolio: false,
    policies: false,
  });

  const updateData = <T extends StepType>(
    step: T,
    field: keyof OnboardingData[T],
    value: any
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
      case 'profile':
        return !!(
          data.profile.displayName.trim() &&
          data.profile.shortBio.trim() &&
          data.profile.shortBio.length <= 240 &&
          data.profile.contactEmail.trim() &&
          data.profile.logoUrl
        );
      case 'type':
        const needsCategories = data.type.vendorType === 'service' || data.type.vendorType === 'both';
        const hasCategories = !needsCategories || data.type.serviceCategories.length > 0;
        const needsZipCodes = data.type.serviceAreaType === 'local' || data.type.serviceAreaType === 'both';
        const hasZipCodes = !needsZipCodes || data.type.localZipCodes.length > 0;
        return hasCategories && hasZipCodes;
      case 'pricing':
        return data.pricing.packages.length > 0;
      case 'booking':
        return true;
      case 'portfolio':
        return true;
      case 'policies':
        return data.policies.tosAccepted;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (!isStepComplete(currentStep)) {
      Alert.alert('Incomplete', 'Please fill in all required fields to continue.');
      return;
    }

    const newCompletion = { ...completion, [currentStep]: true };
    setCompletion(newCompletion);

    const steps: StepType[] = ['profile', 'type', 'pricing', 'booking', 'portfolio', 'policies'];
    const currentIndex = steps.indexOf(currentStep);
    const nextStep = steps[currentIndex + 1];

    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      Alert.alert(
        'Onboarding Complete!',
        'Your service vendor profile is ready. Welcome to Overboard Market!',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/vendor-dashboard'),
          },
        ]
      );
    }
  };

  const pickImage = async (type: 'logo' | 'portfolio') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: type === 'logo',
        aspect: type === 'logo' ? [1, 1] : undefined,
        quality: 0.8,
        allowsMultipleSelection: type === 'portfolio',
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'logo') {
          updateData('profile', 'logoUrl', result.assets[0].uri);
        } else {
          const newImages = result.assets.map(asset => asset.uri);
          updateData('portfolio', 'portfolioImages', [
            ...data.portfolio.portfolioImages,
            ...newImages,
          ]);
        }
      }
    } catch (error) {
      console.error(`Error picking ${type} image:`, error);
      Alert.alert('Error', `Failed to pick ${type} image. Please try again.`);
    }
  };

  const addZipCode = () => {
    const zip = zipInputValue.trim();
    if (zip.length === 5 && /^\d{5}$/.test(zip)) {
      if (data.type.localZipCodes.length >= 10) {
        Alert.alert('Maximum Reached', 'You can add up to 10 ZIP codes.');
        return;
      }
      if (!data.type.localZipCodes.includes(zip)) {
        updateData('type', 'localZipCodes', [...data.type.localZipCodes, zip]);
      }
      setZipInputValue('');
    } else {
      Alert.alert('Invalid ZIP', 'Please enter a valid 5-digit ZIP code.');
    }
  };

  const removeZipCode = (zip: string) => {
    updateData(
      'type',
      'localZipCodes',
      data.type.localZipCodes.filter((z) => z !== zip)
    );
  };

  const toggleCategory = (category: string) => {
    const categories = data.type.serviceCategories;
    if (categories.includes(category)) {
      updateData(
        'type',
        'serviceCategories',
        categories.filter((c) => c !== category)
      );
    } else {
      updateData('type', 'serviceCategories', [...categories, category]);
    }
  };

  const addPackage = () => {
    const newPackage: ServicePackage = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: '',
      duration: '',
      active: true,
    };
    updateData('pricing', 'packages', [...data.pricing.packages, newPackage]);
  };

  const updatePackage = (id: string, field: keyof ServicePackage, value: any) => {
    updateData(
      'pricing',
      'packages',
      data.pricing.packages.map((pkg) =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    );
  };

  const removePackage = (id: string) => {
    updateData(
      'pricing',
      'packages',
      data.pricing.packages.filter((pkg) => pkg.id !== id)
    );
  };

  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      name: '',
      quote: '',
    };
    updateData('portfolio', 'testimonials', [...data.portfolio.testimonials, newTestimonial]);
  };

  const updateTestimonial = (id: string, field: keyof Testimonial, value: string) => {
    updateData(
      'portfolio',
      'testimonials',
      data.portfolio.testimonials.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const removeTestimonial = (id: string) => {
    updateData(
      'portfolio',
      'testimonials',
      data.portfolio.testimonials.filter((t) => t.id !== id)
    );
  };

  const removePortfolioImage = (uri: string) => {
    updateData(
      'portfolio',
      'portfolioImages',
      data.portfolio.portfolioImages.filter((img) => img !== uri)
    );
  };

  const completionPercentage = (): number => {
    const total = 6;
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
      </TouchableOpacity>
    );
  };

  const renderProfileStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Briefcase size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Profile Basics</Text>
        <Text style={styles.stepDescription}>
          Step 1: Create your service provider profile.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business/Brand Name *</Text>
        <Text style={styles.helperText}>Shown to shoppers across Overboard Market.</Text>
        <TextInput
          style={styles.input}
          value={data.profile.displayName}
          onChangeText={(text) => updateData('profile', 'displayName', text)}
          placeholder="Overboard Recruiting Co"
          placeholderTextColor={Colors.light.mediumGray}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Logo Upload</Text>
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: data.profile.logoUrl }}
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
        <Text style={styles.inputLabel}>Short Bio * (max 240 characters)</Text>
        <Text style={styles.helperText}>Who you are + what you do (1–2 sentences).</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={data.profile.shortBio}
          onChangeText={(text) => text.length <= 240 && updateData('profile', 'shortBio', text)}
          placeholder="Helping small businesses hire great local talent."
          placeholderTextColor={Colors.light.mediumGray}
          multiline
          numberOfLines={3}
          maxLength={240}
        />
        <Text style={styles.charCount}>{data.profile.shortBio.length}/240</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Contact Email *</Text>
        <TextInput
          style={styles.input}
          value={data.profile.contactEmail}
          onChangeText={(text) => updateData('profile', 'contactEmail', text)}
          placeholder="contact@example.com"
          placeholderTextColor={Colors.light.mediumGray}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !isStepComplete('profile') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('profile')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderTypeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Tag size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Vendor Type & Category</Text>
        <Text style={styles.stepDescription}>Step 2: Define your service offerings.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Vendor Type *</Text>
        <View style={styles.segmentedControl}>
          {VENDOR_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.segmentButton,
                data.type.vendorType === type.value && styles.segmentButtonActive,
              ]}
              onPress={() => updateData('type', 'vendorType', type.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  data.type.vendorType === type.value && styles.segmentButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {(data.type.vendorType === 'service' || data.type.vendorType === 'both') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Categories *</Text>
          <Text style={styles.helperText}>Select all that apply.</Text>
          <View style={styles.chipContainer}>
            {ALL_SERVICE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  data.type.serviceCategories.includes(category) && styles.chipActive,
                ]}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    data.type.serviceCategories.includes(category) && styles.chipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {(data.type.vendorType === 'service' || data.type.vendorType === 'both') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Area Type *</Text>
          <View style={styles.segmentedControl}>
            {SERVICE_AREA_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.segmentButton,
                  data.type.serviceAreaType === type.value && styles.segmentButtonActive,
                ]}
                onPress={() => updateData('type', 'serviceAreaType', type.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    data.type.serviceAreaType === type.value && styles.segmentButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {(data.type.serviceAreaType === 'local' || data.type.serviceAreaType === 'both') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Local ZIP Codes * (up to 10)</Text>
          <Text style={styles.helperText}>Add up to 10 ZIP codes (press Add after each).</Text>
          <View style={styles.zipInputRow}>
            <TextInput
              style={[styles.input, styles.zipInput]}
              value={zipInputValue}
              onChangeText={setZipInputValue}
              placeholder="12345"
              placeholderTextColor={Colors.light.mediumGray}
              keyboardType="number-pad"
              maxLength={5}
            />
            <TouchableOpacity style={styles.addButton} onPress={addZipCode} activeOpacity={0.8}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {data.type.localZipCodes.map((zip) => (
              <View key={zip} style={styles.zipChip}>
                <Text style={styles.zipChipText}>{zip}</Text>
                <TouchableOpacity onPress={() => removeZipCode(zip)} activeOpacity={0.7}>
                  <X size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueButton, !isStepComplete('type') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('type')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPricingStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <DollarSign size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Pricing & Packages</Text>
        <Text style={styles.stepDescription}>Step 3: Set your pricing structure.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Pricing Model *</Text>
        <View style={styles.pickerContainer}>
          {PRICING_MODELS.map((model) => (
            <TouchableOpacity
              key={model.value}
              style={[
                styles.pickerOption,
                data.pricing.pricingModel === model.value && styles.pickerOptionActive,
              ]}
              onPress={() => updateData('pricing', 'pricingModel', model.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  data.pricing.pricingModel === model.value && styles.pickerOptionTextActive,
                ]}
              >
                {model.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Starting Price (optional)</Text>
        <TextInput
          style={styles.input}
          value={data.pricing.startingPrice}
          onChangeText={(text) => updateData('pricing', 'startingPrice', text)}
          placeholder="$0.00"
          placeholderTextColor={Colors.light.mediumGray}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Packages *</Text>
        <Text style={styles.helperText}>Add at least one service package.</Text>
        {data.pricing.packages.map((pkg, index) => (
          <View key={pkg.id} style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageTitle}>Package {index + 1}</Text>
              <TouchableOpacity onPress={() => removePackage(pkg.id)} activeOpacity={0.7}>
                <X size={20} color={Colors.light.muted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={pkg.name}
              onChangeText={(text) => updatePackage(pkg.id, 'name', text)}
              placeholder="Starter Recruiting Sprint"
              placeholderTextColor={Colors.light.mediumGray}
            />
            <TextInput
              style={[styles.input, styles.textArea, { marginTop: 8 }]}
              value={pkg.description}
              onChangeText={(text) => updatePackage(pkg.id, 'description', text)}
              placeholder="Sourcing + 3 screened candidates in 2 weeks."
              placeholderTextColor={Colors.light.mediumGray}
              multiline
              numberOfLines={2}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={pkg.price}
              onChangeText={(text) => updatePackage(pkg.id, 'price', text)}
              placeholder="$0.00"
              placeholderTextColor={Colors.light.mediumGray}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={pkg.duration}
              onChangeText={(text) => updatePackage(pkg.id, 'duration', text)}
              placeholder="2 weeks"
              placeholderTextColor={Colors.light.mediumGray}
            />
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => updatePackage(pkg.id, 'active', !pkg.active)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLabel}>Active</Text>
              {pkg.active ? (
                <CheckSquare size={24} color={Colors.nautical.teal} strokeWidth={2.5} />
              ) : (
                <Square size={24} color={Colors.light.mediumGray} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addPackageButton} onPress={addPackage} activeOpacity={0.8}>
          <Text style={styles.addPackageButtonText}>+ Add Package</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !isStepComplete('pricing') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('pricing')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderBookingStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Calendar size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Booking & Availability</Text>
        <Text style={styles.stepDescription}>Step 4: Help customers schedule with you.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Booking Link (optional)</Text>
        <Text style={styles.helperText}>
          Calendly, Acuity, website page, or contact form.
        </Text>
        <TextInput
          style={styles.input}
          value={data.booking.bookingLink}
          onChangeText={(text) => updateData('booking', 'bookingLink', text)}
          placeholder="https://calendly.com/yourname/intro-call"
          placeholderTextColor={Colors.light.mediumGray}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Availability Notes (optional)</Text>
        <Text style={styles.helperText}>
          Typical days & hours, lead times, blackout dates.
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={data.booking.availabilityNotes}
          onChangeText={(text) => updateData('booking', 'availabilityNotes', text)}
          placeholder="M–F 9–4 CT; 1–2 week lead time."
          placeholderTextColor={Colors.light.mediumGray}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !isStepComplete('booking') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('booking')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPortfolioStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <ImageIcon size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Portfolio & Social Proof</Text>
        <Text style={styles.stepDescription}>Step 5: Showcase your work.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Portfolio Images (optional)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage('portfolio')}
          activeOpacity={0.8}
        >
          <Upload size={18} color={Colors.white} />
          <Text style={styles.uploadButtonText}>Upload Images</Text>
        </TouchableOpacity>
        <View style={styles.portfolioGrid}>
          {data.portfolio.portfolioImages.map((uri) => (
            <View key={uri} style={styles.portfolioImageContainer}>
              <Image source={{ uri }} style={styles.portfolioImage} contentFit="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removePortfolioImage(uri)}
                activeOpacity={0.8}
              >
                <X size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Testimonials (optional)</Text>
        {data.portfolio.testimonials.map((testimonial, index) => (
          <View key={testimonial.id} style={styles.testimonialCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageTitle}>Testimonial {index + 1}</Text>
              <TouchableOpacity onPress={() => removeTestimonial(testimonial.id)} activeOpacity={0.7}>
                <X size={20} color={Colors.light.muted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={testimonial.name}
              onChangeText={(text) => updateTestimonial(testimonial.id, 'name', text)}
              placeholder="Client Name"
              placeholderTextColor={Colors.light.mediumGray}
            />
            <TextInput
              style={[styles.input, styles.textArea, { marginTop: 8 }]}
              value={testimonial.quote}
              onChangeText={(text) =>
                text.length <= 280 && updateTestimonial(testimonial.id, 'quote', text)
              }
              placeholder="Great service, highly recommend!"
              placeholderTextColor={Colors.light.mediumGray}
              multiline
              numberOfLines={2}
              maxLength={280}
            />
            <Text style={styles.charCount}>{testimonial.quote.length}/280</Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addPackageButton}
          onPress={addTestimonial}
          activeOpacity={0.8}
        >
          <Text style={styles.addPackageButtonText}>+ Add Testimonial</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !isStepComplete('portfolio') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('portfolio')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPoliciesStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FileText size={32} color={Colors.nautical.teal} strokeWidth={2} />
        <Text style={styles.stepTitle}>Policies & Submit</Text>
        <Text style={styles.stepDescription}>Step 6: Review and accept our terms.</Text>
      </View>

      <View style={styles.legalSection}>
        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => updateData('policies', 'tosAccepted', !data.policies.tosAccepted)}
          activeOpacity={0.7}
        >
          {data.policies.tosAccepted ? (
            <CheckSquare size={24} color={Colors.nautical.teal} strokeWidth={2.5} />
          ) : (
            <Square size={24} color={Colors.light.mediumGray} strokeWidth={2} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.agreementLabel}>
              I have read and agree to the Service Vendor Agreement *
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
            updateData('policies', 'verificationRequested', !data.policies.verificationRequested)
          }
          activeOpacity={0.7}
        >
          {data.policies.verificationRequested ? (
            <CheckSquare size={24} color={Colors.nautical.teal} strokeWidth={2.5} />
          ) : (
            <Square size={24} color={Colors.light.mediumGray} strokeWidth={2} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.agreementLabel}>Request verification (optional)</Text>
            <Text style={styles.agreementSubtext}>
              Verification takes 1–3 business days. Your profile can appear immediately as Unverified.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          Overboard Market connects buyers with independent service providers. Services are delivered
          by the vendor. Please review vendor policies before booking.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !isStepComplete('policies') && styles.continueButtonDisabled]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!isStepComplete('policies')}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.continueButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>Submit for Review</Text>
          <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={[styles.helperText, { textAlign: 'center', marginTop: 12 }]}>
        Thanks! Your profile can appear immediately as Unverified. Verification takes 1–3 business days.
      </Text>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return renderProfileStep();
      case 'type':
        return renderTypeStep();
      case 'pricing':
        return renderPricingStep();
      case 'booking':
        return renderBookingStep();
      case 'portfolio':
        return renderPortfolioStep();
      case 'policies':
        return renderPoliciesStep();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, Colors.nautical.teal]}
        style={[styles.topSection, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.mainTitle}>Service Vendor Onboarding</Text>
        <Text style={styles.mainSubtitle}>
          Let&apos;s set up your service provider profile
        </Text>
        {renderProgressBar()}
      </LinearGradient>

      <View style={styles.stepsIndicatorRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepsScrollContent}
        >
          {renderStepIndicator('profile', 'Profile', <Briefcase size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('type', 'Type', <Tag size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('pricing', 'Pricing', <DollarSign size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('booking', 'Booking', <Calendar size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('portfolio', 'Portfolio', <ImageIcon size={20} color={Colors.light.muted} />)}
          {renderStepIndicator('policies', 'Policies', <FileText size={20} color={Colors.light.muted} />)}
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'right',
    marginTop: -4,
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
  continueButton: {
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  segmentButtonTextActive: {
    color: Colors.nautical.teal,
    fontWeight: '700' as const,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  zipInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  zipInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  zipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.nautical.teal,
  },
  zipChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
  },
  pickerOptionActive: {
    backgroundColor: Colors.nautical.sandLight,
    borderColor: Colors.nautical.teal,
    borderWidth: 2,
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
  },
  pickerOptionTextActive: {
    color: Colors.nautical.teal,
    fontWeight: '700' as const,
  },
  packageCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 12,
    gap: 8,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  addPackageButton: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: Colors.nautical.teal,
    borderStyle: 'dashed',
  },
  addPackageButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  portfolioImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  testimonialCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 12,
    gap: 8,
  },
  legalSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 16,
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
  disclaimerCard: {
    backgroundColor: Colors.nautical.oceanFoam,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.light.charcoal,
    lineHeight: 18,
    textAlign: 'center',
  },
});
