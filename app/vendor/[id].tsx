import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, MessageCircle, Heart, Play, Send, Zap, Package, ChevronDown, ChevronUp, ExternalLink, ShoppingBag, Facebook, Instagram, Twitter, Youtube, Share2 } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import ArrangePickupModal from '@/app/components/ArrangePickupModal';
import VendorShoutoutsSection from '@/app/components/VendorShoutoutsSection';
import { useFavorites } from '@app/contexts/FavoritesContext';
import Colors from '@/app/constants/colors';
import { products } from '@/mocks/products';
import { vendors } from '@/mocks/vendors';
import { logAnalyticsEvent } from '@/mocks/analytics';
import { ShippingDisplay } from '@/app/components/ShippingDisplay';

const { width } = Dimensions.get('window');
const numColumns = 3;
const cardWidth = (width - 80) / numColumns;

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendor = vendors.find(v => v.id === id);
  const vendorProducts = products.filter(p => p.vendorId === id);
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite: toggleFavoriteVendor } = useFavorites();
  const [chatMessage, setChatMessage] = useState('');
  const [showPickupDetails, setShowPickupDetails] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const lanternGlow = useRef(new Animated.Value(0)).current;

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

    if (vendor?.isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lanternGlow, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(lanternGlow, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fadeAnim, slideAnim, lanternGlow, vendor?.isLive]);

  if (!vendor) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Vendor not found</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  const handleChatWithVendor = () => {
    router.push(`/chat/${vendor.id}` as any);
  };

  const toggleFavorite = async () => {
    if (vendor) {
      await toggleFavoriteVendor(vendor.id, vendor.name);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  const handleEtsyShopClick = () => {
    if (vendor.etsyShopUrl) {
      logAnalyticsEvent({
        type: 'etsy_outbound_click',
        vendor_id: vendor.id,
        url: vendor.etsyShopUrl,
        timestamp: new Date().toISOString(),
      });
      Linking.openURL(vendor.etsyShopUrl);
    }
  };

  const handleEtsyListingClick = (url: string) => {
    logAnalyticsEvent({
      type: 'etsy_listing_click',
      vendor_id: vendor.id,
      url,
      timestamp: new Date().toISOString(),
    });
    Linking.openURL(url);
  };

  const isEtsyEnabled = vendor.etsyBadgeEnabled && vendor.etsyShopUrl;

  const lanternOpacity = lanternGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.backgroundWrapper}>
        <View style={styles.backgroundLayer} />
        {vendor.brandColor && (
          <LinearGradient
            colors={[vendor.brandColor + '15', 'transparent', 'transparent']}
            style={styles.brandGradient}
          />
        )}
        
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={[styles.safeAreaTop, { paddingTop: insets.top }]}>
            <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, isFavorite(id || '') && styles.favoriteActive]} 
              onPress={toggleFavorite}
            >
              <Heart 
                size={24} 
                color={isFavorite(id || '') ? Colors.light.terracotta : Colors.light.text}
                fill={isFavorite(id || '') ? Colors.light.terracotta : 'transparent'}
              />
            </TouchableOpacity>
            </View>
          </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.tentTop}>
            <View style={styles.tentFlapLeft} />
            <View style={styles.tentFlapRight} />
          </View>

          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: vendor.coverImage }}
              style={styles.bannerImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)', 'transparent']}
              style={styles.bannerGradient}
            />
            <View style={styles.bannerSign}>
              <Text style={styles.bannerText}>{vendor.name}</Text>
              <View style={styles.ropeLeft} />
              <View style={styles.ropeRight} />
            </View>
            {vendor.isLive && (
              <Animated.View style={[styles.liveLantern, { opacity: lanternOpacity }]}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  style={styles.lanternGradient2}
                >
                  <View style={styles.lanternHook} />
                  <View style={styles.lanternBody}>
                    <Zap size={16} color="#FFF" fill="#FFF" />
                  </View>
                  <View style={styles.liveLabel}>
                    <Text style={styles.liveLabelText}>LIVE</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          <Animated.View 
            style={[
              styles.content,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {vendor.isLive && vendor.liveVideoUrl ? (
              <View style={styles.liveVideoSection}>
                <View style={styles.liveHeader}>
                  <LinearGradient
                    colors={['#FF4444', '#CC0000']}
                    style={styles.liveBadge2}
                  >
                    <View style={styles.livePulse2} />
                    <Text style={styles.liveText2}>LIVE NOW</Text>
                  </LinearGradient>
                  <Text style={styles.liveViewers}>234 watching</Text>
                </View>
                <View style={styles.videoContainer}>
                  <View style={styles.videoPlaceholder}>
                    <Play size={48} color="#FFF" fill="#FFF" />
                    <Text style={styles.videoPlaceholderText}>Tap to watch live stream</Text>
                  </View>
                </View>
                <View style={styles.liveChatSection}>
                  <View style={styles.chatHeader}>
                    <MessageCircle size={18} color={Colors.nautical.oceanDeep} />
                    <Text style={styles.chatHeaderText}>Live Chat</Text>
                  </View>
                  <View style={styles.chatMessages}>
                    <Text style={styles.chatMessage}>👋 Welcome to the live booth!</Text>
                  </View>
                  <View style={styles.chatInputContainer}>
                    <TextInput
                      style={styles.chatInput}
                      placeholder="Say hello..."
                      placeholderTextColor={Colors.light.muted}
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      onSubmitEditing={handleSendMessage}
                    />
                    <TouchableOpacity
                      style={styles.chatSendButton}
                      onPress={handleSendMessage}
                    >
                      <LinearGradient
                        colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                        style={styles.chatSendGradient}
                      >
                        <Send size={18} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.welcomeSection}>
                <View style={styles.welcomeImageContainer}>
                  <Image
                    source={{ uri: vendor.videoUrl || vendor.avatar }}
                    style={styles.welcomeImage}
                    contentFit="cover"
                  />
                  <View style={styles.playOverlay}>
                    <Play size={32} color="#FFF" fill="#FFF" />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.meetMakerSection}>
              <Text style={styles.meetMakerTitle}>Meet the Maker</Text>
              <View style={styles.makerCard}>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MapPin size={16} color={Colors.nautical.teal} />
                    <Text style={styles.metaText}>{vendor.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color={Colors.nautical.teal} />
                    <Text style={styles.metaText}>Since {vendor.joinedDate}</Text>
                  </View>
                </View>
                <View style={styles.specialtyBadge}>
                  <Text style={styles.specialtyText}>{vendor.specialty}</Text>
                </View>
                <Text style={styles.bio}>{vendor.bio}</Text>
              </View>
            </View>

            <View style={styles.shelfSection}>
              <View style={styles.shelfHeader}>
                <Text style={styles.shelfTitle}>Shop the Collection</Text>
                <View style={styles.shelfDecor} />
              </View>
              
              <View style={styles.shelfContainer}>
                {vendorProducts.map((product, index) => (
                  <View key={product.id} style={styles.shelfWrapper}>
                    {index % numColumns === 0 && (
                      <View style={styles.woodPlank} />
                    )}
                    <TouchableOpacity
                      style={styles.shelfProduct}
                      onPress={() => router.push(`/product/${product.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.productShadow} />
                      <Image
                        source={{ uri: product.image }}
                        style={styles.shelfProductImage}
                        contentFit="cover"
                      />
                      <View style={styles.shelfProductInfo}>
                        <Text style={styles.shelfProductName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.shelfProductPrice}>${product.price}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {isEtsyEnabled && (
              <View style={styles.etsySection}>
                <View style={styles.etsySectionHeader}>
                  <ShoppingBag size={20} color={Colors.nautical.teal} />
                  <Text style={styles.etsySectionTitle}>Also on Etsy</Text>
                </View>

                <TouchableOpacity
                  style={styles.etsyShopButton}
                  onPress={handleEtsyShopClick}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F1641E', '#F56400']}
                    style={styles.etsyShopGradient}
                  >
                    <Text style={styles.etsyShopButtonText}>Visit our Etsy shop</Text>
                    <Image
                      source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Etsy_logo.svg' }}
                      style={styles.etsyLogo}
                      contentFit="contain"
                    />
                    <ExternalLink size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.etsyHelper}>
                  You&apos;ll complete your purchase on Etsy.
                </Text>

                {vendor.etsyShowcaseUrls && vendor.etsyShowcaseUrls.length > 0 && (
                  <View style={styles.etsyShowcaseContainer}>
                    <Text style={styles.etsyShowcaseTitle}>Featured Listings</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.etsyShowcaseScroll}
                      contentContainerStyle={styles.etsyShowcaseContent}
                    >
                      {vendor.etsyShowcaseUrls.map((url, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.etsyShowcaseTile}
                          onPress={() => handleEtsyListingClick(url)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.etsyShowcaseImagePlaceholder}>
                            <ShoppingBag size={32} color={Colors.nautical.teal} />
                          </View>
                          <View style={styles.etsyBadge}>
                            <Image
                              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Etsy_logo.svg' }}
                              style={styles.etsyBadgeLogo}
                              contentFit="contain"
                            />
                          </View>
                          <Text style={styles.etsyShowcaseText}>View on Etsy</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            <VendorShoutoutsSection vendorId={vendor.id} vendorName={vendor.name} />

            <View style={styles.shippingSection}>
              <ShippingDisplay
                settings={{
                  flatPerItem: 4.00,
                  flatPerOrder: 8.00,
                  freeShippingOver: 50,
                  allowLocalPickup: vendor.pickupAvailable || false,
                  pickupInstructions: vendor.pickupInstructions,
                  handlingTimeDays: 2,
                  deliveryMessage: 'Orders ship Mon–Fri. Tracking provided once shipped.',
                }}
                location={vendor.location}
                variant="detailed"
              />
            </View>

            {(vendor.facebookUrl || vendor.instagramUrl || vendor.tiktokUrl || vendor.twitterUrl || vendor.youtubeUrl || vendor.pinterestUrl || vendor.linkedinUrl) && (
              <View style={styles.socialMediaSection}>
                <View style={styles.socialMediaHeader}>
                  <Share2 size={20} color={Colors.nautical.teal} />
                  <Text style={styles.socialMediaTitle}>Follow Us</Text>
                </View>
                <View style={styles.socialMediaGrid}>
                  {vendor.facebookUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.facebookUrl!)}
                      activeOpacity={0.8}
                    >
                      <Facebook size={24} color="#1877F2" />
                      <Text style={styles.socialMediaLabel}>Facebook</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.instagramUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.instagramUrl!)}
                      activeOpacity={0.8}
                    >
                      <Instagram size={24} color="#E4405F" />
                      <Text style={styles.socialMediaLabel}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.tiktokUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.tiktokUrl!)}
                      activeOpacity={0.8}
                    >
                      <Play size={24} color="#000000" />
                      <Text style={styles.socialMediaLabel}>TikTok</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.twitterUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.twitterUrl!)}
                      activeOpacity={0.8}
                    >
                      <Twitter size={24} color="#1DA1F2" />
                      <Text style={styles.socialMediaLabel}>Twitter</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.youtubeUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.youtubeUrl!)}
                      activeOpacity={0.8}
                    >
                      <Youtube size={24} color="#FF0000" />
                      <Text style={styles.socialMediaLabel}>YouTube</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.pinterestUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.pinterestUrl!)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.pinterestIcon}>
                        <Text style={styles.pinterestIconText}>P</Text>
                      </View>
                      <Text style={styles.socialMediaLabel}>Pinterest</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.linkedinUrl && (
                    <TouchableOpacity
                      style={styles.socialMediaButton}
                      onPress={() => Linking.openURL(vendor.linkedinUrl!)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.linkedinIcon}>
                        <Text style={styles.linkedinIconText}>in</Text>
                      </View>
                      <Text style={styles.socialMediaLabel}>LinkedIn</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.actionButtonFull, 
                styles.primaryButton,
                vendor.brandColor && { backgroundColor: vendor.brandColor }
              ]} 
              onPress={handleChatWithVendor}
            >
              <MessageCircle size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Chat with Vendor</Text>
            </TouchableOpacity>

            {vendor.pickupAvailable && (
              <View style={styles.pickupDetailsSection}>
                <TouchableOpacity
                  style={styles.pickupDetailsHeader}
                  onPress={() => setShowPickupDetails(!showPickupDetails)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickupDetailsHeaderLeft}>
                    <Package size={20} color={Colors.nautical.teal} />
                    <Text style={styles.pickupDetailsTitle}>Local Pickup Available</Text>
                  </View>
                  {showPickupDetails ? (
                    <ChevronUp size={20} color={Colors.nautical.oceanDeep} />
                  ) : (
                    <ChevronDown size={20} color={Colors.nautical.oceanDeep} />
                  )}
                </TouchableOpacity>

                {showPickupDetails && (
                  <View style={styles.pickupDetailsContent}>
                    {vendor.pickupInstructions && (
                      <Text style={styles.pickupInstructionsText}>
                        {vendor.pickupInstructions}
                      </Text>
                    )}
                    
                    <View style={styles.pickupLocationContainer}>
                      <MapPin size={16} color={Colors.nautical.teal} />
                      <Text style={styles.pickupLocationText}>{vendor.location}</Text>
                      {vendor.zipCode && (
                        <Text style={styles.pickupZipText}>• {vendor.zipCode}</Text>
                      )}
                    </View>

                    {vendor.pickupSchedulerUrl && (
                      <TouchableOpacity
                        style={styles.schedulePickupButton}
                        onPress={() => {
                          if (vendor.pickupSchedulerUrl) {
                            Linking.openURL(vendor.pickupSchedulerUrl);
                          }
                        }}
                      >
                        <LinearGradient
                          colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                          style={styles.schedulePickupGradient}
                        >
                          <Calendar size={18} color="#FFF" />
                          <Text style={styles.schedulePickupText}>Schedule Pickup Time</Text>
                          <ExternalLink size={14} color="#FFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.footerSpace} />
          </Animated.View>
        </ScrollView>
        </Animated.View>
      </View>

      <ArrangePickupModal
        visible={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        vendor={vendor}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    position: 'relative' as const,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.nautical.sandLight,
  },
  brandGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeAreaTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteActive: {
    backgroundColor: '#FFE8E5',
  },
  scroll: {
    flex: 1,
  },
  tentTop: {
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tentFlapLeft: {
    width: 0,
    height: 0,
    borderLeftWidth: width / 2,
    borderRightWidth: 0,
    borderTopWidth: 30,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.nautical.driftwood,
  },
  tentFlapRight: {
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: width / 2,
    borderTopWidth: 30,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.nautical.driftwood,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    position: 'relative' as const,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerSign: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -width * 0.35 }, { translateY: -40 }],
    width: width * 0.7,
    height: 80,
    backgroundColor: Colors.nautical.driftwood,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6B5A4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerText: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ropeLeft: {
    position: 'absolute' as const,
    top: -20,
    left: 20,
    width: 3,
    height: 20,
    backgroundColor: '#8B7355',
  },
  ropeRight: {
    position: 'absolute' as const,
    top: -20,
    right: 20,
    width: 3,
    height: 20,
    backgroundColor: '#8B7355',
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeImageContainer: {
    width: width - 40,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetMakerSection: {
    marginBottom: 24,
  },
  meetMakerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 16,
    textAlign: 'center',
  },
  makerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.nautical.teal,
    fontWeight: '600' as const,
  },
  specialtyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.nautical.oceanFoam,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.text,
    textAlign: 'center',
  },
  actionButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: Colors.nautical.teal,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },

  arrangePickupButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  arrangePickupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  arrangePickupText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    letterSpacing: 0.3,
  },
  shelfSection: {
    marginTop: 8,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shelfTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  shelfDecor: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.nautical.sand,
    marginLeft: 12,
  },
  shelfContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  shelfWrapper: {
    width: cardWidth,
    marginBottom: 20,
    position: 'relative' as const,
  },
  woodPlank: {
    position: 'absolute' as const,
    bottom: -4,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: Colors.nautical.driftwood,
    zIndex: -1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 2,
  },
  shelfProduct: {
    alignItems: 'center',
    position: 'relative' as const,
  },
  productShadow: {
    position: 'absolute' as const,
    bottom: -8,
    width: cardWidth * 0.8,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 50,
  },
  shelfProductImage: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  shelfProductInfo: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  shelfProductName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  shelfProductPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  footerSpace: {
    height: 60,
  },
  etsySection: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F1641E20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  etsySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  etsySectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  etsyShopButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#F1641E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  etsyShopGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  etsyShopButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  etsyLogo: {
    width: 48,
    height: 20,
    tintColor: '#FFF',
  },
  etsyHelper: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  etsyShowcaseContainer: {
    marginTop: 8,
  },
  etsyShowcaseTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 12,
  },
  etsyShowcaseScroll: {
    marginHorizontal: -20,
  },
  etsyShowcaseContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  etsyShowcaseTile: {
    width: 120,
    alignItems: 'center',
  },
  etsyShowcaseImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F1641E30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative' as const,
  },
  etsyBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  etsyBadgeLogo: {
    width: 28,
    height: 12,
  },
  etsyShowcaseText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
  },
  pickupDetailsSection: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.nautical.oceanFoam,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  pickupDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.nautical.oceanFoam,
  },
  pickupDetailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickupDetailsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    flex: 1,
  },
  pickupDetailsContent: {
    padding: 16,
    gap: 16,
  },
  pickupInstructionsText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
  },
  pickupLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
  },
  pickupLocationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  pickupZipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  schedulePickupButton: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  schedulePickupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  schedulePickupText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
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
  liveLantern: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 40,
    height: 52,
    zIndex: 10,
  },
  lanternGradient2: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  lanternHook: {
    width: 3,
    height: 6,
    backgroundColor: '#8B4513',
    marginTop: 4,
  },
  lanternBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveLabel: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  liveLabelText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  liveVideoSection: {
    marginBottom: 24,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  liveBadge2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  livePulse2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  liveText2: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  liveViewers: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  videoContainer: {
    width: width - 40,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoPlaceholderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  liveChatSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  chatHeaderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  chatMessages: {
    minHeight: 100,
    marginBottom: 12,
    paddingVertical: 8,
  },
  chatMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.light.softGray,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.light.text,
  },
  chatSendButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chatSendGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialMediaSection: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.nautical.oceanFoam,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  socialMediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  socialMediaTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  socialMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialMediaButton: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  socialMediaLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  pinterestIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E60023',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinterestIconText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  linkedinIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinIconText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  shippingSection: {
    marginBottom: 24,
  },
});
