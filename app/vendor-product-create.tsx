import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Package,
  Upload,
  DollarSign,
  X,
  Plus,
  Link as LinkIcon,
  Check,
  FileText,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  Video as VideoIcon,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Video: any = null;
let ResizeMode: any = null;
if (Platform.OS !== 'web') {
  const expoAv = require('expo-av');
  Video = expoAv.Video;
  ResizeMode = expoAv.ResizeMode;
}

import Colors from '@/constants/colors';
import { useVendorAuth, VendorProfile } from '@/app/contexts/VendorAuthContext';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface SelectChoice {
  label: string;
  value: string;
  price_delta: number;
}

interface CustomizationOption {
  id: string;
  code: string;
  label: string;
  type: 'checkbox' | 'text' | 'textarea' | 'select' | 'file';
  required: boolean;
  price_delta: number;
  helper_text?: string;
  proof_required?: boolean;
  choices?: SelectChoice[];
}

const PRODUCTS_STORAGE_KEY = '@overboard_vendor_products';

export default function VendorProductCreatePage() {
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile, user } = useVendorAuth();
  const params = useLocalSearchParams<{ fromOnboarding?: string }>();
  const isFromOnboarding = params.fromOnboarding === 'true';
  
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    category: '',
    tags: [] as string[],
    images: [] as string[],
    video: null as string | null,
    etsyListingUrl: '',
    shippingWeight: '',
    shippingLength: '',
    shippingWidth: '',
    shippingHeight: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOption[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadVendorProfile = async () => {
      console.log('[ProductCreate] Checking vendor profile...');
      console.log('[ProductCreate] User ID:', user?.id);
      console.log('[ProductCreate] Profile ID:', profile?.id);
      
      if (user?.id && !profile?.id) {
        console.log('[ProductCreate] Profile not loaded, refreshing...');
        try {
          await refreshProfile();
          console.log('[ProductCreate] Profile refreshed successfully');
        } catch (error) {
          console.error('[ProductCreate] Error refreshing profile:', error);
        }
      } else if (profile?.id) {
        console.log('[ProductCreate] Profile already loaded:', profile.business_name);
      } else {
        console.log('[ProductCreate] No user ID available');
      }
      
      setIsLoadingProfile(false);
    };
    
    loadVendorProfile();
  }, [user?.id, profile?.id, refreshProfile]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!productData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!productData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!productData.price || parseFloat(productData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!productData.stock || parseInt(productData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    if (productData.images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }

    if (productData.images.length > 5) {
      newErrors.images = 'Maximum 5 images allowed';
    }

    if (productData.etsyListingUrl.trim()) {
      const etsyPattern = /^https:\/\/(www\.)?etsy\.com\/listing\/[0-9]+/;
      if (!etsyPattern.test(productData.etsyListingUrl.trim())) {
        newErrors.etsyListingUrl = 'Invalid Etsy listing URL format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    console.log('[ProductCreate] Save product pressed');
    console.log('[ProductCreate] Current profile:', profile);
    console.log('[ProductCreate] Current user:', user?.id);
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    let currentProfile = profile;
    
    if (!currentProfile?.id) {
      console.error('[ProductCreate] No profile ID available');
      console.log('[ProductCreate] User ID:', user?.id);
      console.log('[ProductCreate] Attempting to use user ID as fallback...');
      
      if (!user?.id) {
        Alert.alert(
          'Error',
          'Unable to create product. Please sign out and sign back in.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }
      
      try {
        await refreshProfile();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        currentProfile = profile;
        
        if (!currentProfile?.id) {
          console.log('[ProductCreate] Using user data as fallback');
          currentProfile = {
            id: user.id,
            auth_user_id: user.id,
            email: user.email || '',
            business_name: user.user_metadata?.business_name || 'My Business',
          } as VendorProfile;
        }
      } catch (error) {
        console.error('[ProductCreate] Error refreshing profile:', error);
        Alert.alert(
          'Error',
          'Unable to load vendor profile. Please try again later.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }
    }

    try {
      if (!currentProfile?.id || !currentProfile?.business_name) {
        Alert.alert(
          'Error',
          'Unable to retrieve vendor information. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      const newProduct = {
        id: `product-${Date.now()}`,
        vendorId: currentProfile.id,
        vendorName: currentProfile.business_name,
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        sku: productData.sku,
        category: productData.category || 'Uncategorized',
        tags: productData.tags,
        image: productData.images[0] || '',
        images: productData.images,
        video: productData.video,
        etsyListingUrl: productData.etsyListingUrl,
        shippingWeight: productData.shippingWeight ? parseFloat(productData.shippingWeight) : undefined,
        shippingLength: productData.shippingLength ? parseFloat(productData.shippingLength) : undefined,
        shippingWidth: productData.shippingWidth ? parseFloat(productData.shippingWidth) : undefined,
        shippingHeight: productData.shippingHeight ? parseFloat(productData.shippingHeight) : undefined,
        variants,
        customizationOptions,
        inStock: parseInt(productData.stock) > 0,
        featured: false,
        createdAt: new Date().toISOString(),
      };

      console.log('[ProductCreate] Saving product:', newProduct);

      const storedProducts = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
      const products = storedProducts ? JSON.parse(storedProducts) : [];
      
      products.push(newProduct);
      
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      
      console.log('[ProductCreate] Product saved successfully');

      if (isFromOnboarding) {
        Alert.alert(
          'Product Created!',
          `${productData.name} has been added to your booth. Continue with onboarding to go live.`,
          [
            {
              text: 'Continue Onboarding',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Product Created!',
          `${productData.name} has been added to your booth.`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                setProductData({
                  name: '',
                  description: '',
                  price: '',
                  stock: '',
                  sku: '',
                  category: '',
                  tags: [],
                  images: [],
                  video: null,
                  etsyListingUrl: '',
                  shippingWeight: '',
                  shippingLength: '',
                  shippingWidth: '',
                  shippingHeight: '',
                });
                setVariants([]);
                setCustomizationOptions([]);
                setErrors({});
              },
            },
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[ProductCreate] Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !productData.tags.includes(tagInput.trim())) {
      setProductData({
        ...productData,
        tags: [...productData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setProductData({
      ...productData,
      tags: productData.tags.filter((t) => t !== tag),
    });
  };

  const pickImages = async () => {
    console.log('[ProductCreate] Picking images');

    if (productData.images.length >= 5) {
      Alert.alert('Maximum Limit', 'You can upload a maximum of 5 images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - productData.images.length,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      const updatedImages = [...productData.images, ...newImages].slice(0, 5);
      
      console.log('[ProductCreate] Selected images:', updatedImages.length);
      
      setProductData({
        ...productData,
        images: updatedImages,
      });
      
      if (errors.images && updatedImages.length > 0) {
        const newErrors = { ...errors };
        delete newErrors.images;
        setErrors(newErrors);
      }
    }
  };

  const removeImage = (index: number) => {
    console.log('[ProductCreate] Removing image at index:', index);
    const newImages = productData.images.filter((_, i) => i !== index);
    setProductData({
      ...productData,
      images: newImages,
    });
    
    if (newImages.length === 0) {
      setErrors({ ...errors, images: 'At least one product image is required' });
    }
  };

  const pickVideo = async () => {
    console.log('[ProductCreate] Picking video');

    if (productData.video) {
      Alert.alert(
        'Replace Video',
        'You already have a video. Do you want to replace it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: false,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                console.log('[ProductCreate] Selected video:', result.assets[0].uri);
                setProductData({
                  ...productData,
                  video: result.assets[0].uri,
                });
              }
            },
          },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      console.log('[ProductCreate] Selected video:', result.assets[0].uri);
      setProductData({
        ...productData,
        video: result.assets[0].uri,
      });
    }
  };

  const removeVideo = () => {
    console.log('[ProductCreate] Removing video');
    setProductData({
      ...productData,
      video: null,
    });
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `variant-${Date.now()}`,
      name: '',
      price: parseFloat(productData.price) || 0,
      stock: 0,
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setVariants(
      variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      )
    );
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const addCustomizationOption = () => {
    const newOption: CustomizationOption = {
      id: `custom-${Date.now()}`,
      code: '',
      label: '',
      type: 'text',
      required: false,
      price_delta: 0,
    };
    setCustomizationOptions([...customizationOptions, newOption]);
  };

  const updateCustomizationOption = (id: string, updates: Partial<CustomizationOption>) => {
    setCustomizationOptions(
      customizationOptions.map((opt) =>
        opt.id === id ? { ...opt, ...updates } : opt
      )
    );
  };

  const removeCustomizationOption = (id: string) => {
    setCustomizationOptions(customizationOptions.filter((opt) => opt.id !== id));
  };

  const addChoice = (optionId: string) => {
    const option = customizationOptions.find(opt => opt.id === optionId);
    if (!option) return;

    const newChoice: SelectChoice = {
      label: '',
      value: `choice_${Date.now()}`,
      price_delta: 0,
    };

    updateCustomizationOption(optionId, {
      choices: [...(option.choices || []), newChoice],
    });
  };

  const updateChoice = (optionId: string, choiceIndex: number, updates: Partial<SelectChoice>) => {
    const option = customizationOptions.find(opt => opt.id === optionId);
    if (!option || !option.choices) return;

    const updatedChoices = option.choices.map((choice, idx) =>
      idx === choiceIndex ? { ...choice, ...updates } : choice
    );

    updateCustomizationOption(optionId, { choices: updatedChoices });
  };

  const removeChoice = (optionId: string, choiceIndex: number) => {
    const option = customizationOptions.find(opt => opt.id === optionId);
    if (!option || !option.choices) return;

    const updatedChoices = option.choices.filter((_, idx) => idx !== choiceIndex);
    updateCustomizationOption(optionId, { choices: updatedChoices });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Product',
          headerStyle: {
            backgroundColor: Colors.nautical.teal,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={productData.name}
                onChangeText={(text) => {
                  setProductData({ ...productData, name: text });
                  if (errors.name) {
                    const newErrors = { ...errors };
                    delete newErrors.name;
                    setErrors(newErrors);
                  }
                }}
                placeholder="e.g., Handcrafted Ceramic Mug"
                placeholderTextColor={Colors.light.muted}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description && styles.inputError,
                ]}
                value={productData.description}
                onChangeText={(text) => {
                  setProductData({ ...productData, description: text });
                  if (errors.description) {
                    const newErrors = { ...errors };
                    delete newErrors.description;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Describe your product, its features, and what makes it special..."
                placeholderTextColor={Colors.light.muted}
                multiline
                numberOfLines={5}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Price ($) *</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={productData.price}
                  onChangeText={(text) => {
                    setProductData({ ...productData, price: text });
                    if (errors.price) {
                      const newErrors = { ...errors };
                      delete newErrors.price;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Stock *</Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  value={productData.stock}
                  onChangeText={(text) => {
                    setProductData({ ...productData, stock: text });
                    if (errors.stock) {
                      const newErrors = { ...errors };
                      delete newErrors.stock;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="0"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="number-pad"
                />
                {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SKU (Optional)</Text>
              <TextInput
                style={styles.input}
                value={productData.sku}
                onChangeText={(text) => setProductData({ ...productData, sku: text })}
                placeholder="e.g., MUG-001"
                placeholderTextColor={Colors.light.muted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category (Optional)</Text>
              <TextInput
                style={styles.input}
                value={productData.category}
                onChangeText={(text) => setProductData({ ...productData, category: text })}
                placeholder="e.g., Home Decor, Pottery, Jewelry"
                placeholderTextColor={Colors.light.muted}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ImageIcon size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Product Images *</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Upload up to 5 images. The first image will be used as the main product photo.
            </Text>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                productData.images.length >= 5 && styles.uploadButtonDisabled,
              ]}
              onPress={pickImages}
              disabled={productData.images.length >= 5}
            >
              <Upload size={22} color={productData.images.length >= 5 ? Colors.light.muted : Colors.nautical.teal} />
              <Text
                style={[
                  styles.uploadButtonText,
                  productData.images.length >= 5 && styles.uploadButtonTextDisabled,
                ]}
              >
                {productData.images.length >= 5
                  ? 'Maximum 5 Images Reached'
                  : `Upload Images (${productData.images.length}/5)`}
              </Text>
            </TouchableOpacity>
            {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}

            {productData.images.length > 0 && (
              <View style={styles.imageGallery}>
                {productData.images.map((imageUri, index) => (
                  <View key={index} style={styles.imagePreviewCard}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color={Colors.white} />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.mainImageBadge}>
                        <Text style={styles.mainImageBadgeText}>Main</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.infoCard}>
              <AlertCircle size={18} color={Colors.nautical.teal} />
              <Text style={styles.infoCardText}>
                For best results, use square images (1:1 ratio) with at least 800x800px resolution.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <VideoIcon size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Product Video (Optional)</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Upload 1 video to showcase your product in action.
            </Text>

            {!productData.video ? (
              <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
                <Upload size={22} color={Colors.nautical.teal} />
                <Text style={styles.uploadButtonText}>Upload Video</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.videoPreviewCard}>
                {Platform.OS !== 'web' && Video ? (
                  <Video
                    source={{ uri: productData.video }}
                    style={styles.videoPreview}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                  />
                ) : (
                  <View style={styles.videoPreview}>
                    <VideoIcon size={48} color={Colors.nautical.teal} />
                    <Text style={styles.webVideoText}>Video preview available on mobile</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeVideoButton}
                  onPress={removeVideo}
                >
                  <X size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoCard}>
              <AlertCircle size={18} color={Colors.nautical.teal} />
              <Text style={styles.infoCardText}>
                Videos help customers see your product from all angles. Keep it under 30 seconds for best results.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinkIcon size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Etsy Integration</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Link this product to an existing Etsy listing (optional).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Etsy Listing URL</Text>
              <TextInput
                style={[styles.input, errors.etsyListingUrl && styles.inputError]}
                value={productData.etsyListingUrl}
                onChangeText={(text) => {
                  setProductData({ ...productData, etsyListingUrl: text });
                  if (errors.etsyListingUrl) {
                    const newErrors = { ...errors };
                    delete newErrors.etsyListingUrl;
                    setErrors(newErrors);
                  }
                }}
                placeholder="https://www.etsy.com/listing/123456789"
                placeholderTextColor={Colors.light.muted}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.etsyListingUrl && (
                <Text style={styles.errorText}>{errors.etsyListingUrl}</Text>
              )}
            </View>

            <View style={styles.infoCard}>
              <LinkIcon size={18} color={Colors.nautical.teal} />
              <Text style={styles.infoCardText}>
                When linked, customers can view and purchase this product directly from your Etsy shop.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Tags & Keywords</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Add tags to help customers find your product.
            </Text>

            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.input, styles.tagInput]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag"
                placeholderTextColor={Colors.light.muted}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={addTag}
                disabled={!tagInput.trim()}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {productData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {productData.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <X size={14} color={Colors.nautical.teal} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Shipping Information</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Provide shipping details to help with fulfillment (optional).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (oz)</Text>
              <TextInput
                style={styles.input}
                value={productData.shippingWeight}
                onChangeText={(text) =>
                  setProductData({ ...productData, shippingWeight: text })
                }
                placeholder="0"
                placeholderTextColor={Colors.light.muted}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Length (in)</Text>
                <TextInput
                  style={styles.input}
                  value={productData.shippingLength}
                  onChangeText={(text) =>
                    setProductData({ ...productData, shippingLength: text })
                  }
                  placeholder="0"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Width (in)</Text>
                <TextInput
                  style={styles.input}
                  value={productData.shippingWidth}
                  onChangeText={(text) =>
                    setProductData({ ...productData, shippingWidth: text })
                  }
                  placeholder="0"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Height (in)</Text>
                <TextInput
                  style={styles.input}
                  value={productData.shippingHeight}
                  onChangeText={(text) =>
                    setProductData({ ...productData, shippingHeight: text })
                  }
                  placeholder="0"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Variants (Optional)</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Create variants for different sizes, colors, or configurations.
            </Text>

            {variants.length > 0 && (
              <View style={styles.variantsContainer}>
                {variants.map((variant) => (
                  <View key={variant.id} style={styles.variantCard}>
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantTitle}>Variant</Text>
                      <TouchableOpacity onPress={() => removeVariant(variant.id)}>
                        <X size={20} color={Colors.light.terracotta} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Name</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.name}
                        onChangeText={(text) => updateVariant(variant.id, 'name', text)}
                        placeholder="e.g., Large, Blue, Custom Size"
                        placeholderTextColor={Colors.light.muted}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Price ($)</Text>
                        <TextInput
                          style={styles.input}
                          value={variant.price.toString()}
                          onChangeText={(text) =>
                            updateVariant(variant.id, 'price', parseFloat(text) || 0)
                          }
                          placeholder="0.00"
                          placeholderTextColor={Colors.light.muted}
                          keyboardType="decimal-pad"
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.inputLabel}>Stock</Text>
                        <TextInput
                          style={styles.input}
                          value={variant.stock.toString()}
                          onChangeText={(text) =>
                            updateVariant(variant.id, 'stock', parseInt(text) || 0)
                          }
                          placeholder="0"
                          placeholderTextColor={Colors.light.muted}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.addVariantButton} onPress={addVariant}>
              <Plus size={20} color={Colors.nautical.teal} />
              <Text style={styles.addVariantButtonText}>Add Variant</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={24} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Product Customization</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Add options that customers can customize before purchasing (e.g., color, size, engraving).
            </Text>

            {customizationOptions.length > 0 && (
              <View style={styles.customizationContainer}>
                {customizationOptions.map((option) => (
                  <View key={option.id} style={styles.customizationCard}>
                    <View style={styles.customizationHeader}>
                      <Text style={styles.customizationCardTitle}>Customization Option</Text>
                      <TouchableOpacity onPress={() => removeCustomizationOption(option.id)}>
                        <X size={20} color={Colors.light.terracotta} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Label</Text>
                        <TextInput
                          style={styles.input}
                          value={option.label}
                          onChangeText={(text) => updateCustomizationOption(option.id, { label: text, code: text.toLowerCase().replace(/\s+/g, '_') })}
                          placeholder="e.g., Glaze Color"
                          placeholderTextColor={Colors.light.muted}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.inputLabel}>Type</Text>
                        <View style={styles.typeSelector}>
                          {(['text', 'textarea', 'select', 'checkbox', 'file'] as const).map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.typeOption,
                                option.type === type && styles.typeOptionActive,
                              ]}
                              onPress={() => updateCustomizationOption(option.id, { type })}
                            >
                              <Text
                                style={[
                                  styles.typeOptionText,
                                  option.type === type && styles.typeOptionTextActive,
                                ]}
                              >
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Helper Text (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={option.helper_text || ''}
                        onChangeText={(text) => updateCustomizationOption(option.id, { helper_text: text })}
                        placeholder="Instructions or additional details"
                        placeholderTextColor={Colors.light.muted}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Price Adjustment ($)</Text>
                        <TextInput
                          style={styles.input}
                          value={option.price_delta.toString()}
                          onChangeText={(text) => updateCustomizationOption(option.id, { price_delta: parseFloat(text) || 0 })}
                          placeholder="0.00"
                          placeholderTextColor={Colors.light.muted}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    {option.type === 'select' && (
                      <View style={styles.choicesSection}>
                        <Text style={styles.inputLabel}>Options</Text>
                        {option.choices?.map((choice, idx) => (
                          <View key={idx} style={styles.choiceRow}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              value={choice.label}
                              onChangeText={(text) => updateChoice(option.id, idx, { label: text, value: text.toLowerCase().replace(/\s+/g, '_') })}
                              placeholder="Option name"
                              placeholderTextColor={Colors.light.muted}
                            />
                            <TextInput
                              style={[styles.input, { width: 80, marginLeft: 8 }]}
                              value={choice.price_delta.toString()}
                              onChangeText={(text) => updateChoice(option.id, idx, { price_delta: parseFloat(text) || 0 })}
                              placeholder="+$"
                              placeholderTextColor={Colors.light.muted}
                              keyboardType="decimal-pad"
                            />
                            <TouchableOpacity
                              style={styles.removeChoiceButton}
                              onPress={() => removeChoice(option.id, idx)}
                            >
                              <X size={16} color={Colors.light.terracotta} />
                            </TouchableOpacity>
                          </View>
                        ))}
                        <TouchableOpacity
                          style={styles.addChoiceButton}
                          onPress={() => addChoice(option.id)}
                        >
                          <Plus size={16} color={Colors.nautical.teal} />
                          <Text style={styles.addChoiceButtonText}>Add Option</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.customizationFlags}>
                      <TouchableOpacity
                        style={styles.flagRow}
                        onPress={() => updateCustomizationOption(option.id, { required: !option.required })}
                      >
                        <View style={[
                          styles.checkbox,
                          option.required && styles.checkboxActive,
                        ]}>
                          {option.required && <Check size={14} color={Colors.white} />}
                        </View>
                        <Text style={styles.flagLabel}>Required</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.flagRow}
                        onPress={() => updateCustomizationOption(option.id, { proof_required: !option.proof_required })}
                      >
                        <View style={[
                          styles.checkbox,
                          option.proof_required && styles.checkboxActive,
                        ]}>
                          {option.proof_required && <Check size={14} color={Colors.white} />}
                        </View>
                        <Text style={styles.flagLabel}>Proof Required</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addCustomizationButton}
              onPress={addCustomizationOption}
            >
              <Plus size={20} color={Colors.nautical.teal} />
              <Text style={styles.addCustomizationButtonText}>Add Customization Option</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <AlertCircle size={18} color={Colors.nautical.teal} />
              <Text style={styles.infoCardText}>
                Customization options allow customers to personalize products before purchase. Options marked as &ldquo;Required&rdquo; must be filled before adding to cart.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + 16, paddingTop: 16 },
          ]}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProduct}
            activeOpacity={0.8}
          >
            <Check size={22} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save Product</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
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
  inputError: {
    borderColor: Colors.light.terracotta,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.terracotta,
    marginTop: 6,
    marginLeft: 4,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadButtonDisabled: {
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cream,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  uploadButtonTextDisabled: {
    color: Colors.light.muted,
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imagePreviewCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative' as const,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    backgroundColor: Colors.light.terracotta,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImageBadge: {
    position: 'absolute' as const,
    bottom: 6,
    left: 6,
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mainImageBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.nautical.sandLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.charcoal,
    lineHeight: 18,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    marginBottom: 0,
  },
  addTagButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.nautical.teal,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  variantsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  variantCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    borderStyle: 'dashed',
  },
  addVariantButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  customizationContainer: {
    gap: 16,
    marginBottom: 16,
  },
  customizationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customizationCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.light.cream,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeOptionActive: {
    backgroundColor: Colors.nautical.sandLight,
    borderColor: Colors.nautical.teal,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.light.muted,
    textTransform: 'capitalize',
  },
  typeOptionTextActive: {
    color: Colors.nautical.teal,
    fontWeight: '600' as const,
  },
  choicesSection: {
    marginTop: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeChoiceButton: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addChoiceButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  customizationFlags: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  flagLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
  },
  addCustomizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    borderStyle: 'dashed',
  },
  addCustomizationButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  videoPreviewCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative' as const,
    backgroundColor: Colors.light.charcoal,
    marginBottom: 16,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  webVideoText: {
    fontSize: 14,
    color: Colors.white,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  removeVideoButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: Colors.light.terracotta,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
