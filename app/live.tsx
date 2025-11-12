import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Video, 
  MapPin, 
  ExternalLink, 
  Store, 
  ChevronLeft, 
  ChevronRight,
  Map,
  Play,
  MessageCircle,
  Heart,
  Sparkles,
  Pause,
  ShoppingBag,
  X,
  Waves,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import Colors from '@/app/constants/colors';
import { useVendorLive } from '@/app/contexts/VendorLiveContext';
import { products } from '@/mocks/products';

type FilterType = 'all' | 'youtube' | 'instagram' | 'facebook' | 'tiktok';
type ViewMode = 'map' | 'walkthrough';
type WalkMode = 'auto' | 'manual';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOOTH_WIDTH = SCREEN_WIDTH - 40;
const AUTO_WALK_DURATION = 8000;
const FEATURED_ITEMS_PER_BOOTH = 4;
const PRODUCT_ROTATION_DURATION = 4000;

export default function LiveVendorsPage() {
  const insets = useSafeAreaInsets();
  const { liveVendors, isLoading, error, recordClick } = useVendorLive();
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('walkthrough');
  const [walkMode, setWalkMode] = useState<WalkMode>('manual');
  const [currentBoothIndex, setCurrentBoothIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoWalkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const animatedBannerValue = useRef(new Animated.Value(0)).current;
  const animatedGlowValue = useRef(new Animated.Value(0)).current;
  const itemFadeAnims = useRef<Record<string, Animated.Value>>({}).current;
  const itemSlideAnims = useRef<Record<string, Animated.Value>>({}).current;
  const productRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wavesAnimValue = useRef(new Animated.Value(0)).current;

  const filteredVendors = useMemo(() => {
    if (filter === 'all') return liveVendors;
    return liveVendors.filter(v => v.live_platform === filter);
  }, [liveVendors, filter]);

  const getVendorFeaturedItems = useCallback((vendorId: string) => {
    const vendorProducts = products.filter(p => p.vendorId === vendorId && p.featured && p.inStock);
    return vendorProducts.slice(0, FEATURED_ITEMS_PER_BOOTH);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedBannerValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedBannerValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedGlowValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedGlowValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(wavesAnimValue, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wavesAnimValue, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedBannerValue, animatedGlowValue, wavesAnimValue]);

  useEffect(() => {
    if (walkMode === 'auto' && viewMode === 'walkthrough' && filteredVendors.length > 0) {
      autoWalkIntervalRef.current = setInterval(() => {
        setCurrentBoothIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % filteredVendors.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * BOOTH_WIDTH,
            animated: true,
          });
          return nextIndex;
        });
      }, AUTO_WALK_DURATION);

      return () => {
        if (autoWalkIntervalRef.current) {
          clearInterval(autoWalkIntervalRef.current);
        }
      };
    } else {
      if (autoWalkIntervalRef.current) {
        clearInterval(autoWalkIntervalRef.current);
      }
    }
  }, [walkMode, viewMode, filteredVendors.length]);

  useEffect(() => {
    const currentVendor = filteredVendors[currentBoothIndex];
    if (currentVendor) {
      const vendorFeaturedItems = getVendorFeaturedItems(currentVendor.id);
      vendorFeaturedItems.forEach((item, index) => {
        const itemKey = `${currentVendor.id}-${item.id}`;
        
        if (!itemFadeAnims[itemKey]) {
          itemFadeAnims[itemKey] = new Animated.Value(0);
        }
        if (!itemSlideAnims[itemKey]) {
          itemSlideAnims[itemKey] = new Animated.Value(50);
        }

        setTimeout(() => {
          Animated.parallel([
            Animated.timing(itemFadeAnims[itemKey], {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(itemSlideAnims[itemKey], {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 300);
      });
    }
  }, [currentBoothIndex, filteredVendors, getVendorFeaturedItems, itemFadeAnims, itemSlideAnims]);

  const bannerTranslate = animatedBannerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  const glowOpacity = animatedGlowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const handleWatchLive = async (vendor: typeof liveVendors[0]) => {
    try {
      await recordClick(vendor.id);
      await Linking.openURL(vendor.live_url);
    } catch (err) {
      console.error('[LiveVendors] Error opening live URL:', err);
    }
  };

  const handleViewShop = (vendorId: string) => {
    router.push(`/vendor/${vendorId}`);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/vendors');
    }
  };

  const handleNextBooth = () => {
    if (currentBoothIndex < filteredVendors.length - 1) {
      const nextIndex = currentBoothIndex + 1;
      setCurrentBoothIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * BOOTH_WIDTH,
        animated: true,
      });
    }
  };

  const handlePrevBooth = () => {
    if (currentBoothIndex > 0) {
      const prevIndex = currentBoothIndex - 1;
      setCurrentBoothIndex(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * BOOTH_WIDTH,
        animated: true,
      });
    }
  };

  const handleMapBoothSelect = (index: number) => {
    setCurrentBoothIndex(index);
    setViewMode('walkthrough');
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: index * BOOTH_WIDTH,
        animated: true,
      });
    }, 300);
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / BOOTH_WIDTH);
    if (index !== currentBoothIndex && index >= 0 && index < filteredVendors.length) {
      setCurrentBoothIndex(index);
    }
  };

  const toggleWalkMode = () => {
    setWalkMode((prev) => (prev === 'auto' ? 'manual' : 'auto'));
  };

  const handleProductPress = (product: typeof products[0]) => {
    setSelectedProduct(product);
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  useEffect(() => {
    const currentVendor = filteredVendors[currentBoothIndex];
    if (!currentVendor) return;

    const featuredItems = getVendorFeaturedItems(currentVendor.id);
    if (featuredItems.length <= 2) return;

    productRotationRef.current = setInterval(() => {
      setCurrentProductIndex(prev => (prev + 2) % featuredItems.length);
    }, PRODUCT_ROTATION_DURATION);

    return () => {
      if (productRotationRef.current) {
        clearInterval(productRotationRef.current);
      }
    };
  }, [currentBoothIndex, filteredVendors, getVendorFeaturedItems]);

  const renderMapView = () => (
    <ScrollView
      style={styles.mapContainer}
      contentContainerStyle={styles.mapContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mapHeader}>
        <Map size={32} color={Colors.white} strokeWidth={2} />
        <Text style={styles.mapTitle}>Fair Ground Map</Text>
        <Text style={styles.mapSubtitle}>Tap any booth to visit</Text>
      </View>

      <View style={styles.boothGrid}>
        {filteredVendors.map((vendor, index) => (
          <TouchableOpacity
            key={vendor.id}
            style={styles.mapBoothCard}
            onPress={() => handleMapBoothSelect(index)}
            activeOpacity={0.7}
          >
            <Animated.View 
              style={[
                styles.mapBoothGlow,
                { opacity: glowOpacity }
              ]}
            />
            
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              style={styles.mapBoothBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mapBoothDot} />
              <Text style={styles.mapBoothBadgeText}>LIVE</Text>
            </LinearGradient>

            <Image
              source={{ uri: vendor.logo_url || 'https://via.placeholder.com/120' }}
              style={styles.mapBoothImage}
              contentFit="cover"
            />
            
            <Animated.View 
              style={[
                styles.mapBoothBanner,
                { transform: [{ translateY: bannerTranslate }] }
              ]}
            >
              <Text style={styles.mapBoothName} numberOfLines={1}>
                {vendor.vendor_name}
              </Text>
            </Animated.View>

            <View style={styles.mapBoothNumber}>
              <Text style={styles.mapBoothNumberText}>#{index + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: insets.bottom + 40 }} />
    </ScrollView>
  );

  const renderWalkthroughView = () => {
    const currentVendor = filteredVendors[currentBoothIndex];

    return (
      <View style={styles.walkthroughContainer}>
        <View style={styles.walkthroughHeader}>
          <View style={styles.walkthroughHeaderTop}>
            <View style={styles.walkthroughInfo}>
              <Sparkles size={20} color={Colors.light.sunsetCoral} strokeWidth={2.5} />
              <Text style={styles.walkthroughText}>
                You&apos;re visiting <Text style={styles.walkthroughVendorName}>{currentVendor?.vendor_name}</Text>
              </Text>
            </View>
            <View style={styles.walkControlsRow}>
              <TouchableOpacity
                style={styles.soundButton}
                onPress={toggleSound}
                activeOpacity={0.8}
              >
                {isSoundEnabled ? (
                  <Volume2 size={18} color={Colors.white} />
                ) : (
                  <VolumeX size={18} color={Colors.white} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.walkModeButton}
                onPress={toggleWalkMode}
                activeOpacity={0.8}
              >
                {walkMode === 'auto' ? (
                  <Pause size={18} color={Colors.white} fill={Colors.white} />
                ) : (
                  <Play size={18} color={Colors.white} fill={Colors.white} />
                )}
                <Text style={styles.walkModeText}>
                  {walkMode === 'auto' ? 'Pause' : 'Auto Walk'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.walkthroughCounter}>
            Booth {currentBoothIndex + 1} of {filteredVendors.length}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          decelerationRate="fast"
          snapToInterval={BOOTH_WIDTH}
          contentContainerStyle={styles.walkthroughScroll}
        >
          {filteredVendors.map((vendor, index) => (
            <View key={vendor.id} style={styles.boothCard}>
              <View style={styles.woodPlankFloor}>
                <View style={[styles.plankLine, { left: '25%' }]} />
                <View style={[styles.plankLine, { left: '50%' }]} />
                <View style={[styles.plankLine, { left: '75%' }]} />
              </View>
              
              <Animated.View 
                style={[
                  styles.boothGlow,
                  { opacity: glowOpacity }
                ]}
              />
              
              <Animated.View
                style={[
                  styles.wavesBackground,
                  {
                    opacity: wavesAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.6],
                    }),
                  },
                ]}
              >
                <Waves size={80} color={Colors.nautical.teal} strokeWidth={1} />
              </Animated.View>

              <LinearGradient
                colors={[Colors.nautical.sandLight, Colors.white]}
                style={styles.boothContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.stringLights}>
                  {[...Array(5)].map((_, i) => (
                    <Animated.View 
                      key={i} 
                      style={[
                        styles.lightBulb,
                        { opacity: glowOpacity }
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.boothHeader}>
                  <Image
                    source={{ uri: vendor.logo_url || 'https://via.placeholder.com/100' }}
                    style={styles.boothLogo}
                    contentFit="cover"
                  />
                  <View style={styles.boothHeaderInfo}>
                    <Text style={styles.boothVendorName}>{vendor.vendor_name}</Text>
                    {vendor.state && (
                      <View style={styles.boothLocation}>
                        <MapPin size={16} color={Colors.light.muted} />
                        <Text style={styles.boothLocationText}>{vendor.state}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <LinearGradient
                  colors={['#F59E0B', '#EF4444']}
                  style={styles.boothLiveBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.View 
                    style={[
                      styles.boothLiveDot,
                      { opacity: glowOpacity }
                    ]}
                  />
                  <Video size={20} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.boothLiveText}>LIVE NOW</Text>
                </LinearGradient>

                {vendor.session_notes && (
                  <Animated.View 
                    style={[
                      styles.boothBanner,
                      { transform: [{ translateY: bannerTranslate }] }
                    ]}
                  >
                    <Text style={styles.boothBannerText} numberOfLines={2}>
                      {vendor.session_notes}
                    </Text>
                  </Animated.View>
                )}

                {(() => {
                  const featuredItems = getVendorFeaturedItems(vendor.id);
                  if (featuredItems.length === 0) return null;

                  const displayItems = index === currentBoothIndex 
                    ? featuredItems.slice(currentProductIndex, currentProductIndex + 2)
                    : featuredItems.slice(0, 2);

                  return (
                    <View style={styles.featuredItemsSection}>
                      <View style={styles.featuredItemsHeader}>
                        <ShoppingBag size={18} color={Colors.nautical.teal} strokeWidth={2} />
                        <Text style={styles.featuredItemsTitle}>Featured on the Table</Text>
                        {featuredItems.length > 2 && (
                          <Text style={styles.featuredItemsCount}>({currentProductIndex + 1}-{Math.min(currentProductIndex + 2, featuredItems.length)} of {featuredItems.length})</Text>
                        )}
                      </View>
                      <View style={styles.featuredItemsGrid}>
                        {displayItems.map((item) => {
                          const itemKey = `${vendor.id}-${item.id}`;
                          const fadeAnim = itemFadeAnims[itemKey] || new Animated.Value(0);
                          const slideAnim = itemSlideAnims[itemKey] || new Animated.Value(50);

                          return (
                            <Animated.View
                              key={item.id}
                              style={[
                                styles.featuredItem,
                                {
                                  opacity: fadeAnim,
                                  transform: [{ translateY: slideAnim }],
                                },
                              ]}
                            >
                              <TouchableOpacity
                                onPress={() => handleProductPress(item)}
                                activeOpacity={0.8}
                              >
                                <Image
                                  source={{ uri: item.image }}
                                  style={styles.featuredItemImage}
                                  contentFit="cover"
                                />
                                <View style={styles.featuredItemInfo}>
                                  <Text style={styles.featuredItemName} numberOfLines={2}>
                                    {item.name}
                                  </Text>
                                  <Text style={styles.featuredItemPrice}>${item.price}</Text>
                                </View>
                              </TouchableOpacity>
                            </Animated.View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.boothActions}>
                  <TouchableOpacity
                    style={styles.boothActionMain}
                    onPress={() => handleWatchLive(vendor)}
                    activeOpacity={0.8}
                  >
                    <Play size={20} color={Colors.white} fill={Colors.white} />
                    <Text style={styles.boothActionMainText}>Watch Live</Text>
                    <ExternalLink size={16} color={Colors.white} />
                  </TouchableOpacity>

                  <View style={styles.boothActionRow}>
                    <TouchableOpacity
                      style={styles.boothActionSecondary}
                      onPress={() => handleViewShop(vendor.id)}
                      activeOpacity={0.8}
                    >
                      <Store size={20} color={Colors.nautical.teal} />
                      <Text style={styles.boothActionSecondaryText}>Shop</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.boothActionSecondary}
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={20} color={Colors.nautical.teal} />
                      <Text style={styles.boothActionSecondaryText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.boothActionSecondary}
                      activeOpacity={0.8}
                    >
                      <Heart size={20} color={Colors.light.sunsetCoral} />
                      <Text style={styles.boothActionSecondaryText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        <View style={styles.boothNavigation}>
          <TouchableOpacity
            style={[
              styles.boothNavButton,
              currentBoothIndex === 0 && styles.boothNavButtonDisabled,
            ]}
            onPress={handlePrevBooth}
            disabled={currentBoothIndex === 0}
          >
            <ChevronLeft 
              size={24} 
              color={currentBoothIndex === 0 ? Colors.light.muted : Colors.white} 
            />
            <Text style={[
              styles.boothNavButtonText,
              currentBoothIndex === 0 && styles.boothNavButtonTextDisabled,
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.boothThumbnails}
          >
            {filteredVendors.map((vendor, index) => (
              <TouchableOpacity
                key={vendor.id}
                style={[
                  styles.boothThumbnail,
                  currentBoothIndex === index && styles.boothThumbnailActive,
                ]}
                onPress={() => {
                  setCurrentBoothIndex(index);
                  scrollViewRef.current?.scrollTo({
                    x: index * BOOTH_WIDTH,
                    animated: true,
                  });
                }}
              >
                <Image
                  source={{ uri: vendor.logo_url || 'https://via.placeholder.com/60' }}
                  style={styles.boothThumbnailImage}
                  contentFit="cover"
                />
                {currentBoothIndex === index && (
                  <View style={styles.boothThumbnailDot} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.boothNavButton,
              currentBoothIndex === filteredVendors.length - 1 && styles.boothNavButtonDisabled,
            ]}
            onPress={handleNextBooth}
            disabled={currentBoothIndex === filteredVendors.length - 1}
          >
            <Text style={[
              styles.boothNavButtonText,
              currentBoothIndex === filteredVendors.length - 1 && styles.boothNavButtonTextDisabled,
            ]}>
              Next
            </Text>
            <ChevronRight 
              size={24} 
              color={currentBoothIndex === filteredVendors.length - 1 ? Colors.light.muted : Colors.white} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
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
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ChevronLeft size={28} color={Colors.white} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.liveIndicatorHeader}>
                <Animated.View 
                  style={[
                    styles.liveIndicatorDot,
                    { opacity: glowOpacity }
                  ]}
                />
                <Video size={28} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.headerTitle}>Live Vendor Fair</Text>
              <Text style={styles.headerSubtitle}>
                {filteredVendors.length} vendor{filteredVendors.length === 1 ? '' : 's'} live
              </Text>
            </View>

            <View style={styles.viewModeButtons}>
              <TouchableOpacity 
                style={styles.viewModeButton}
                onPress={() => router.push('/walk-the-fair')}
              >
                <Sparkles size={22} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewModeButton}
                onPress={() => setViewMode(viewMode === 'map' ? 'walkthrough' : 'map')}
              >
                {viewMode === 'map' ? (
                  <Play size={24} color={Colors.white} />
                ) : (
                  <Map size={24} color={Colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {(['all', 'youtube', 'instagram', 'facebook', 'tiktok'] as FilterType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterButton,
                    filter === f && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === f && styles.filterButtonTextActive,
                    ]}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>Setting up the fair...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to load vendors</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredVendors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Video size={64} color={Colors.white} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' 
                ? 'No vendors are live right now' 
                : `No ${filter} live streams`}
            </Text>
            <Text style={styles.emptyText}>
              Check back soon for the next live event!
            </Text>
          </View>
        ) : (
          viewMode === 'map' ? renderMapView() : renderWalkthroughView()
        )}
      </LinearGradient>

      <Modal
        visible={selectedProduct !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedProduct(null)}
              activeOpacity={0.8}
            >
              <X size={24} color={Colors.light.charcoal} />
            </TouchableOpacity>

            {selectedProduct && (
              <>
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.modalImage}
                  contentFit="cover"
                />
                <View style={styles.modalInfo}>
                  <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.modalProductPrice}>${selectedProduct.price}</Text>
                  <Text style={styles.modalProductDescription} numberOfLines={3}>
                    {selectedProduct.description}
                  </Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalActionFull}
                      onPress={() => {
                        setSelectedProduct(null);
                        router.push(`/product/${selectedProduct.id}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalActionFullText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalActionOutline}
                      onPress={() => {
                        setSelectedProduct(null);
                        router.push(`/vendor/${selectedProduct.vendorId}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <Store size={18} color={Colors.nautical.teal} />
                      <Text style={styles.modalActionOutlineText}>Visit Booth</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  liveIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  liveIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center' as const,
  },
  viewModeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginTop: 12,
  },
  filterScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonActive: {
    backgroundColor: Colors.white,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterButtonTextActive: {
    color: Colors.nautical.teal,
  },
  
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  mapHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 12,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  boothGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  mapBoothCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBoothGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.sunsetCoral,
    opacity: 0.1,
  },
  mapBoothBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  mapBoothDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  mapBoothBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  mapBoothImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.border,
    marginBottom: 12,
  },
  mapBoothBanner: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  mapBoothName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  mapBoothNumber: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mapBoothNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  
  walkthroughContainer: {
    flex: 1,
  },
  walkthroughHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  walkthroughHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  walkthroughInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  walkControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkthroughText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  walkthroughVendorName: {
    fontWeight: '700' as const,
    color: Colors.white,
  },
  walkthroughCounter: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  walkModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  walkModeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  walkthroughScroll: {
    gap: 20,
    paddingHorizontal: 20,
  },
  boothCard: {
    width: BOOTH_WIDTH,
    marginTop: 20,
  },
  woodPlankFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#8B7355',
    borderTopWidth: 3,
    borderTopColor: '#6B5645',
  },
  plankLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#6B5645',
  },
  wavesBackground: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  boothGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 200,
    backgroundColor: Colors.light.sunsetCoral,
    opacity: 0.15,
    borderRadius: 100,
  },
  boothContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  stringLights: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  lightBulb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FCD34D',
  },
  boothHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  boothLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.border,
    marginRight: 16,
    borderWidth: 3,
    borderColor: Colors.nautical.teal,
  },
  boothHeaderInfo: {
    flex: 1,
  },
  boothVendorName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  boothLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boothLocationText: {
    fontSize: 15,
    color: Colors.light.muted,
  },
  boothLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  boothLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  boothLiveText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  boothBanner: {
    backgroundColor: Colors.nautical.sandLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.sunsetCoral,
  },
  boothBannerText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  featuredItemsSection: {
    marginBottom: 16,
  },
  featuredItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  featuredItemsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    flex: 1,
  },
  featuredItemsCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  featuredItemsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  featuredItemImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.light.border,
  },
  featuredItemInfo: {
    padding: 10,
  },
  featuredItemName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
    height: 34,
  },
  featuredItemPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  boothActions: {
    gap: 12,
  },
  boothActionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 16,
  },
  boothActionMainText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  boothActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boothActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  boothActionSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  boothNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  boothNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  boothNavButtonDisabled: {
    opacity: 0.4,
  },
  boothNavButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  boothNavButtonTextDisabled: {
    color: Colors.light.muted,
  },
  boothThumbnails: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  boothThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  boothThumbnailActive: {
    borderColor: Colors.white,
    borderWidth: 3,
  },
  boothThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  boothThumbnailDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.white,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalImage: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.light.border,
  },
  modalInfo: {
    padding: 24,
  },
  modalProductName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalProductPrice: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 12,
  },
  modalProductDescription: {
    fontSize: 15,
    color: Colors.light.muted,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    gap: 10,
  },
  modalActionFull: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalActionFullText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  modalActionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  modalActionOutlineText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
});
