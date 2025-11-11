import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Video as VideoIcon, 
  MapPin, 
  ChevronLeft, 
  Map,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Disc,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useVendorLive } from '@/app/contexts/VendorLiveContext';
import { products } from '@/mocks/products';

type WalkMode = 'auto' | 'manual';
type BoothStep = 'intro' | 'products' | 'transition';

const INTRO_DURATION = 2000;
const PRODUCT_PAIR_DURATION = 3000;
const TRANSITION_DURATION = 1000;
const MAX_FEATURED_PRODUCTS = 4;

export default function WalkTheFairPage() {
  const insets = useSafeAreaInsets();
  const { liveVendors, isLoading, error, recordClick } = useVendorLive();
  const [walkMode, setWalkMode] = useState<WalkMode>('manual');
  const [currentBoothIndex, setCurrentBoothIndex] = useState(0);
  const [boothStep, setBoothStep] = useState<BoothStep>('intro');
  const [currentProductPairIndex, setCurrentProductPairIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const productFadeAnim = useRef(new Animated.Value(0)).current;
  const lightAnim = useRef(new Animated.Value(0)).current;

  const vendors = useMemo(() => liveVendors, [liveVendors]);
  const currentVendor = vendors[currentBoothIndex];

  const getVendorFeaturedProducts = useCallback((vendorId: string) => {
    return products
      .filter(p => p.vendorId === vendorId && p.featured && p.inStock)
      .slice(0, MAX_FEATURED_PRODUCTS);
  }, []);

  const featuredProducts = useMemo(() => {
    if (!currentVendor) return [];
    return getVendorFeaturedProducts(currentVendor.id);
  }, [currentVendor, getVendorFeaturedProducts]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(lightAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(lightAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim, lightAnim]);

  const animateStepTransition = useCallback((callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      fadeAnim.setValue(1);
      productFadeAnim.setValue(1);
      slideAnim.setValue(0);
    });
  }, [fadeAnim, productFadeAnim, slideAnim]);

  const advanceToNextBooth = useCallback(() => {
    console.log('[WalkTheFair] Transitioning to next booth');
    setBoothStep('transition');
    
    setTimeout(() => {
      if (currentBoothIndex < vendors.length - 1) {
        animateStepTransition(() => {
          setCurrentBoothIndex(prev => prev + 1);
          setBoothStep('intro');
          setCurrentProductPairIndex(0);
        });
      } else {
        console.log('[WalkTheFair] Reached end of fair');
        setWalkMode('manual');
        setIsPaused(true);
      }
    }, TRANSITION_DURATION);
  }, [currentBoothIndex, vendors.length, animateStepTransition]);

  const advanceToPreviousBooth = useCallback(() => {
    console.log('[WalkTheFair] Going to previous booth');
    if (currentBoothIndex > 0) {
      animateStepTransition(() => {
        setCurrentBoothIndex(prev => prev - 1);
        setBoothStep('intro');
        setCurrentProductPairIndex(0);
      });
    }
  }, [currentBoothIndex, animateStepTransition]);

  const nextBooth = useCallback(() => {
    console.log('[WalkTheFair] Manual next booth');
    advanceToNextBooth();
  }, [advanceToNextBooth]);

  useEffect(() => {
    if (walkMode !== 'auto' || isPaused) {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      return;
    }

    console.log('[WalkTheFair] Auto mode - Step:', boothStep, 'ProductPair:', currentProductPairIndex);

    if (boothStep === 'intro') {
      console.log('[WalkTheFair] Step 1: Vendor Intro -', INTRO_DURATION, 'ms');
      stepTimerRef.current = setTimeout(() => {
        if (featuredProducts.length > 0) {
          setBoothStep('products');
          setCurrentProductPairIndex(0);
        } else {
          advanceToNextBooth();
        }
      }, INTRO_DURATION);
    } else if (boothStep === 'products') {
      const totalProducts = featuredProducts.length;
      const totalPairs = Math.ceil(totalProducts / 2);
      const currentPair = Math.floor(currentProductPairIndex / 2);
      
      console.log('[WalkTheFair] Step 2: Product Showcase - Pair', currentPair + 1, 'of', totalPairs);
      
      if (currentPair < totalPairs - 1) {
        stepTimerRef.current = setTimeout(() => {
          setCurrentProductPairIndex(prev => prev + 2);
        }, PRODUCT_PAIR_DURATION);
      } else {
        stepTimerRef.current = setTimeout(() => {
          advanceToNextBooth();
        }, PRODUCT_PAIR_DURATION);
      }
    }

    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, [
    walkMode,
    isPaused,
    boothStep,
    currentProductPairIndex,
    featuredProducts.length,
    advanceToNextBooth,
  ]);

  const handleWatchLive = async (vendor: typeof vendors[0]) => {
    try {
      await recordClick(vendor.id);
      await Linking.openURL(vendor.live_url);
    } catch (err) {
      console.error('[WalkTheFair] Error opening live URL:', err);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/live');
    }
  };

  const toggleAutoWalk = () => {
    if (walkMode === 'auto' && !isPaused) {
      console.log('[WalkTheFair] Pausing walk');
      setIsPaused(true);
    } else {
      console.log('[WalkTheFair] Starting/resuming auto walk');
      setWalkMode('auto');
      setIsPaused(false);
    }
  };

  const handleMapView = () => {
    router.push('/live');
  };

  const jumpToBooth = (index: number) => {
    console.log('[WalkTheFair] Jumping to booth', index + 1);
    animateStepTransition(() => {
      setCurrentBoothIndex(index);
      setBoothStep('intro');
      setCurrentProductPairIndex(0);
      setIsPaused(false);
    });
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[Colors.nautical.oceanDeep, Colors.nautical.teal]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>Setting up the fair...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error || vendors.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[Colors.nautical.oceanDeep, Colors.nautical.teal]}
          style={styles.gradient}
        >
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ChevronLeft size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <VideoIcon size={64} color={Colors.white} strokeWidth={1.5} />
            <Text style={styles.errorTitle}>
              {error ? 'Unable to load fair' : 'No vendors are live right now'}
            </Text>
            <Text style={styles.errorText}>
              {error || 'Check back soon for the next live event!'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const displayProducts = featuredProducts.slice(
    currentProductPairIndex,
    Math.min(currentProductPairIndex + 2, featuredProducts.length)
  );

  const isAutoWalking = walkMode === 'auto' && !isPaused;

  const lightOpacity1 = lightAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.4, 0.9, 0.4, 0.9],
  });

  const lightOpacity2 = lightAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.9, 0.4, 0.9, 0.4],
  });

  const lightOpacity3 = lightAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.6, 0.8, 0.5, 0.9],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#1a1410', '#2d2318', '#3a2f20']}
          style={styles.gradient}
        >
          <View style={styles.woodenFloorOverlay} />
          
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.iconButton} onPress={handleGoBack}>
                <ChevronLeft size={22} color={Colors.white} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={handleMapView}>
                <Map size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.contentContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {currentVendor && (
              <View style={styles.boothScene}>
              <View style={styles.stringLightsContainer}>
                {[...Array(8)].map((_, i) => (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.stringLight,
                      { 
                        opacity: i % 3 === 0 ? lightOpacity1 : i % 3 === 1 ? lightOpacity2 : lightOpacity3,
                        left: `${(100 / 9) * (i + 1)}%`,
                      }
                    ]}
                  />
                ))}
              </View>

              {boothStep === 'intro' ? (
                <View style={styles.introContainer}>
                  <View style={styles.woodenSign}>
                    <View style={styles.woodenSignTop} />
                    <LinearGradient
                      colors={['#8B6F47', '#6B563D', '#4A3F2F']}
                      style={styles.woodenSignBody}
                    >
                      <Text style={styles.woodenSignText}>{currentVendor.vendor_name}</Text>
                      {currentVendor.state && (
                        <View style={styles.signLocation}>
                          <MapPin size={16} color="#E5D4B8" />
                          <Text style={styles.signLocationText}>{currentVendor.state}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>

                  {currentVendor.live_url && (
                    <View style={styles.liveSection}>
                      <Animated.View style={[styles.livePulse, { opacity: glowOpacity }]} />
                      <TouchableOpacity
                        style={styles.liveVideoCard}
                        onPress={() => handleWatchLive(currentVendor)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: currentVendor.logo_url || 'https://via.placeholder.com/400' }}
                          style={styles.liveVideo}
                          contentFit="cover"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                          style={styles.liveOverlay}
                        >
                          <View style={styles.livePlayButton}>
                            <Play size={28} color="#fff" fill="#fff" />
                          </View>
                        </LinearGradient>
                        <View style={styles.liveBadgeSmall}>
                          <Animated.View style={[styles.liveDotSmall, { opacity: glowOpacity }]} />
                          <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {currentVendor.session_notes && (
                    <View style={styles.notesCard}>
                      <Text style={styles.notesText} numberOfLines={2}>
                        {currentVendor.session_notes}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.productsContainer}>
                  <View style={styles.tableTop}>
                    <LinearGradient
                      colors={['#8B7355', '#6B5D4F']}
                      style={styles.tableGradient}
                    />
                    
                    {displayProducts.length > 0 ? (
                      <View style={styles.productsDisplay}>
                        {displayProducts.map((product, idx) => (
                          <Animated.View
                            key={product.id}
                            style={[
                              styles.productDisplay,
                              { opacity: productFadeAnim }
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.productCardNew}
                              onPress={() => {
                                setWalkMode('manual');
                                setIsPaused(true);
                                router.push(`/product/${product.id}`);
                              }}
                              activeOpacity={0.85}
                            >
                              <View style={styles.productImageContainer}>
                                <Image
                                  source={{ uri: product.image }}
                                  style={styles.productImageNew}
                                  contentFit="cover"
                                />
                              </View>
                              <View style={styles.productDetails}>
                                <Text style={styles.productNameNew} numberOfLines={2}>
                                  {product.name}
                                </Text>
                                <Text style={styles.productPriceNew}>${product.price}</Text>
                                <View style={styles.viewButton}>
                                  <Text style={styles.viewButtonText}>View Item</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Animated.View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noProducts}>
                        <Disc size={40} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.noProductsTextNew}>No items on display</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              </View>
            )}

          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>
              {boothStep === 'intro' 
                ? `Visiting ${currentVendor?.vendor_name}` 
                : `Viewing items at ${currentVendor?.vendor_name}`
              } — Booth {currentBoothIndex + 1} of {vendors.length}
            </Text>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                currentBoothIndex === 0 && styles.navBtnDisabled,
              ]}
              onPress={advanceToPreviousBooth}
              disabled={currentBoothIndex === 0}
            >
              <ArrowLeft 
                size={20} 
                color={currentBoothIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} 
              />
              <Text style={[
                styles.navBtnText,
                currentBoothIndex === 0 && styles.navBtnTextDisabled,
              ]}>
                Previous Booth
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.autoWalkBtn}
              onPress={toggleAutoWalk}
            >
              {isAutoWalking ? (
                <Pause size={18} color="#fff" fill="#fff" />
              ) : (
                <Play size={18} color="#fff" fill="#fff" />
              )}
              <Text style={styles.autoWalkText}>
                {isAutoWalking ? 'Pause Walk' : 'Auto Walk'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navBtn,
                currentBoothIndex === vendors.length - 1 && styles.navBtnDisabled,
              ]}
              onPress={nextBooth}
              disabled={currentBoothIndex === vendors.length - 1}
            >
              <Text style={[
                styles.navBtnText,
                currentBoothIndex === vendors.length - 1 && styles.navBtnTextDisabled,
              ]}>
                Next Booth
              </Text>
              <ArrowRight 
                size={20} 
                color={currentBoothIndex === vendors.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.progressBar}>
            {vendors.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => jumpToBooth(index)}
                style={[
                  styles.progressDot,
                  index === currentBoothIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
      </View>
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
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 8,
  },
  walkControls: {
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
  walkModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  walkModeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  boothScene: {
    position: 'relative',
  },
  boothContent: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  stringLights: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  lightBulb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FCD34D',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  introSection: {
    gap: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vendorLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.border,
    borderWidth: 3,
    borderColor: Colors.nautical.teal,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  vendorLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorLocationText: {
    fontSize: 15,
    color: Colors.light.muted,
    fontWeight: '500' as const,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  liveText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  liveVideoEmbed: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light.border,
  },
  liveVideoThumbnail: {
    width: '100%',
    height: '100%',
  },
  liveVideoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveVideoPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveVideoInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  liveVideoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  sessionNotes: {
    backgroundColor: Colors.nautical.sandLight,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.nautical.teal,
  },
  sessionNotesText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  productsSection: {
    marginBottom: 20,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  productsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    flex: 1,
  },
  productsCounter: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  productsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  productCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.light.border,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 6,
    minHeight: 40,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
  },
  viewItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewItemText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  noProductsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed' as const,
  },
  noProductsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 6,
  },
  noProductsText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  boothActions: {
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryActionText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  transitionScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitionContent: {
    alignItems: 'center',
    gap: 16,
  },
  transitionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  navButtonTextDisabled: {
    color: Colors.light.muted,
  },
  navDotsScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  navDotActive: {
    backgroundColor: Colors.white,
    width: 28,
    borderRadius: 5,
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
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#1a1410',
  },
  woodenFloorOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stringLightsContainer: {
    position: 'absolute' as const,
    top: -20,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
  },
  stringLight: {
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  introContainer: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 40,
  },
  woodenSign: {
    width: '90%',
    alignItems: 'center',
  },
  woodenSignTop: {
    width: 4,
    height: 30,
    backgroundColor: '#4A3F2F',
    marginBottom: 8,
  },
  woodenSignBody: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#3a2f20',
  },
  woodenSignText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#E5D4B8',
    textAlign: 'center' as const,
    letterSpacing: 1,
  },
  signLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  signLocationText: {
    fontSize: 16,
    color: '#E5D4B8',
    fontWeight: '600' as const,
  },
  liveSection: {
    width: '90%',
    position: 'relative' as const,
  },
  livePulse: {
    position: 'absolute' as const,
    top: -10,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    zIndex: 5,
  },
  liveVideoCard: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  liveVideo: {
    width: '100%',
    height: '100%',
  },
  liveOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadgeSmall: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  notesCard: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 18,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  notesText: {
    fontSize: 15,
    color: '#E5D4B8',
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  productsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  tableTop: {
    width: '90%',
    minHeight: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tableGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  productsDisplay: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    flex: 1,
  },
  productDisplay: {
    flex: 1,
  },
  productCardNew: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  productImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  productImageNew: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    padding: 16,
  },
  productNameNew: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    minHeight: 44,
  },
  productPriceNew: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#047857',
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: '#047857',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  noProducts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  noProductsTextNew: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontStyle: 'italic' as const,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusBar: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#E5D4B8',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  navBtnTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  autoWalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#047857',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  autoWalkText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFD700',
    width: 24,
    height: 8,
    borderRadius: 4,
  },
});
