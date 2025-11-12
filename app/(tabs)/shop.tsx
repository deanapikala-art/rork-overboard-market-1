import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Search, Package, ExternalLink, ChevronDown, X } from 'lucide-react-native';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Animated, NativeScrollEvent, NativeSyntheticEvent, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { categories, products } from '@/mocks/products';
import { SERVICE_CATEGORIES } from '@/constants/serviceCategories';
import { vendors } from '@/mocks/vendors';
import { LocalShoppingToolbar } from '@/components/LocalShoppingToolbar';
import { geocodeZipCode, haversineDistance } from '@/utils/geolocation';
import { logAnalyticsEvent } from '@/mocks/analytics';
import { TopNavigation } from '@/components/TopNavigation';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import HamburgerMenu from '@/components/HamburgerMenu';
import { useResponsive } from '@/hooks/useResponsive';

const PRODUCT_CATEGORIES = categories.filter(c => c !== 'All');

const CATEGORY_OPTIONS = [
  { group: 'Product Categories', categories: PRODUCT_CATEGORIES },
  { group: 'Business & Professional', categories: SERVICE_CATEGORIES.BUSINESS_PROFESSIONAL },
  { group: 'Creative & Lifestyle', categories: SERVICE_CATEGORIES.CREATIVE_LIFESTYLE },
  { group: 'Local Services', categories: SERVICE_CATEGORIES.LOCAL_SERVICES },
  { group: 'Specialty', categories: SERVICE_CATEGORIES.SPECIALTY },
];

console.log('CATEGORY_OPTIONS:', CATEGORY_OPTIONS);

export default function ShopScreen() {
  const { profile, isAuthenticated } = useCustomerAuth();
  const { numColumns } = useResponsive();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(25);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const toolbarTranslateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (zipCode.length === 5) {
      geocodeZipCode(zipCode).then((coords: { latitude: number; longitude: number } | null) => {
        if (coords) {
          setUserCoords(coords);
        }
      });
    } else {
      setUserCoords(null);
    }
  }, [zipCode]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (userCoords && zipCode.length === 5) {
      filtered = filtered.filter((product) => {
        const vendor = vendors.find(v => v.id === product.vendorId);
        if (!vendor || !vendor.latitude || !vendor.longitude) return false;
        
        const distance = haversineDistance(
          userCoords,
          { latitude: vendor.latitude, longitude: vendor.longitude }
        );
        return distance <= radius;
      });
    }

    return filtered;
  }, [selectedCategories, searchQuery, userCoords, zipCode, radius]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
        
        if (direction !== scrollDirection.current && Math.abs(currentScrollY - lastScrollY.current) > 5) {
          scrollDirection.current = direction;
          
          Animated.spring(toolbarTranslateY, {
            toValue: direction === 'down' && currentScrollY > 50 ? -200 : 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
        }
        
        lastScrollY.current = currentScrollY;
      },
    }
  );

  const handleEtsyPress = (vendorId: string, url: string) => {
    logAnalyticsEvent({
      type: 'etsy_outbound_click',
      vendor_id: vendorId,
      url,
      timestamp: new Date().toISOString(),
    });
    Linking.openURL(url);
  };

  const renderProduct = ({ item }: { item: typeof products[0] }) => {
    const vendor = vendors.find(v => v.id === item.vendorId);
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          contentFit="cover"
        />
        {vendor?.etsyBadgeEnabled && vendor?.etsyShopUrl && (
          <TouchableOpacity
            style={styles.etsyRibbon}
            onPress={(e) => {
              e.stopPropagation();
              handleEtsyPress(vendor.id, vendor.etsyShopUrl!);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F1641E', '#D95D19']}
              style={styles.etsyRibbonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ExternalLink size={9} color="#FFF" />
              <Text style={styles.etsyRibbonText}>Etsy</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {vendor?.pickupAvailable && (
          <View style={styles.pickupBadge}>
            <Package size={10} color="#FFF" />
            <Text style={styles.pickupBadgeText}>Pickup</Text>
          </View>
        )}
        {(item.bulky || item.localOnly) && (
          <View style={styles.localOnlyBadge}>
            <Text style={styles.localOnlyBadgeText}>Local Only</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/vendor/${vendor?.id}`);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.productVendor} numberOfLines={1}>By {item.vendorName}</Text>
          </TouchableOpacity>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>${item.price}</Text>
            {!item.inStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Sold Out</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {isAuthenticated && profile && (
        <View style={styles.welcomeBar}>
          <Text style={styles.welcomeText}>Welcome back, {profile.name.split(' ')[0]}! 👋</Text>
        </View>
      )}

      {!isAuthenticated && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>
            👋 Browsing as guest — sign in to complete purchases
          </Text>
          <TouchableOpacity
            style={styles.guestSignInButton}
            onPress={() => router.push('/customer-auth')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestSignInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}



      <View style={styles.filtersSection}>
        <Text style={styles.filtersSectionTitle}>Browse Categories</Text>
        <TouchableOpacity
          style={styles.categoryDropdown}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryDropdownText}>
            {selectedCategories.length === 0
              ? 'All Categories'
              : `${selectedCategories.length} selected`}
          </Text>
          <ChevronDown size={20} color={Colors.light.charcoal} strokeWidth={2} />
        </TouchableOpacity>

        {selectedCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedCategoriesScroll}
          >
            {selectedCategories.map(category => (
              <View key={category} style={styles.selectedCategoryChip}>
                <Text style={styles.selectedCategoryChipText} numberOfLines={1}>
                  {category}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <X size={14} color={Colors.nautical.teal} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearCategories}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.searchSectionContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or vendors..."
            placeholderTextColor={Colors.light.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.shopLocalSection}>
        <LocalShoppingToolbar
          zipCode={zipCode}
          onZipCodeChange={setZipCode}
          radius={radius}
          onRadiusChange={setRadius}
        />
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <HamburgerMenu />
        <TopNavigation />
        <Animated.FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.productsGrid}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      </Animated.View>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <X size={24} color={Colors.light.charcoal} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CATEGORY_OPTIONS.filter(g => g.categories.length > 0).map((group, idx) => (
                <View key={idx} style={styles.categoryGroup}>
                  <Text style={styles.categoryGroupTitle}>{group.group}</Text>
                  {group.categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        selectedCategories.includes(category) && styles.categoryOptionSelected,
                      ]}
                      onPress={() => toggleCategory(category)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          selectedCategories.includes(category) && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                      {selectedCategories.includes(category) && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearCategories}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.applyButtonText}>
                  Apply {selectedCategories.length > 0 ? `(${selectedCategories.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  welcomeBar: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  searchSectionContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  animatedToolbarContainer: {
    zIndex: 5,
  },
  filtersSection: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  filtersSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  categoryDropdownText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
  },
  selectedCategoriesScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  selectedCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.accentLight,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.nautical.teal,
  },
  selectedCategoryChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    maxWidth: 120,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.softGray,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  productsGrid: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
    height: 36,
  },
  productVendor: {
    fontSize: 12,
    color: Colors.nautical.teal,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.sunsetCoral,
  },
  outOfStockBadge: {
    backgroundColor: Colors.light.softGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  shopLocalSection: {
    backgroundColor: 'transparent',
    paddingBottom: 16,
  },
  shopLocalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  shopLocalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopLocalTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    letterSpacing: 0.2,
  },
  pickupBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  pickupBadgeText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  localOnlyBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    backgroundColor: 'rgba(139, 123, 106, 0.9)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  localOnlyBadgeText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  etsyRibbon: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#F1641E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 2,
  },
  etsyRibbonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    gap: 3,
  },
  etsyRibbonText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  guestBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.nautical.teal,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  guestBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  guestSignInButton: {
    backgroundColor: Colors.light.sunsetCoral,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  guestSignInButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  modalScroll: {
    flex: 1,
  },
  categoryGroup: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  categoryGroupTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.sage,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  categoryOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.accentLight,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
