import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams, Href } from 'expo-router';
import { ArrowLeft, Heart, MapPin, Package, Share2, ShoppingCart, Minus, Plus, CreditCard, DollarSign, AlertCircle, Upload, X, FileText } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, Alert, Platform, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import Colors from '@/app/constants/colors';
import { products } from '@/mocks/products';
import { vendors } from '@/mocks/vendors';
import { useCart, CustomizationValue } from '@/app/contexts/CartContext';
import { ShippingDisplay } from '@/app/components/ShippingDisplay';

import { productOptions } from '@/mocks/productOptions';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [customizationState, setCustomizationState] = useState<Record<string, string | boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; uri: string; mimeType: string }>>({});

  const product = products.find(p => p.id === id);
  const vendor = product ? vendors.find(v => v.id === product.vendorId) : undefined;
  const options = useMemo(() => productOptions.filter(opt => opt.product_ref === id), [id]);

  const customizationPrice = useMemo(() => {
    let total = 0;
    options.forEach(opt => {
      if (opt.type === 'checkbox' && customizationState[opt.code]) {
        total += opt.price_delta;
      } else if (opt.type === 'select' && customizationState[opt.code]) {
        const choice = opt.choices?.find(c => c.value === customizationState[opt.code]);
        if (choice) total += choice.price_delta;
      } else if ((opt.type === 'text' || opt.type === 'textarea') && customizationState[opt.code]) {
        total += opt.price_delta;
      } else if (opt.type === 'file' && uploadedFiles[opt.code]) {
        total += opt.price_delta;
      }
    });
    return total;
  }, [options, customizationState, uploadedFiles]);

  const requiresProof = useMemo(() => {
    return options.some(opt => {
      if (opt.proof_required) {
        if (opt.type === 'checkbox' && customizationState[opt.code]) return true;
        if (opt.type === 'select' && customizationState[opt.code]) return true;
        if (opt.type === 'file' && uploadedFiles[opt.code]) return true;
        if ((opt.type === 'text' || opt.type === 'textarea') && customizationState[opt.code]) return true;
      }
      return false;
    });
  }, [options, customizationState, uploadedFiles]);

  const selectedCustomizations = useMemo(() => {
    const result: { code: string; label: string; value: string; price_delta: number }[] = [];
    options.forEach(opt => {
      if (opt.type === 'checkbox' && customizationState[opt.code]) {
        result.push({ code: opt.code, label: opt.label, value: 'Yes', price_delta: opt.price_delta });
      } else if (opt.type === 'select' && customizationState[opt.code]) {
        const choice = opt.choices?.find(c => c.value === customizationState[opt.code]);
        if (choice) {
          result.push({ code: opt.code, label: opt.label, value: choice.label, price_delta: choice.price_delta });
        }
      } else if ((opt.type === 'text' || opt.type === 'textarea') && customizationState[opt.code]) {
        result.push({ code: opt.code, label: opt.label, value: customizationState[opt.code] as string, price_delta: opt.price_delta });
      } else if (opt.type === 'file' && uploadedFiles[opt.code]) {
        result.push({ code: opt.code, label: opt.label, value: uploadedFiles[opt.code].name, price_delta: opt.price_delta });
      }
    });
    return result;
  }, [options, customizationState, uploadedFiles]);

  if (!product || !vendor) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Product not found</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const allImages = product.images.length > 0 ? product.images : [product.image];

  const validateCustomizations = (): boolean => {
    for (const opt of options) {
      if (opt.required) {
        if (opt.type === 'file' && !uploadedFiles[opt.code]) {
          Alert.alert('Required Field', `${opt.label} is required`);
          return false;
        } else if (opt.type !== 'file' && !customizationState[opt.code]) {
          Alert.alert('Required Field', `${opt.label} is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!product || !vendor) return;

    if (!validateCustomizations()) return;

    const customizations: CustomizationValue[] = selectedCustomizations.map(c => ({
      code: c.code,
      label: c.label,
      value: c.value,
      price_delta: c.price_delta,
    }));

    await addItem(product, vendor, quantity, customizations.length > 0 ? customizations : undefined, requiresProof);
    router.push('/cart' as Href);
  };

  const handleFileUpload = async (optCode: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadedFiles(prev => ({
          ...prev,
          [optCode]: {
            name: file.name,
            uri: file.uri,
            mimeType: file.mimeType || 'application/octet-stream',
          },
        }));
      }
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const saveOrderIntent = async (method: string) => {
    console.log('Order Intent Saved:', {
      vendorId: vendor?.id,
      productId: product?.id,
      quantity,
      total: product ? product.price * quantity : 0,
      checkoutMethod: method,
      timestamp: new Date().toISOString(),
    });
  };

  const handleQuickCheckout = async (method: 'ecommerce' | 'paypal' | 'venmo' | 'cashapp') => {
    if (!product || !vendor) return;

    await saveOrderIntent(method);

    const total = product.price * quantity;
    const orderNote = `${quantity}x ${product.name} - ${total.toFixed(2)}`;

    try {
      switch (method) {
        case 'ecommerce':
          if (vendor.ecommerceUrl) {
            await Linking.openURL(vendor.ecommerceUrl);
          }
          break;
        case 'paypal':
          if (vendor.paypalLink) {
            await Linking.openURL(vendor.paypalLink);
          }
          break;
        case 'venmo':
          if (vendor.venmoHandle) {
            const venmoUrl = `venmo://paycharge?txn=pay&recipients=${vendor.venmoHandle}&amount=${total.toFixed(2)}&note=${encodeURIComponent(orderNote)}`;
            const canOpen = await Linking.canOpenURL(venmoUrl);
            if (canOpen) {
              await Linking.openURL(venmoUrl);
            } else {
              Alert.alert('Venmo Not Available', 'Please install the Venmo app or use another payment method.');
            }
          }
          break;
        case 'cashapp':
          if (vendor.cashappHandle) {
            const cashappUrl = `https://cash.app/${vendor.cashappHandle}/${total.toFixed(2)}`;
            await Linking.openURL(cashappUrl);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to open checkout:', error);
      Alert.alert('Error', 'Failed to open checkout. Please try again.');
    }
  };



  const renderCustomizationField = (opt: typeof options[0]) => {
    switch (opt.type) {
      case 'checkbox':
        return (
          <View key={opt.code} style={styles.customizationField}>
            <View style={styles.customizationHeader}>
              <Text style={styles.customizationLabel}>
                {opt.label}
                {opt.required && <Text style={styles.requiredMark}> *</Text>}
              </Text>
              <Switch
                value={!!customizationState[opt.code]}
                onValueChange={(val) => setCustomizationState(prev => ({ ...prev, [opt.code]: val }))}
                trackColor={{ false: Colors.light.softGray, true: Colors.light.sage }}
                thumbColor={Colors.light.card}
              />
            </View>
            {opt.helper_text && <Text style={styles.helperText}>{opt.helper_text}</Text>}
          </View>
        );

      case 'text':
        return (
          <View key={opt.code} style={styles.customizationField}>
            <Text style={styles.customizationLabel}>
              {opt.label}
              {opt.required && <Text style={styles.requiredMark}> *</Text>}
            </Text>
            <TextInput
              style={styles.textInput}
              value={(customizationState[opt.code] as string) || ''}
              onChangeText={(val) => setCustomizationState(prev => ({ ...prev, [opt.code]: val }))}
              placeholder={opt.helper_text}
              placeholderTextColor={Colors.light.muted}
            />
            {opt.helper_text && <Text style={styles.helperText}>{opt.helper_text}</Text>}
          </View>
        );

      case 'textarea':
        return (
          <View key={opt.code} style={styles.customizationField}>
            <Text style={styles.customizationLabel}>
              {opt.label}
              {opt.required && <Text style={styles.requiredMark}> *</Text>}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={(customizationState[opt.code] as string) || ''}
              onChangeText={(val) => setCustomizationState(prev => ({ ...prev, [opt.code]: val }))}
              placeholder={opt.helper_text}
              placeholderTextColor={Colors.light.muted}
              multiline
              numberOfLines={3}
            />
            {opt.helper_text && <Text style={styles.helperText}>{opt.helper_text}</Text>}
          </View>
        );

      case 'select':
        return (
          <View key={opt.code} style={styles.customizationField}>
            <Text style={styles.customizationLabel}>
              {opt.label}
              {opt.required && <Text style={styles.requiredMark}> *</Text>}
            </Text>
            <View style={styles.selectContainer}>
              {opt.choices?.map((choice) => (
                <TouchableOpacity
                  key={choice.value}
                  style={[
                    styles.selectOption,
                    customizationState[opt.code] === choice.value && styles.selectOptionActive,
                  ]}
                  onPress={() => setCustomizationState(prev => ({ ...prev, [opt.code]: choice.value }))}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      customizationState[opt.code] === choice.value && styles.selectOptionTextActive,
                    ]}
                  >
                    {choice.label}
                    {choice.price_delta > 0 && ` (+${choice.price_delta})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {opt.helper_text && <Text style={styles.helperText}>{opt.helper_text}</Text>}
          </View>
        );

      case 'file':
        return (
          <View key={opt.code} style={styles.customizationField}>
            <Text style={styles.customizationLabel}>
              {opt.label}
              {opt.required && <Text style={styles.requiredMark}> *</Text>}
            </Text>
            {uploadedFiles[opt.code] ? (
              <View style={styles.uploadedFileContainer}>
                <View style={styles.uploadedFileInfo}>
                  <FileText size={16} color={Colors.light.sage} />
                  <Text style={styles.uploadedFileName}>{uploadedFiles[opt.code].name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setUploadedFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[opt.code];
                    return newFiles;
                  })}
                >
                  <X size={18} color={Colors.light.muted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleFileUpload(opt.code)}
              >
                <Upload size={16} color={Colors.light.text} />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </TouchableOpacity>
            )}
            {opt.helper_text && <Text style={styles.helperText}>{opt.helper_text}</Text>}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.topBarActions}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Heart 
                  size={24} 
                  color={isFavorite ? Colors.light.terracotta : Colors.light.text}
                  fill={isFavorite ? Colors.light.terracotta : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Share2 size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mainContent}>
            <View style={styles.leftColumn}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imagesScroll}
              >
                {allImages.map((imageUri, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>

              {allImages.length > 1 && (
                <View style={styles.imagePagination}>
                  {allImages.map((_, index) => (
                    <View key={index} style={styles.paginationDot} />
                  ))}
                </View>
              )}

              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{product.category}</Text>
                  </View>
                  {!product.inStock && (
                    <View style={styles.outOfStockBanner}>
                      <Package size={16} color={Colors.light.muted} />
                      <Text style={styles.outOfStockText}>Currently Out of Stock</Text>
                    </View>
                  )}

                  {vendor && (
                    <ShippingDisplay
                      settings={{
                        flatPerItem: 4.00,
                        freeShippingOver: 50,
                        allowLocalPickup: vendor.pickupAvailable || false,
                        pickupInstructions: vendor.pickupInstructions,
                        handlingTimeDays: 2,
                      }}
                      location={vendor.location}
                      variant="compact"
                    />
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{product.description}</Text>
                </View>

                {Platform.OS !== 'web' && options.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Customization</Text>
                      {options.map(opt => renderCustomizationField(opt))}
                      {requiresProof && (
                        <View style={styles.proofBadge}>
                          <AlertCircle size={14} color={Colors.light.terracotta} />
                          <Text style={styles.proofText}>Proof required before production</Text>
                        </View>
                      )}
                      {customizationPrice > 0 && (
                        <View style={styles.mobilePriceBreakdown}>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base Price</Text>
                            <Text style={styles.priceValue}>${product.price.toFixed(2)}</Text>
                          </View>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Customizations</Text>
                            <Text style={styles.priceValue}>+${customizationPrice.toFixed(2)}</Text>
                          </View>
                          <View style={[styles.priceRow, styles.priceTotalRow]}>
                            <Text style={styles.priceTotalLabel}>Total</Text>
                            <Text style={styles.priceTotalValue}>${(product.price + customizationPrice).toFixed(2)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </>
                )}

                <View style={styles.divider} />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vendor</Text>
                  <TouchableOpacity
                    style={styles.vendorCard}
                    onPress={() => router.push(`/vendor/${vendor.id}`)}
                  >
                    <Image
                      source={{ uri: vendor.avatar }}
                      style={styles.vendorAvatar}
                      contentFit="cover"
                    />
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendor.name}</Text>
                      <View style={styles.vendorMeta}>
                        <MapPin size={14} color={Colors.light.muted} />
                        <Text style={styles.vendorLocation}>{vendor.location}</Text>
                      </View>
                      <Text style={styles.vendorSpecialty}>{vendor.specialty}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {Platform.OS === 'web' && (
              <View style={styles.rightColumn}>
                <View style={styles.stickyPanel}>
                  <View style={styles.panelCard}>
                    <Text style={styles.panelPrice}>${product.price}</Text>
                    <Text style={styles.panelStock}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Text>

                    {options.length > 0 && (
                      <>
                        <View style={styles.customizationSection}>
                          <Text style={styles.customizationTitle}>Customization</Text>
                          {options.map(opt => renderCustomizationField(opt))}
                        </View>
                        {requiresProof && (
                          <View style={styles.proofBadge}>
                            <AlertCircle size={14} color={Colors.light.terracotta} />
                            <Text style={styles.proofText}>Proof required before production</Text>
                          </View>
                        )}
                        <View style={styles.priceDivider} />
                        <View style={styles.priceBreakdown}>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base</Text>
                            <Text style={styles.priceValue}>${product.price.toFixed(2)}</Text>
                          </View>
                          {customizationPrice > 0 && (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceLabel}>Customizations</Text>
                              <Text style={styles.priceValue}>+${customizationPrice.toFixed(2)}</Text>
                            </View>
                          )}
                          <View style={[styles.priceRow, styles.priceTotalRow]}>
                            <Text style={styles.priceTotalLabel}>Total</Text>
                            <Text style={styles.priceTotalValue}>${(product.price + customizationPrice).toFixed(2)}</Text>
                          </View>
                        </View>
                        <View style={styles.priceDivider} />
                      </>
                    )}

                    <View style={styles.quantitySection}>
                      <Text style={styles.quantityLabel}>Quantity</Text>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus size={16} color={Colors.light.text} />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => setQuantity(quantity + 1)}
                        >
                          <Plus size={16} color={Colors.light.text} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.panelAddButton, !product.inStock && styles.panelAddButtonDisabled]}
                      disabled={!product.inStock}
                      onPress={handleAddToCart}
                    >
                      <ShoppingCart size={18} color={Colors.light.card} />
                      <Text style={styles.panelAddButtonText}>Add to Cart</Text>
                    </TouchableOpacity>

                    {selectedCustomizations.length > 0 && (
                      <View style={styles.previewChips}>
                        {selectedCustomizations.map((custom, idx) => (
                          <View key={idx} style={styles.previewChip}>
                            <Text style={styles.previewChipText}>
                              {custom.label}: {custom.value}
                              {custom.price_delta > 0 && ` (+${custom.price_delta})`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.checkoutDivider} />

                    <Text style={styles.quickCheckoutTitle}>Quick Checkout</Text>

                    {vendor.ecommerceUrl && (
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={() => handleQuickCheckout('ecommerce')}
                      >
                        <CreditCard size={18} color={Colors.light.text} />
                        <Text style={styles.checkoutButtonText}>Buy on {vendor.name} Site</Text>
                      </TouchableOpacity>
                    )}

                    {vendor.paypalLink && (
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={() => handleQuickCheckout('paypal')}
                      >
                        <DollarSign size={18} color="#003087" />
                        <Text style={styles.checkoutButtonText}>Pay with PayPal</Text>
                      </TouchableOpacity>
                    )}

                    {vendor.venmoHandle && (
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={() => handleQuickCheckout('venmo')}
                      >
                        <DollarSign size={18} color="#008CFF" />
                        <Text style={styles.checkoutButtonText}>Pay with Venmo</Text>
                      </TouchableOpacity>
                    )}

                    {vendor.cashappHandle && (
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={() => handleQuickCheckout('cashapp')}
                      >
                        <DollarSign size={18} color="#00D632" />
                        <Text style={styles.checkoutButtonText}>Pay with Cash App</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {Platform.OS !== 'web' && (
          <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
            <View style={styles.bottomBarContent}>
              <View style={styles.mobileQuantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={16} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Plus size={16} color={Colors.light.text} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.addButton, !product.inStock && styles.addButtonDisabled]}
                disabled={!product.inStock}
                onPress={handleAddToCart}
              >
                <ShoppingCart size={20} color={Colors.light.card} />
                <Text style={styles.addButtonText}>
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}


      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scroll: {
    flex: 1,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    width: 380,
  },
  imagesScroll: {
    height: 400,
  },
  productImage: {
    width: Platform.OS === 'web' ? undefined : width,
    flex: Platform.OS === 'web' ? 1 : undefined,
    height: 400,
  },
  imagePagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.muted,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.sage,
  },
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
  },
  outOfStockText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.text,
  },
  vendorCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  vendorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vendorLocation: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  vendorSpecialty: {
    fontSize: 13,
    color: Colors.light.sage,
    fontWeight: '500' as const,
  },
  stickyPanel: {
    position: 'sticky' as any,
    top: 20,
  },
  panelCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  panelPrice: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
    marginBottom: 4,
  },
  panelStock: {
    fontSize: 14,
    color: Colors.light.sage,
    fontWeight: '600' as const,
    marginBottom: 20,
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    minWidth: 40,
    textAlign: 'center',
  },
  panelAddButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.light.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelAddButtonDisabled: {
    backgroundColor: Colors.light.softGray,
  },
  panelAddButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 20,
  },
  quickCheckoutTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    padding: 20,
  },
  bottomBarContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mobileQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.light.terracotta,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.light.softGray,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: Colors.light.terracotta,
    fontWeight: '600' as const,
  },
  customizationSection: {
    marginBottom: 20,
  },
  customizationTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  customizationField: {
    marginBottom: 16,
  },
  customizationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requiredMark: {
    color: Colors.light.terracotta,
  },
  textInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectOptionActive: {
    backgroundColor: Colors.light.accentLight,
    borderColor: Colors.light.sage,
  },
  selectOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  selectOptionTextActive: {
    color: Colors.light.sage,
    fontWeight: '600' as const,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.sage,
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.sage,
    flex: 1,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
    marginBottom: 16,
  },
  proofText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.terracotta,
    flex: 1,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  priceTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  priceTotalValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  previewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 6,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.light.sage,
  },
  mobilePriceBreakdown: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
});
