import { router } from 'expo-router';
import { Store, Users, ChevronRight, Tag } from 'lucide-react-native';
import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


import Colors from '@/constants/colors';
import { events } from '@/mocks/events';
import { featuredSections } from '@/constants/featuredSections';
import { getFeaturedSpotlights } from '@/mocks/vendorSpotlights';
import { vendors } from '@/mocks/vendors';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import HamburgerMenu from '@/components/HamburgerMenu';
import responsive from '@/constants/responsive';

interface FeatureBanner {
  id: string;
  type: 'live-event' | 'meet-maker' | 'seasonal';
  title: string;
  subtitle: string;
  image: string;
  action: () => void;
  actionLabel: string;
}

export default function HomeScreen() {
  const { isLoading, profile } = useCustomerAuth();
  const [currentBanner, setCurrentBanner] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const liveEvents = events.filter(event => event.status === 'live');
  const spotlights = getFeaturedSpotlights(3);
  const featuredVendors = vendors.slice(0, 4);

  const featureBanners: FeatureBanner[] = [
    ...(liveEvents.length > 0 ? liveEvents.map(event => ({
      id: `event-${event.id}`,
      type: 'live-event' as const,
      title: 'LIVE EVENT',
      subtitle: event.title,
      image: event.image,
      action: () => router.push('/walk-the-fair'),
      actionLabel: 'Enter Event',
    })) : []),
    ...spotlights.map(spotlight => ({
      id: `spotlight-${spotlight.id}`,
      type: 'meet-maker' as const,
      title: '✨ Meet the Maker',
      subtitle: spotlight.vendorName,
      image: spotlight.featuredImage,
      action: () => router.push(`/community/spotlight/${spotlight.id}`),
      actionLabel: 'Read Story',
    })),
    {
      id: 'seasonal',
      type: 'seasonal' as const,
      title: '🎄 Holiday Season',
      subtitle: 'Discover festive gifts & seasonal treasures',
      image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80',
      action: () => router.push('/(tabs)/shop'),
      actionLabel: 'Shop Now',
    },
  ];

  useEffect(() => {
    if (featureBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % featureBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featureBanners.length]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.nautical.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <HamburgerMenu />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source="https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2xy6wz02y7785e8tudlx0"
              style={styles.logo}
              contentFit="contain"
            />
            {profile ? (
              <Text style={styles.welcomeText}>Welcome back, {profile.name}! 👋</Text>
            ) : (
              <Text style={styles.welcomeText}>Welcome to Overboard Market! 🌊</Text>
            )}
            <Text style={styles.tagline}>Where small shops set sail</Text>
          </View>

          <View style={styles.content}>
            {featureBanners.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Now</Text>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                  )}
                  scrollEventThrottle={16}
                  style={styles.bannerScroll}
                >
                  {featureBanners.map((banner, index) => (
                    <TouchableOpacity
                      key={banner.id}
                      style={styles.featureBanner}
                      onPress={banner.action}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={banner.image}
                        style={styles.bannerImage}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.bannerOverlay}
                      >
                        <View style={styles.bannerContent}>
                          <Text style={styles.bannerTitle}>{banner.title}</Text>
                          <Text style={styles.bannerSubtitle} numberOfLines={2}>
                            {banner.subtitle}
                          </Text>
                          <View style={styles.bannerButton}>
                            <LinearGradient
                              colors={[Colors.light.sunsetCoral, Colors.light.terracottaDark]}
                              style={styles.bannerButtonGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              <Text style={styles.bannerButtonText}>{banner.actionLabel}</Text>
                              <ChevronRight size={18} color={Colors.white} />
                            </LinearGradient>
                          </View>
                        </View>
                      </LinearGradient>
                      {banner.type === 'live-event' && (
                        <View style={styles.liveBadge}>
                          <View style={styles.livePulse} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {featureBanners.length > 1 && (
                  <View style={styles.paginationDots}>
                    {featureBanners.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          index === currentBanner && styles.activeDot,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Areas</Text>
              <View style={styles.featuredGrid}>
                {featuredSections.slice(0, 3).map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={styles.areaCard}
                    onPress={() => router.push('/(tabs)/shop')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.areaEmoji}>{section.emoji}</Text>
                    <Text style={styles.areaTitle} numberOfLines={1}>
                      {section.title}
                    </Text>
                    <Text style={styles.areaDescription} numberOfLines={2}>
                      {section.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push('/sales')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.quickActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Tag size={28} color={Colors.white} strokeWidth={2.5} />
                  <Text style={[styles.quickActionText, styles.quickActionTextWhite]}>
                    Current Sales
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push('/(tabs)/vendors')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                  style={styles.quickActionGradient}
                >
                  <Users size={28} color={Colors.nautical.teal} strokeWidth={2.5} />
                  <Text style={styles.quickActionText}>Browse Vendors</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push('/(tabs)/shop')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.light.sunsetCoral, Colors.light.terracottaDark]}
                  style={styles.quickActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Store size={28} color={Colors.white} strokeWidth={2.5} />
                  <Text style={[styles.quickActionText, styles.quickActionTextWhite]}>
                    Shop Marketplace
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vendor Highlights</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/vendors')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See All →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vendorsScroll}
              >
                {featuredVendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={styles.vendorCard}
                    onPress={() => router.push(`/vendor/${vendor.id}`)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={vendor.avatar}
                      style={styles.vendorLogo}
                      contentFit="cover"
                    />
                    <View style={styles.vendorContent}>
                      <Text style={styles.vendorName} numberOfLines={1}>
                        {vendor.name}
                      </Text>
                      <Text style={styles.vendorCategory} numberOfLines={1}>
                        {vendor.specialty}
                      </Text>
                      <Text style={styles.vendorLocation} numberOfLines={1}>
                        📍 {vendor.location}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>



            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.push('/faq')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>FAQ & Support</Text>
              </TouchableOpacity>
              <Text style={styles.footerDivider}>•</Text>
              <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.push('/legal/customer-terms')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>Customer Terms</Text>
              </TouchableOpacity>
              <Text style={styles.footerDivider}>•</Text>
              <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.push('/legal/vendor-agreement')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>Vendor Agreement</Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.nautical.oceanDeep,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: responsive.containerPadding(),
    marginBottom: responsive.spacing.xl,
    marginTop: responsive.spacing.lg,
  },
  logo: {
    width: responsive.logoSize(),
    height: responsive.logoSize(),
    marginBottom: responsive.spacing.md,
  },
  welcomeText: {
    fontSize: responsive.fontSize.xl,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: responsive.spacing.xs,
  },
  tagline: {
    fontSize: responsive.fontSize.md,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  content: {
    gap: responsive.spacing['2xl'],
  },
  section: {
    paddingHorizontal: responsive.containerPadding(),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: responsive.fontSize.xl,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanFoam,
  },
  bannerScroll: {
    marginHorizontal: -responsive.containerPadding(),
  },
  featureBanner: {
    width: responsive.SCREEN_WIDTH - (responsive.containerPadding() * 2),
    height: responsive.bannerHeight(),
    marginHorizontal: responsive.containerPadding(),
    borderRadius: responsive.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerContent: {
    gap: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerSubtitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 26,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  bannerButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.sunsetCoral,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.sunsetCoral,
  },
  liveText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: Colors.white,
    width: 24,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsive.gridGap(),
    justifyContent: 'space-between',
  },
  areaCard: {
    width: responsive.getBreakpoint() === 'phone-small' 
      ? '100%' 
      : `${100 / 3 - 2}%`,
    backgroundColor: Colors.white,
    borderRadius: responsive.borderRadius.lg,
    padding: responsive.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  areaEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  areaTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    textAlign: 'center',
    marginBottom: 4,
  },
  areaDescription: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    textAlign: 'center',
    lineHeight: 15,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 64,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    lineHeight: 18,
    textAlign: 'center' as const,
    flex: 1,
  },
  quickActionTextWhite: {
    color: Colors.white,
  },
  vendorsScroll: {
    paddingRight: 20,
  },
  vendorCard: {
    width: responsive.getResponsiveValue({
      phoneSmall: 160,
      phone: 180,
      tablet: 200,
      desktop: 220,
      default: 180,
    }),
    backgroundColor: Colors.white,
    borderRadius: responsive.borderRadius.lg,
    overflow: 'hidden',
    marginRight: responsive.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  vendorLogo: {
    width: '100%',
    height: responsive.getResponsiveValue({
      phoneSmall: 100,
      phone: 120,
      tablet: 140,
      desktop: 160,
      default: 120,
    }),
    backgroundColor: Colors.nautical.sandLight,
  },
  vendorContent: {
    padding: 14,
    gap: 4,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  vendorCategory: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.nautical.teal,
  },
  vendorLocation: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.75)',
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
