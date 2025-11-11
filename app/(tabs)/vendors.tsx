import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { MapPin, Package, Store, Navigation, ChevronDown, X } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import Colors from '../../constants/colors';
import { vendors, Vendor } from '../../mocks/vendors';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useVendorLive } from '../contexts/VendorLiveContext';
import { haversineDistance, Coordinates } from '../utils/geolocation';
import { SERVICE_CATEGORIES } from '../../constants/serviceCategories';
import HamburgerMenu from '../components/HamburgerMenu';

interface VendorWithDistance extends Vendor {
  distance?: number;
}

const VENDOR_SPECIALTIES = Array.from(
  new Set(
    vendors
      .filter(v => v.vendorType !== 'service')
      .map(v => v.specialty)
      .filter(Boolean)
  )
).sort();

const CATEGORY_OPTIONS = [
  { group: 'Vendor Specialties', categories: VENDOR_SPECIALTIES },
  { group: 'Business & Professional', categories: SERVICE_CATEGORIES.BUSINESS_PROFESSIONAL },
  { group: 'Creative & Lifestyle', categories: SERVICE_CATEGORIES.CREATIVE_LIFESTYLE },
  { group: 'Local Services', categories: SERVICE_CATEGORIES.LOCAL_SERVICES },
  { group: 'Specialty', categories: SERVICE_CATEGORIES.SPECIALTY },
];

console.log('CATEGORY_OPTIONS:', CATEGORY_OPTIONS);

export default function VendorsScreen() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorites'>('all');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { favorites } = useFavorites();
  const { isAuthenticated } = useCustomerAuth();
  const { liveVendors } = useVendorLive();
  const insets = useSafeAreaInsets();

  const handleSearchNearMe = async () => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('Error', 'Geolocation is not supported by your browser');
          setIsLoadingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: Coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(coords);
            setSortByDistance(true);
            setIsLoadingLocation(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            Alert.alert('Location Error', 'Unable to get your location. Please enable location services.');
            setIsLoadingLocation(false);
          }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to search near you');
          setIsLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        setSortByDistance(true);
        setIsLoadingLocation(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location');
      setIsLoadingLocation(false);
    }
  };

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

  const displayedVendors = useMemo(() => {
    let vendorsList: VendorWithDistance[] = [];
    
    if (selectedTab === 'favorites') {
      const favoriteIds = new Set(favorites.map(f => f.vendorId));
      vendorsList = vendors.filter(v => favoriteIds.has(v.id));
    } else {
      vendorsList = [...vendors];
    }

    if (selectedCategories.length > 0) {
      vendorsList = vendorsList.filter(vendor => {
        if (vendor.serviceCategories && vendor.serviceCategories.length > 0) {
          return vendor.serviceCategories.some(cat => selectedCategories.includes(cat));
        }
        if (vendor.specialty) {
          return selectedCategories.includes(vendor.specialty);
        }
        return false;
      });
    }

    if (sortByDistance && userLocation) {
      vendorsList = vendorsList.map(vendor => {
        if (vendor.latitude && vendor.longitude) {
          const distance = haversineDistance(
            userLocation,
            { latitude: vendor.latitude, longitude: vendor.longitude }
          );
          return { ...vendor, distance };
        }
        return { ...vendor, distance: undefined };
      });

      vendorsList.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return vendorsList;
  }, [selectedTab, favorites, sortByDistance, userLocation, selectedCategories]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <HamburgerMenu />
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerIcon}>
            <Store size={32} color={Colors.white} strokeWidth={2.5} />
          </View>
          <Text style={styles.headerTitle}>Browse Vendors</Text>
          <Text style={styles.headerSubtitle}>Discover handcrafted treasures from local artisans</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.searchButton]}
              onPress={handleSearchNearMe}
              disabled={isLoadingLocation}
              activeOpacity={0.8}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Navigation size={18} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.actionButtonText}>
                    {sortByDistance ? 'By Distance' : 'Near Me'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.filterButton]}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Categories</Text>
              <ChevronDown size={18} color={Colors.white} strokeWidth={2.5} />
              {selectedCategories.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{selectedCategories.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {selectedCategories.length > 0 && (
            <View style={styles.selectedCategoriesContainer}>
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
                      <X size={14} color={Colors.white} strokeWidth={2.5} />
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
            </View>
          )}

          {isAuthenticated && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  selectedTab === 'all' && styles.tabActive,
                ]}
                onPress={() => setSelectedTab('all')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'all' && styles.tabTextActive,
                  ]}
                >
                  All Vendors
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  selectedTab === 'favorites' && styles.tabActive,
                ]}
                onPress={() => setSelectedTab('favorites')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === 'favorites' && styles.tabTextActive,
                  ]}
                >
                  Favorites
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {liveVendors.length > 0 && (
            <TouchableOpacity
              style={styles.liveBanner}
              onPress={() => router.push('/live')}
              activeOpacity={0.9}
            >
              <View style={styles.liveBannerContent}>
                <View style={styles.liveBannerIndicator} />
                <Text style={styles.liveBannerText}>
                  🔴 {liveVendors.length} shop{liveVendors.length === 1 ? '' : 's'} live now — Watch
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {displayedVendors.length > 0 ? (
            displayedVendors.map(vendor => (
              <TouchableOpacity
                key={vendor.id}
                style={styles.vendorCard}
                onPress={() => router.push(`/vendor/${vendor.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.coverImageContainer} pointerEvents="none">
                  <Image
                    source={{ uri: vendor.coverImage }}
                    style={styles.coverImage}
                    contentFit="cover"
                  />
                  <View style={styles.coverOverlay} />
                </View>
                <View style={styles.vendorContent} pointerEvents="none">
                  <Image
                    source={{ uri: vendor.avatar }}
                    style={styles.vendorAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <View style={styles.vendorMetaRow}>
                    <View style={styles.vendorMetaItem}>
                      <MapPin size={14} color={Colors.light.muted} />
                      <Text style={styles.vendorMetaText}>
                        {vendor.location}
                        {vendor.distance !== undefined && (
                          <Text style={styles.distanceText}>
                            {' '}({vendor.distance.toFixed(1)} mi)
                          </Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.vendorMetaItem}>
                      <Package size={14} color={Colors.light.muted} />
                      <Text style={styles.vendorMetaText}>{vendor.productCount} products</Text>
                    </View>
                  </View>
                  <View style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{vendor.specialty}</Text>
                  </View>
                  <Text style={styles.vendorBio} numberOfLines={3}>{vendor.bio}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                {selectedTab === 'favorites' ? 'No favorites yet' : 'No vendors found'}
              </Text>
              <Text style={styles.emptyStateText}>
                {selectedTab === 'favorites'
                  ? 'Add vendors to your favorites to see them here'
                  : 'Check back later for new vendors'}
              </Text>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </LinearGradient>

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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  vendorCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  coverImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative' as const,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  vendorContent: {
    padding: 20,
    alignItems: 'center',
  },
  vendorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -60,
    borderWidth: 4,
    borderColor: Colors.white,
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 12,
  },
  vendorMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  vendorMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorMetaText: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  specialtyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 20,
    marginBottom: 12,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.sage,
  },
  vendorBio: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabTextActive: {
    color: Colors.nautical.teal,
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  liveBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  liveBannerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  liveBannerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  liveBannerText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  buttonRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative' as const,
  },
  searchButton: {
    backgroundColor: Colors.light.sunsetCoral,
  },
  filterButton: {
    backgroundColor: Colors.nautical.oceanDeep,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  selectedCategoriesContainer: {
    marginTop: 16,
    width: '100%',
  },
  selectedCategoriesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  selectedCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  selectedCategoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
    maxWidth: 120,
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
  distanceText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.sunsetCoral,
  },
});
