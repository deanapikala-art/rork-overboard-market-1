import { router } from 'expo-router';
import { ArrowLeft, Grid, Store } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { vendors } from '@/mocks/vendors';
import { LocalShoppingToolbar } from '@/app/components/LocalShoppingToolbar';
import { geocodeZipCode, haversineDistance } from '@/app/utils/geolocation';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'pottery', name: 'Pottery & Ceramics', icon: '🏺', color: '#8B7355', categoryColor: '#5D4D40' },
  { id: 'textiles', name: 'Textiles & Weaving', icon: '🧵', color: '#A68A6D', categoryColor: '#6B5D4F' },
  { id: 'jewelry', name: 'Jewelry & Metalwork', icon: '💍', color: '#C4A582', categoryColor: '#8B7865' },
  { id: 'woodcraft', name: 'Woodcraft', icon: '🪵', color: '#A89378', categoryColor: '#7A6B5D' },
  { id: 'embroidery', name: 'Embroidery & Fiber Art', icon: '🧶', color: '#8B7355', categoryColor: '#5D4D40' },
  { id: 'clay', name: 'Polymer Clay Art', icon: '🎨', color: '#A68A6D', categoryColor: '#6B5D4F' },
];

const VENDOR_LIST = vendors.map((vendor, index) => {
  const categoryIndex = CATEGORIES.findIndex(cat => cat.name === vendor.specialty);
  return {
    ...vendor,
    category: CATEGORIES[categoryIndex >= 0 ? categoryIndex : index % CATEGORIES.length],
  };
});

interface CategoryRowProps {
  category: typeof CATEGORIES[0];
  vendorCount: number;
  isExpanded: boolean;
  onPress: () => void;
}

function CategoryRow({ category, vendorCount, isExpanded, onPress }: CategoryRowProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isExpanded, slideAnim]);

  const scaleY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.categoryRowContainer}
    >
      <Animated.View
        style={[
          styles.categoryRow,
          {
            transform: [{ scaleY }],
            backgroundColor: isExpanded ? category.categoryColor : category.categoryColor + 'DD',
          },
        ]}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryNameSection}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Store size={14} color={Colors.nautical.sandLight} />
            <Text style={styles.categoryVendorCount}>{vendorCount} vendors</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface VendorCardProps {
  vendor: typeof VENDOR_LIST[0];
  onPress: () => void;
}

function VendorCard({ vendor, onPress }: VendorCardProps) {
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bobAnim]);

  const translateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.vendorContainer}
    >
      <Animated.View
        style={[
          styles.vendorCard,
          {
            transform: [{ translateY }],
            backgroundColor: vendor.category.color,
          },
        ]}
      >
        <LinearGradient
          colors={[vendor.category.color + 'F5', vendor.category.color + 'CC']}
          style={styles.vendorGradient}
        >
          <Text style={styles.vendorIcon}>{vendor.category.icon}</Text>
          <Text style={styles.vendorName} numberOfLines={2}>
            {vendor.name}
          </Text>
          <View style={styles.vendorFooter}>
            <Text style={styles.vendorItemCount}>{vendor.productCount}</Text>
            {vendor.isLive && (
              <View style={styles.vendorLiveDot} />
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}





export default function VendorBrowsePage() {
  const insets = useSafeAreaInsets();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(25);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

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

  const filteredVendors = useMemo(() => {
    let filtered = [...VENDOR_LIST];

    if (userCoords && zipCode.length === 5) {
      filtered = filtered.filter((vendor) => {
        if (!vendor.latitude || !vendor.longitude) return false;
        
        const distance = haversineDistance(
          userCoords,
          { latitude: vendor.latitude, longitude: vendor.longitude }
        );
        return distance <= radius;
      });
    }

    return filtered;
  }, [userCoords, zipCode, radius]);

  const vendorsByCategory = useMemo(() => {
    const grouped: Record<string, typeof VENDOR_LIST> = {};
    
    CATEGORIES.forEach(cat => {
      grouped[cat.id] = filteredVendors.filter(v => v.category.id === cat.id);
    });
    
    return grouped;
  }, [filteredVendors]);

  const handleBackEntrance = () => {
    router.back();
  };

  const handleVendorPress = (vendorId: string) => {
    router.push(`/vendor/${vendorId}`);
  };

  const handleCategoryPress = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F5E6D3', '#E8DCC8', '#D4C4B0']}
        style={styles.gradient}
      >
        <View style={{ paddingTop: insets.top }} />

        <View style={[styles.header, { paddingTop: 12 }]}>
          <TouchableOpacity onPress={handleBackEntrance} style={styles.backButton}>
            <LinearGradient
              colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
              style={styles.backButtonGradient}
            >
              <ArrowLeft size={20} color="#FFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Grid size={28} color={Colors.light.sage} strokeWidth={2.5} />
            <Text style={styles.pageTitle}>Browse Vendors</Text>
          </View>
        </View>

        <LocalShoppingToolbar
          zipCode={zipCode}
          onZipCodeChange={setZipCode}
          radius={radius}
          onRadiusChange={setRadius}
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.vendorsMainContainer}>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsText}>Tap a category to browse vendors</Text>
            </View>

            <View style={styles.categoriesWrapper}>
              {CATEGORIES.map((category) => {
                const vendors = vendorsByCategory[category.id] || [];
                const isExpanded = expandedCategory === category.id;
                
                if (vendors.length === 0) return null;

                return (
                  <View key={category.id} style={styles.categorySection}>
                    <CategoryRow
                      category={category}
                      vendorCount={vendors.length}
                      isExpanded={isExpanded}
                      onPress={() => handleCategoryPress(category.id)}
                    />

                    {isExpanded && (
                      <View style={styles.vendorsGrid}>
                        {vendors.map((vendor) => (
                          <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            onPress={() => handleVendorPress(vendor.id)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {filteredVendors.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No vendors found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {zipCode.length === 5
                    ? `No vendors within ${radius} miles of ${zipCode}`
                    : 'Try adjusting your filters'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 80,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 12,
    zIndex: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 48,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingTop: 20,
  },
  vendorsMainContainer: {
    paddingHorizontal: 16,
  },
  instructionsBox: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  categoriesWrapper: {
    gap: 20,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryRowContainer: {
    marginBottom: 4,
  },
  categoryRow: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
    flex: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  categoryVendorCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  vendorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  vendorContainer: {
    width: Platform.OS === 'web' ? 'calc(33.33% - 8px)' as any : (width - 60) / 3,
    alignItems: 'center',
  },
  vendorCard: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  vendorGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorIcon: {
    fontSize: 36,
    marginTop: 8,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 16,
  },
  vendorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  vendorItemCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  vendorLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
  },
});
