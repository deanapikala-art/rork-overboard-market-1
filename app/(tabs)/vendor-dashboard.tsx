import { router, Stack } from 'expo-router';
import {
  Camera,
  Edit,
  Eye,
  MessageSquare,
  Package,
  Palette,
  Save,
  Upload,
  Video,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  MapPin,
  CreditCard,
  CheckCircle,
  ShoppingBag,
  X,
  Send,
  Clock,
  Link as LinkIcon,
  Play,
  Pause,
  ExternalLink,
  AlertCircle,
  Share2,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Colors from '@/app/constants/colors';
import { events } from '@/mocks/events';
import HamburgerMenu from '@/app/components/HamburgerMenu';
import { useAuth } from '@/app/contexts/AuthContext';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'booth' | 'products' | 'theme' | 'events' | 'sales' | 'workshops' | 'settings' | 'billing';

interface BoothTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview: string;
}

const themes: BoothTheme[] = [
  {
    id: 'driftwood',
    name: 'Driftwood',
    colors: {
      primary: Colors.nautical.driftwood,
      secondary: Colors.nautical.sand,
      accent: Colors.nautical.oceanFoam,
    },
    preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
  },
  {
    id: 'sailcloth',
    name: 'Sailcloth',
    colors: {
      primary: Colors.white,
      secondary: Colors.nautical.teal,
      accent: Colors.nautical.mustard,
    },
    preview: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
  },
  {
    id: 'lantern',
    name: 'Lantern Light',
    colors: {
      primary: Colors.nautical.mustard,
      secondary: Colors.nautical.oceanDeep,
      accent: Colors.nautical.sandLight,
    },
    preview: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  },
  {
    id: 'coral',
    name: 'Coral Bay',
    colors: {
      primary: Colors.light.terracotta,
      secondary: Colors.nautical.tealLight,
      accent: Colors.nautical.sand,
    },
    preview: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
  },
];

interface ProductItem {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  inStock: boolean;
  vendorId: string;
  vendorName: string;
  category: string;
  description: string;
}

const PRODUCTS_STORAGE_KEY = '@overboard_vendor_products';

interface VendorEventParticipation {
  eventId: string;
  status: 'pending' | 'accepted' | 'rejected';
  liveSlotStart?: string;
  liveSlotEnd?: string;
  streamEmbedUrl?: string;
  liveStatus?: 'live' | 'break' | 'offline';
  boothNotes?: string;
  featuredProductIds?: string[];
  feeStatus?: 'unpaid' | 'pending' | 'paid' | 'waived';
}

export default function VendorDashboard() {
  const insets = useSafeAreaInsets();
  const { vendorSession } = useAuth();
  const { profile, onboardingComplete } = useVendorAuth();
  const [activeTab, setActiveTab] = useState<TabType>('booth');
  const [selectedTheme, setSelectedTheme] = useState('driftwood');
  const [savedTheme, setSavedTheme] = useState('driftwood');
  const [vendorBusinessName, setVendorBusinessName] = useState('Luna Ceramics');
  const [products, setProducts] = useState<ProductItem[]>([]);
  
  const currentVendorId = profile?.id || '1';

  useEffect(() => {
    if (profile && !onboardingComplete) {
      console.log('[VendorDashboard] Onboarding incomplete - redirecting to onboarding');
      router.replace('/vendor-onboarding');
    }
  }, [profile, onboardingComplete]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(`@overboard_vendor_theme_${currentVendorId}`);
        if (stored) {
          console.log('[VendorDashboard] Loaded theme:', stored);
          setSelectedTheme(stored);
          setSavedTheme(stored);
        }
      } catch (error) {
        console.error('[VendorDashboard] Error loading theme:', error);
      }
    };
    loadTheme();
  }, [currentVendorId]);

  useEffect(() => {
    const loadVendorName = async () => {
      try {
        const stored = await AsyncStorage.getItem('@overboard_vendor_onboarding');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && parsed.data?.booth?.businessName) {
              const name = parsed.data.booth.businessName;
              if (name && name.trim()) {
                setVendorBusinessName(name);
                console.log('[VendorDashboard] Loaded business name:', name);
                return;
              }
            }
          } catch (parseError) {
            console.error('[VendorDashboard] Failed to parse vendor data:', parseError);
            await AsyncStorage.removeItem('@overboard_vendor_onboarding');
          }
        }

        if (vendorSession?.businessName) {
          setVendorBusinessName(vendorSession.businessName);
          console.log('[VendorDashboard] Using session business name:', vendorSession.businessName);
        }
      } catch (error) {
        console.error('[VendorDashboard] Error loading vendor name:', error);
      }
    };
    
    loadVendorName();
  }, [vendorSession]);
  
  const [eventParticipations, setEventParticipations] = useState<VendorEventParticipation[]>([
    {
      eventId: '2',
      status: 'accepted',
      liveSlotStart: '2025-01-15T10:00:00',
      liveSlotEnd: '2025-01-15T12:00:00',
      streamEmbedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
      liveStatus: 'live',
      boothNotes: 'Please place near the entrance',
      featuredProductIds: ['1', '7'],
      feeStatus: 'paid',
    },
  ]);
  
  const [selectedEventProducts, setSelectedEventProducts] = useState<{ [eventId: string]: string[] }>({
    '2': ['1', '7'],
  });
  
  const myProducts = products.filter(p => p.vendorId === currentVendorId);

  const [boothData, setBoothData] = useState({
    bannerUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80',
    bio: 'Welcome to my handcrafted pottery booth! Each piece is uniquely made with love.',
    videoUrl: '',
  });

  const [settingsData, setSettingsData] = useState({
    ecommerce_url: '',
    paypal_link: '',
    venmo_handle: '',
    cashapp_handle: '',
    tax_rate_percent: 0,
    allow_alt_pay: true,
    pickup_available: false,
    pickup_instructions: '',
    pickup_scheduler_url: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    latitude: 0,
    longitude: 0,
    local_delivery: false,
    local_delivery_radius_miles: 10,
    local_delivery_fee: 0,
    terms_acknowledged: false,
    etsy_badge_enabled: false,
    etsy_shop_url: '',
    etsy_username: '',
    etsy_showcase_urls: ['', '', '', '', '', ''],
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    twitter_url: '',
    youtube_url: '',
    pinterest_url: '',
    linkedin_url: '',
  });

  const [etsyErrors, setEtsyErrors] = useState<{ [key: string]: string }>({});

  const marketplaceFeeAmount = '29.99';
  const marketplaceFeeType = 'monthly';
  const eventFeeAmount = '15.00';
  const paymentsProvider: 'stripe' | 'external' = 'stripe';
  const vendorBillingOverrideEventFeeAmount: number | null = null;
  const vendorCouponCode: string | null = null;
  const billingStatusMarketplace: 'active' | 'inactive' | 'pending' = 'inactive' as 'active' | 'inactive' | 'pending';
  const billingStatusEvents: 'active' | 'inactive' | 'pending' = 'active' as 'active' | 'inactive' | 'pending';
  const externalPaymentInstructions = 'Please send payment via bank transfer to account #12345. Email billing@overboardnorth.com with confirmation.';
  const marketplaceFeeAmountOverride: string | null = null;
  const marketplaceFeeTypeOverride: string | null = null;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('[VendorDashboard] Loading products from storage');
        const storedProducts = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (storedProducts) {
          try {
            const parsedProducts = JSON.parse(storedProducts);
            if (Array.isArray(parsedProducts)) {
              console.log('[VendorDashboard] Loaded', parsedProducts.length, 'products');
              setProducts(parsedProducts);
            } else {
              console.warn('[VendorDashboard] Invalid products data format, resetting');
              await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
              setProducts([]);
            }
          } catch (parseError) {
            console.error('[VendorDashboard] Failed to parse products data:', parseError);
            await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
            setProducts([]);
          }
        } else {
          console.log('[VendorDashboard] No products found in storage');
          setProducts([]);
        }
      } catch (error) {
        console.error('[VendorDashboard] Error loading products:', error);
      }
    };

    loadProducts();
    
    const interval = setInterval(loadProducts, 2000);
    return () => clearInterval(interval);
  }, []);

  const renderBoothTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booth Banner</Text>
        <View style={styles.bannerPreview}>
          <Image
            source={{ uri: boothData.bannerUrl }}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <View style={styles.bannerOverlay}>
            <TouchableOpacity style={styles.uploadButton}>
              <Upload size={20} color={Colors.white} />
              <Text style={styles.uploadButtonText}>Change Banner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Welcome Video</Text>
        <TouchableOpacity style={styles.videoUpload}>
          <Video size={32} color={Colors.light.muted} />
          <Text style={styles.videoUploadText}>Upload Welcome Video</Text>
          <Text style={styles.videoUploadSubtext}>Add a personal touch to your booth</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booth Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={boothData.bio}
          onChangeText={(text) => setBoothData({ ...boothData, bio: text })}
          multiline
          placeholder="Tell customers about your craft"
          placeholderTextColor={Colors.light.muted}
        />
      </View>

      <TouchableOpacity style={styles.saveButton}>
        <Save size={20} color={Colors.white} />
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderProductsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity 
        style={styles.addProductButton}
        onPress={() => {
          console.log('[VendorDashboard] Add new product pressed');
          router.push('/vendor-product-create');
        }}
        activeOpacity={0.8}
      >
        <Plus size={20} color={Colors.white} />
        <Text style={styles.addProductButtonText}>Add New Product</Text>
      </TouchableOpacity>

      <View style={styles.productsGrid}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image
              source={{ uri: product.image }}
              style={styles.productCardImage}
              contentFit="cover"
            />
            <View style={styles.productCardContent}>
              <Text style={styles.productCardName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productCardPrice}>${product.price}</Text>
              <View style={styles.productCardStock}>
                <Package size={12} color={Colors.light.muted} />
                <Text style={styles.productCardStockText}>{product.stock} in stock</Text>
              </View>
              <View style={styles.productCardActions}>
                <TouchableOpacity style={styles.productActionButton}>
                  <Edit size={16} color={Colors.light.terracotta} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.productActionButton}>
                  <Trash2 size={16} color={Colors.light.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderThemeTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.themeDescription}>
        Choose a nautical theme for your booth. This will customize the look and feel when
        customers visit.
      </Text>

      <View style={styles.themesGrid}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.themeCard,
              selectedTheme === theme.id && styles.themeCardSelected,
            ]}
            onPress={() => setSelectedTheme(theme.id)}
          >
            <Image
              source={{ uri: theme.preview }}
              style={styles.themePreview}
              contentFit="cover"
            />
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{theme.name}</Text>
              <View style={styles.themeColors}>
                <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.colorDot, { backgroundColor: theme.colors.secondary }]} />
                <View style={[styles.colorDot, { backgroundColor: theme.colors.accent }]} />
              </View>
            </View>
            {selectedTheme === theme.id && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[
          styles.saveButton,
          selectedTheme === savedTheme && styles.saveButtonDisabled
        ]}
        onPress={async () => {
          try {
            await AsyncStorage.setItem(`@overboard_vendor_theme_${currentVendorId}`, selectedTheme);
            setSavedTheme(selectedTheme);
            console.log('[VendorDashboard] Theme saved:', selectedTheme);
            alert('Theme applied successfully!');
          } catch (error) {
            console.error('[VendorDashboard] Error saving theme:', error);
            alert('Failed to save theme');
          }
        }}
        disabled={selectedTheme === savedTheme}
      >
        <Save size={20} color={Colors.white} />
        <Text style={styles.saveButtonText}>
          {selectedTheme === savedTheme ? 'Theme Applied' : 'Apply Theme'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderEventsTab = () => {
    const upcomingEvents = events.filter(e => e.status === 'upcoming');
    const acceptedEvents = events.filter(e => {
      const participation = eventParticipations.find(p => p.eventId === e.id && p.status === 'accepted');
      return participation !== undefined;
    });
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join an Event</Text>
          <Text style={styles.sectionDescription}>
            Request to participate in upcoming events and showcase your products to new customers.
          </Text>
          
          {upcomingEvents.map((event) => {
            const participation = eventParticipations.find(p => p.eventId === event.id);
            const hasRequested = participation !== undefined;
            
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Calendar size={20} color={Colors.nautical.teal} />
                  <Text style={styles.eventTitle}>{event.title}</Text>
                </View>
                <Text style={styles.eventDate}>{event.date} - {event.endDate}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <Text style={styles.eventVendorCount}>{event.vendorCount} vendors participating</Text>
                
                {hasRequested ? (
                  <View style={styles.requestStatusBadge}>
                    <Text style={styles.requestStatusText}>
                      {participation.status === 'accepted' ? '✓ Accepted' : 
                       participation.status === 'pending' ? '⏳ Request Pending' : 
                       '✗ Not Accepted'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.joinEventButton}
                    onPress={() => {
                      setEventParticipations([...eventParticipations, {
                        eventId: event.id,
                        status: 'pending',
                      }]);
                      console.log('Requested to join event:', event.id);
                    }}
                  >
                    <Send size={16} color={Colors.nautical.teal} />
                    <Text style={styles.joinEventButtonText}>Request to Join</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Lineup</Text>
          <Text style={styles.sectionDescription}>
            Manage your accepted event booths, live streams, and featured products.
          </Text>
          
          {acceptedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.light.muted} />
              <Text style={styles.emptyStateText}>No accepted events yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Request to join upcoming events above to get started.
              </Text>
            </View>
          ) : (
            acceptedEvents.map((event) => {
              const participation = eventParticipations.find(p => p.eventId === event.id)!;
              const isEventLive = event.status === 'live';
              const selectedProducts = selectedEventProducts[event.id] || [];
              
              return (
                <View key={event.id} style={styles.lineupCard}>
                  <View style={styles.lineupHeader}>
                    <Text style={styles.lineupEventTitle}>{event.title}</Text>
                    {isEventLive && (
                      <View style={styles.liveChip}>
                        <View style={styles.liveIndicator} />
                        <Text style={styles.liveChipText}>EVENT LIVE</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.lineupSection}>
                    <View style={styles.lineupSectionHeader}>
                      <DollarSign size={18} color={Colors.nautical.teal} />
                      <Text style={styles.lineupSectionTitle}>Event Fee</Text>
                    </View>
                    <View style={styles.eventFeePanel}>
                      <View style={styles.eventFeeHeader}>
                        <Text style={styles.eventFeeAmount}>
                          ${vendorBillingOverrideEventFeeAmount || eventFeeAmount}
                        </Text>
                        {vendorCouponCode && (
                          <View style={styles.couponBadge}>
                            <Text style={styles.couponBadgeText}>Coupon Applied</Text>
                          </View>
                        )}
                      </View>
                      
                      {!participation.feeStatus || participation.feeStatus === 'unpaid' ? (
                        <>
                          {paymentsProvider === 'stripe' ? (
                            <TouchableOpacity
                              style={styles.payEventFeeButton}
                              onPress={() => {
                                console.log('Opening Stripe checkout for event fee', event.id);
                                const updated = eventParticipations.map(p => 
                                  p.eventId === event.id ? {...p, feeStatus: 'paid' as const} : p
                                );
                                setEventParticipations(updated);
                              }}
                            >
                              <CreditCard size={18} color={Colors.white} />
                              <Text style={styles.payEventFeeButtonText}>Pay Event Fee</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.externalPaymentSection}>
                              <Text style={styles.instructionsText}>{externalPaymentInstructions}</Text>
                              <TouchableOpacity
                                style={styles.markPaidButton}
                                onPress={() => {
                                  console.log('Marking event fee as paid (pending admin review)', event.id);
                                  const updated = eventParticipations.map(p => 
                                    p.eventId === event.id ? {...p, feeStatus: 'pending' as const} : p
                                  );
                                  setEventParticipations(updated);
                                }}
                              >
                                <Text style={styles.markPaidButtonText}>
                                  I&apos;ve Paid (Pending Admin Review)
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      ) : participation.feeStatus === 'pending' ? (
                        <View style={styles.feeStatusPending}>
                          <AlertCircle size={18} color={Colors.nautical.mustard} />
                          <Text style={styles.feeStatusPendingText}>
                            Payment pending admin review
                          </Text>
                        </View>
                      ) : participation.feeStatus === 'paid' ? (
                        <View style={styles.feeStatusPaid}>
                          <CheckCircle size={18} color={Colors.nautical.teal} />
                          <Text style={styles.feeStatusPaidText}>Event fee paid</Text>
                        </View>
                      ) : (
                        <View style={styles.feeStatusWaived}>
                          <CheckCircle size={18} color={Colors.nautical.teal} />
                          <Text style={styles.feeStatusWaivedText}>Fee waived by admin</Text>
                        </View>
                      )}
                      
                      {(!participation.feeStatus || !['paid', 'waived'].includes(participation.feeStatus)) && isEventLive && (
                        <View style={styles.feeWarning}>
                          <AlertCircle size={14} color={Colors.light.terracotta} />
                          <Text style={styles.feeWarningText}>
                            You must pay the event fee to toggle live status
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.lineupSection}>
                    <View style={styles.lineupSectionHeader}>
                      <Clock size={18} color={Colors.nautical.teal} />
                      <Text style={styles.lineupSectionTitle}>Live Slot</Text>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TextInput
                        style={styles.input}
                        value={participation.liveSlotStart || ''}
                        onChangeText={(text) => {
                          const updated = eventParticipations.map(p => 
                            p.eventId === event.id ? {...p, liveSlotStart: text} : p
                          );
                          setEventParticipations(updated);
                        }}
                        placeholder="2025-01-15T10:00:00"
                        placeholderTextColor={Colors.light.muted}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TextInput
                        style={styles.input}
                        value={participation.liveSlotEnd || ''}
                        onChangeText={(text) => {
                          const updated = eventParticipations.map(p => 
                            p.eventId === event.id ? {...p, liveSlotEnd: text} : p
                          );
                          setEventParticipations(updated);
                        }}
                        placeholder="2025-01-15T12:00:00"
                        placeholderTextColor={Colors.light.muted}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.lineupSection}>
                    <View style={styles.lineupSectionHeader}>
                      <LinkIcon size={18} color={Colors.nautical.teal} />
                      <Text style={styles.lineupSectionTitle}>Stream Embed URL</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={participation.streamEmbedUrl || ''}
                      onChangeText={(text) => {
                        const updated = eventParticipations.map(p => 
                          p.eventId === event.id ? {...p, streamEmbedUrl: text} : p
                        );
                        setEventParticipations(updated);
                      }}
                      placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                      placeholderTextColor={Colors.light.muted}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                  
                  {isEventLive && (
                    <View style={styles.lineupSection}>
                      <View style={styles.lineupSectionHeader}>
                        <Play size={18} color={Colors.nautical.teal} />
                        <Text style={styles.lineupSectionTitle}>Live Status</Text>
                      </View>
                      
                      <View style={styles.liveStatusCard}>
                        <View style={styles.liveStatusHeader}>
                          <Text style={styles.liveStatusText}>
                            Status: {participation.liveStatus === 'live' ? 'LIVE' : 
                                    participation.liveStatus === 'break' ? 'On Break' : 
                                    'Offline'}
                          </Text>
                          {participation.liveStatus === 'live' && (
                            <View style={styles.liveIndicator} />
                          )}
                        </View>
                        
                        <View style={styles.liveStatusButtons}>
                          <TouchableOpacity 
                            style={[
                              styles.liveStatusButton,
                              participation.liveStatus === 'live' && styles.liveStatusButtonActive,
                              (!participation.feeStatus || !['paid', 'waived'].includes(participation.feeStatus)) && styles.liveStatusButtonDisabled
                            ]}
                            onPress={() => {
                              if (participation.feeStatus && ['paid', 'waived'].includes(participation.feeStatus)) {
                                const updated = eventParticipations.map(p => 
                                  p.eventId === event.id ? {...p, liveStatus: 'live' as const} : p
                                );
                                setEventParticipations(updated);
                              } else {
                                console.log('Cannot go live: event fee not paid');
                              }
                            }}
                            disabled={!participation.feeStatus || !['paid', 'waived'].includes(participation.feeStatus)}
                          >
                            <Play size={16} color={participation.liveStatus === 'live' ? Colors.white : Colors.nautical.teal} />
                            <Text style={[
                              styles.liveStatusButtonText,
                              participation.liveStatus === 'live' && styles.liveStatusButtonTextActive
                            ]}>Go Live</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[
                              styles.liveStatusButton,
                              participation.liveStatus === 'break' && styles.liveStatusButtonActive,
                              (!participation.feeStatus || !['paid', 'waived'].includes(participation.feeStatus)) && styles.liveStatusButtonDisabled
                            ]}
                            onPress={() => {
                              if (participation.feeStatus && ['paid', 'waived'].includes(participation.feeStatus)) {
                                const updated = eventParticipations.map(p => 
                                  p.eventId === event.id ? {...p, liveStatus: 'break' as const} : p
                                );
                                setEventParticipations(updated);
                              } else {
                                console.log('Cannot take break: event fee not paid');
                              }
                            }}
                            disabled={!participation.feeStatus || !['paid', 'waived'].includes(participation.feeStatus)}
                          >
                            <Pause size={16} color={participation.liveStatus === 'break' ? Colors.white : Colors.nautical.teal} />
                            <Text style={[
                              styles.liveStatusButtonText,
                              participation.liveStatus === 'break' && styles.liveStatusButtonTextActive
                            ]}>Take Break</Text>
                          </TouchableOpacity>
                        </View>
                        
                        {event.allowChat && (
                          <TouchableOpacity style={styles.chatLink}>
                            <ExternalLink size={16} color={Colors.nautical.teal} />
                            <Text style={styles.chatLinkText}>Open Event Chat</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.lineupSection}>
                    <View style={styles.lineupSectionHeader}>
                      <MapPin size={18} color={Colors.nautical.teal} />
                      <Text style={styles.lineupSectionTitle}>Booth Placement Notes</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={participation.boothNotes || ''}
                      onChangeText={(text) => {
                        const updated = eventParticipations.map(p => 
                          p.eventId === event.id ? {...p, boothNotes: text} : p
                        );
                        setEventParticipations(updated);
                      }}
                      multiline
                      placeholder="Any special requests for booth location?"
                      placeholderTextColor={Colors.light.muted}
                    />
                  </View>
                  
                  <View style={styles.lineupSection}>
                    <View style={styles.lineupSectionHeader}>
                      <Package size={18} color={Colors.nautical.teal} />
                      <Text style={styles.lineupSectionTitle}>Featured Products (up to 5)</Text>
                    </View>
                    <Text style={styles.inputSubtext}>
                      Select products to showcase during this event
                    </Text>
                    
                    <View style={styles.productSelector}>
                      {myProducts.slice(0, 8).map((product) => {
                        const isSelected = selectedProducts.includes(product.id);
                        const canSelect = selectedProducts.length < 5 || isSelected;
                        
                        return (
                          <TouchableOpacity
                            key={product.id}
                            style={[
                              styles.productSelectorItem,
                              isSelected && styles.productSelectorItemSelected,
                              !canSelect && styles.productSelectorItemDisabled,
                            ]}
                            onPress={() => {
                              if (isSelected) {
                                const updated = selectedProducts.filter(id => id !== product.id);
                                setSelectedEventProducts({...selectedEventProducts, [event.id]: updated});
                              } else if (canSelect) {
                                const updated = [...selectedProducts, product.id];
                                setSelectedEventProducts({...selectedEventProducts, [event.id]: updated});
                              }
                            }}
                            disabled={!canSelect && !isSelected}
                          >
                            <Image
                              source={{ uri: product.image }}
                              style={styles.productSelectorImage}
                              contentFit="cover"
                            />
                            {isSelected && (
                              <View style={styles.productSelectedBadge}>
                                <CheckCircle size={20} color={Colors.white} />
                              </View>
                            )}
                            <Text style={styles.productSelectorName} numberOfLines={1}>
                              {product.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.previewBoothButton}
                    onPress={() => router.push(`/events/${event.id}/booth/${currentVendorId}`)}
                  >
                    <Eye size={18} color={Colors.white} />
                    <Text style={styles.previewBoothButtonText}>Preview Event Booth</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.saveButton}>
                    <Save size={20} color={Colors.white} />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  };

  const renderBillingTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.billingCard}>
          <View style={styles.billingCardHeader}>
            <View style={styles.billingCardTitleRow}>
              <ShoppingBag size={24} color={Colors.nautical.teal} />
              <Text style={styles.billingCardTitle}>Marketplace Listing</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                billingStatusMarketplace === 'active' && styles.statusChipActive,
                billingStatusMarketplace === 'pending' && styles.statusChipPending,
                billingStatusMarketplace === 'inactive' && styles.statusChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  billingStatusMarketplace === 'active' && styles.statusChipTextActive,
                ]}
              >
                {billingStatusMarketplace === 'active'
                  ? '✓ Active'
                  : billingStatusMarketplace === 'pending'
                  ? '⏳ Pending'
                  : '● Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.billingCardBody}>
            <View style={styles.billingInfo}>
              <Text style={styles.billingAmount}>
                ${marketplaceFeeAmountOverride || marketplaceFeeAmount}
                <Text style={styles.billingRecurrence}>
                  {' '}/{marketplaceFeeTypeOverride || marketplaceFeeType}
                </Text>
              </Text>
              <Text style={styles.billingDescription}>
                Your booth listing in the marketplace
              </Text>
            </View>

            {billingStatusMarketplace !== 'active' && (
              <>
                {paymentsProvider === 'stripe' ? (
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() => {
                      console.log('Opening Stripe checkout for marketplace listing');
                    }}
                  >
                    <CreditCard size={18} color={Colors.white} />
                    <Text style={styles.activateButtonText}>Activate Marketplace Listing</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.externalPaymentSection}>
                    <View style={styles.instructionsBox}>
                      <AlertCircle size={20} color={Colors.nautical.teal} />
                      <Text style={styles.instructionsTitle}>Payment Instructions</Text>
                    </View>
                    <Text style={styles.instructionsText}>{externalPaymentInstructions}</Text>
                    <TouchableOpacity
                      style={styles.markPaidButton}
                      disabled
                      onPress={() => {
                        console.log('Mark as paid clicked (admin approval required)');
                      }}
                    >
                      <Text style={styles.markPaidButtonText}>
                        Mark as Paid (Admin Approval Required)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {billingStatusMarketplace === 'active' && (
              <View style={styles.activeInfo}>
                <CheckCircle size={20} color={Colors.nautical.teal} />
                <Text style={styles.activeInfoText}>
                  Your marketplace listing is active and visible to shoppers.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.billingCard}>
          <View style={styles.billingCardHeader}>
            <View style={styles.billingCardTitleRow}>
              <Calendar size={24} color={Colors.nautical.teal} />
              <Text style={styles.billingCardTitle}>Events Participation</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                billingStatusEvents === 'active' && styles.statusChipActive,
                billingStatusEvents === 'pending' && styles.statusChipPending,
                billingStatusEvents === 'inactive' && styles.statusChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  billingStatusEvents === 'active' && styles.statusChipTextActive,
                ]}
              >
                {billingStatusEvents === 'active'
                  ? '✓ Eligible'
                  : billingStatusEvents === 'pending'
                  ? '⏳ Pending'
                  : '● Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.billingCardBody}>
            <View style={styles.billingInfo}>
              <Text style={styles.billingAmount}>
                ${eventFeeAmount}
                <Text style={styles.billingRecurrence}> /event</Text>
              </Text>
              <Text style={styles.billingDescription}>
                You can join events even without a marketplace booth. You&apos;ll be charged per event.
              </Text>
            </View>

            <View style={styles.eventsBillingNote}>
              <Text style={styles.eventsBillingNoteText}>
                💡 Per-event charges appear when you sign up for each event in the Events tab.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.billingFooter}>
        <Text style={styles.billingFooterText}>
          Questions about billing? Contact support@overboardnorth.com
        </Text>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <CreditCard size={20} color={Colors.nautical.teal} />
          <Text style={styles.settingsSectionTitle}>Payment Methods</Text>
        </View>
        <Text style={styles.settingsDescription}>
          Configure how customers can pay you. Orders are processed externally through your preferred methods.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-commerce Website URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.ecommerce_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, ecommerce_url: text })}
            placeholder="https://yourstore.com/shop"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>PayPal.me or Checkout Link</Text>
          <TextInput
            style={styles.input}
            value={settingsData.paypal_link}
            onChangeText={(text) => setSettingsData({ ...settingsData, paypal_link: text })}
            placeholder="https://paypal.me/yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Venmo Handle (without @)</Text>
          <TextInput
            style={styles.input}
            value={settingsData.venmo_handle}
            onChangeText={(text) => setSettingsData({ ...settingsData, venmo_handle: text })}
            placeholder="yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cash App Handle (without $)</Text>
          <TextInput
            style={styles.input}
            value={settingsData.cashapp_handle}
            onChangeText={(text) => setSettingsData({ ...settingsData, cashapp_handle: text })}
            placeholder="yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Tax Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={settingsData.tax_rate_percent.toString()}
              onChangeText={(text) => setSettingsData({ ...settingsData, tax_rate_percent: parseFloat(text) || 0 })}
              placeholder="0.00"
              placeholderTextColor={Colors.light.muted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Allow Alternative Payment Methods</Text>
            <Text style={styles.switchSubtext}>Enable Venmo, Cash App, etc.</Text>
          </View>
          <Switch
            value={settingsData.allow_alt_pay}
            onValueChange={(val) => setSettingsData({ ...settingsData, allow_alt_pay: val })}
            trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
            thumbColor={Colors.white}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <MapPin size={20} color={Colors.nautical.teal} />
          <Text style={styles.settingsSectionTitle}>Local & Pickup</Text>
        </View>
        <Text style={styles.settingsDescription}>
          Enable local pickup and delivery options for customers in your area.
        </Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Local Pickup Available</Text>
            <Text style={styles.switchSubtext}>Allow customers to pick up orders</Text>
          </View>
          <Switch
            value={settingsData.pickup_available}
            onValueChange={(val) => setSettingsData({ ...settingsData, pickup_available: val })}
            trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
            thumbColor={Colors.white}
          />
        </View>

        {settingsData.pickup_available && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settingsData.pickup_instructions}
                onChangeText={(text) => setSettingsData({ ...settingsData, pickup_instructions: text })}
                placeholder="Provide details like hours, location, parking, etc."
                placeholderTextColor={Colors.light.muted}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pickup Scheduler URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={settingsData.pickup_scheduler_url}
                onChangeText={(text) => setSettingsData({ ...settingsData, pickup_scheduler_url: text })}
                placeholder="https://calendly.com/yourname/pickup"
                placeholderTextColor={Colors.light.muted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address Line 1</Text>
          <TextInput
            style={styles.input}
            value={settingsData.address_line1}
            onChangeText={(text) => setSettingsData({ ...settingsData, address_line1: text })}
            placeholder="123 Main St"
            placeholderTextColor={Colors.light.muted}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={settingsData.city}
              onChangeText={(text) => setSettingsData({ ...settingsData, city: text })}
              placeholder="Portland"
              placeholderTextColor={Colors.light.muted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.input}
              value={settingsData.state}
              onChangeText={(text) => setSettingsData({ ...settingsData, state: text })}
              placeholder="OR"
              placeholderTextColor={Colors.light.muted}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.inputLabel}>ZIP</Text>
            <TextInput
              style={styles.input}
              value={settingsData.zip}
              onChangeText={(text) => setSettingsData({ ...settingsData, zip: text })}
              placeholder="97209"
              placeholderTextColor={Colors.light.muted}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={settingsData.latitude.toString()}
              onChangeText={(text) => setSettingsData({ ...settingsData, latitude: parseFloat(text) || 0 })}
              placeholder="45.5152"
              placeholderTextColor={Colors.light.muted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={settingsData.longitude.toString()}
              onChangeText={(text) => setSettingsData({ ...settingsData, longitude: parseFloat(text) || 0 })}
              placeholder="-122.6784"
              placeholderTextColor={Colors.light.muted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Local Delivery Available</Text>
            <Text style={styles.switchSubtext}>Deliver within a specified radius</Text>
          </View>
          <Switch
            value={settingsData.local_delivery}
            onValueChange={(val) => setSettingsData({ ...settingsData, local_delivery: val })}
            trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
            thumbColor={Colors.white}
          />
        </View>

        {settingsData.local_delivery && (
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Delivery Radius (miles)</Text>
              <TextInput
                style={styles.input}
                value={settingsData.local_delivery_radius_miles.toString()}
                onChangeText={(text) => setSettingsData({ ...settingsData, local_delivery_radius_miles: parseFloat(text) || 0 })}
                placeholder="10"
                placeholderTextColor={Colors.light.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Delivery Fee ($)</Text>
              <TextInput
                style={styles.input}
                value={settingsData.local_delivery_fee.toString()}
                onChangeText={(text) => setSettingsData({ ...settingsData, local_delivery_fee: parseFloat(text) || 0 })}
                placeholder="5.00"
                placeholderTextColor={Colors.light.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <Share2 size={20} color={Colors.nautical.teal} />
          <Text style={styles.settingsSectionTitle}>Social Media</Text>
        </View>
        <Text style={styles.settingsDescription}>
          Connect your social media profiles to help customers discover and follow you.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Facebook Page URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.facebook_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, facebook_url: text })}
            placeholder="https://facebook.com/yourpage"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Instagram Profile URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.instagram_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, instagram_url: text })}
            placeholder="https://instagram.com/yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>TikTok Profile URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.tiktok_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, tiktok_url: text })}
            placeholder="https://tiktok.com/@yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Twitter/X Profile URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.twitter_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, twitter_url: text })}
            placeholder="https://twitter.com/yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>YouTube Channel URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.youtube_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, youtube_url: text })}
            placeholder="https://youtube.com/@yourchannel"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pinterest Profile URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.pinterest_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, pinterest_url: text })}
            placeholder="https://pinterest.com/yourusername"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>LinkedIn Profile URL</Text>
          <TextInput
            style={styles.input}
            value={settingsData.linkedin_url}
            onChangeText={(text) => setSettingsData({ ...settingsData, linkedin_url: text })}
            placeholder="https://linkedin.com/in/yourprofile"
            placeholderTextColor={Colors.light.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <ShoppingBag size={20} color={Colors.nautical.teal} />
          <Text style={styles.settingsSectionTitle}>Etsy</Text>
        </View>
        <Text style={styles.settingsDescription}>
          Showcase your Etsy shop and featured listings to attract more customers.
        </Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Display Etsy Badge</Text>
            <Text style={styles.switchSubtext}>Show your Etsy shop link on your booth</Text>
          </View>
          <Switch
            value={settingsData.etsy_badge_enabled}
            onValueChange={(val) => {
              setSettingsData({ ...settingsData, etsy_badge_enabled: val });
              if (!val) {
                setEtsyErrors({});
              }
            }}
            trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
            thumbColor={Colors.white}
          />
        </View>

        {settingsData.etsy_badge_enabled && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Etsy Shop URL *</Text>
              <TextInput
                style={[
                  styles.input,
                  etsyErrors.shop_url && styles.inputError
                ]}
                value={settingsData.etsy_shop_url}
                onChangeText={(text) => {
                  setSettingsData({ ...settingsData, etsy_shop_url: text });
                  if (etsyErrors.shop_url) {
                    const newErrors = { ...etsyErrors };
                    delete newErrors.shop_url;
                    setEtsyErrors(newErrors);
                  }
                }}
                placeholder="https://www.etsy.com/shop/YourShop"
                placeholderTextColor={Colors.light.muted}
                autoCapitalize="none"
                keyboardType="url"
              />
              {etsyErrors.shop_url && (
                <Text style={styles.errorText}>{etsyErrors.shop_url}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Etsy Username (Optional)</Text>
              <TextInput
                style={styles.input}
                value={settingsData.etsy_username}
                onChangeText={(text) => setSettingsData({ ...settingsData, etsy_username: text })}
                placeholder="YourEtsyUsername"
                placeholderTextColor={Colors.light.muted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Featured Listings (Up to 6)</Text>
              <Text style={styles.inputSubtext}>
                Add up to 6 Etsy listing URLs to showcase on your booth
              </Text>
              {settingsData.etsy_showcase_urls.map((url, index) => (
                <View key={index} style={styles.showcaseRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.showcaseInput,
                      etsyErrors[`showcase_${index}`] && styles.inputError
                    ]}
                    value={url}
                    onChangeText={(text) => {
                      const newUrls = [...settingsData.etsy_showcase_urls];
                      newUrls[index] = text;
                      setSettingsData({ ...settingsData, etsy_showcase_urls: newUrls });
                      if (etsyErrors[`showcase_${index}`]) {
                        const newErrors = { ...etsyErrors };
                        delete newErrors[`showcase_${index}`];
                        setEtsyErrors(newErrors);
                      }
                    }}
                    placeholder={`https://www.etsy.com/listing/123456789`}
                    placeholderTextColor={Colors.light.muted}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  {url.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => {
                        const newUrls = [...settingsData.etsy_showcase_urls];
                        newUrls[index] = '';
                        setSettingsData({ ...settingsData, etsy_showcase_urls: newUrls });
                        const newErrors = { ...etsyErrors };
                        delete newErrors[`showcase_${index}`];
                        setEtsyErrors(newErrors);
                      }}
                    >
                      <X size={16} color={Colors.light.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {Object.keys(etsyErrors).some(key => key.startsWith('showcase_')) && (
                <Text style={styles.errorText}>
                  Some showcase URLs are invalid. Please check the format.
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <CheckCircle size={20} color={Colors.nautical.teal} />
          <Text style={styles.settingsSectionTitle}>Compliance</Text>
        </View>
        
        <View style={styles.complianceCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.complianceText}>
                I understand I am the merchant of record and responsible for taxes, shipping, returns, and customer support.
              </Text>
            </View>
            <Switch
              value={settingsData.terms_acknowledged}
              onValueChange={(val) => setSettingsData({ ...settingsData, terms_acknowledged: val })}
              trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.saveButton,
          !settingsData.terms_acknowledged && styles.saveButtonDisabled
        ]}
        disabled={!settingsData.terms_acknowledged}
        onPress={() => {
          const errors: { [key: string]: string } = {};

          if (settingsData.etsy_badge_enabled) {
            if (!settingsData.etsy_shop_url.trim()) {
              errors.shop_url = 'Etsy Shop URL is required when badge is enabled';
            } else {
              const shopUrlPattern = /^https:\/\/(www\.)?etsy\.com\/shop\/[A-Za-z0-9\-_]+\/?$/;
              if (!shopUrlPattern.test(settingsData.etsy_shop_url.trim())) {
                errors.shop_url = 'Invalid Etsy shop URL format';
              }
            }

            const listingPattern = /^https:\/\/(www\.)?etsy\.com\/listing\/[0-9]+/;
            settingsData.etsy_showcase_urls.forEach((url, index) => {
              if (url.trim() && !listingPattern.test(url.trim())) {
                errors[`showcase_${index}`] = 'Invalid listing URL';
              }
            });
          }

          if (Object.keys(errors).length > 0) {
            setEtsyErrors(errors);
            return;
          }

          setEtsyErrors({});
          console.log('Settings saved:', settingsData);
          alert('Etsy settings saved.');
        }}
      >
        <Save size={20} color={Colors.white} />
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSalesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <DollarSign size={24} color={Colors.nautical.teal} />
          <Text style={styles.statValue}>$2,458</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
        <View style={styles.statCard}>
          <Package size={24} color={Colors.light.terracotta} />
          <Text style={styles.statValue}>34</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <TouchableOpacity 
          style={styles.orderCard}
          onPress={() => router.push('/order/1234')}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #1234</Text>
            <Text style={styles.orderPrice}>$64</Text>
          </View>
          <Text style={styles.orderDate}>2 hours ago</Text>
          <Text style={styles.orderItem}>Ceramic Mug × 2</Text>
          <View style={styles.orderStatus}>
            <View style={[styles.statusDot, { backgroundColor: Colors.light.sage }]} />
            <Text style={styles.orderStatusText}>Processing</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.orderCard}
          onPress={() => router.push('/order/1233')}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #1233</Text>
            <Text style={styles.orderPrice}>$56</Text>
          </View>
          <Text style={styles.orderDate}>1 day ago</Text>
          <Text style={styles.orderItem}>Planter Set × 1</Text>
          <View style={styles.orderStatus}>
            <View style={[styles.statusDot, { backgroundColor: Colors.nautical.teal }]} />
            <Text style={styles.orderStatusText}>Shipped</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Messages</Text>
          <View style={styles.messageBadge}>
            <Text style={styles.messageBadgeText}>3</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.messagePreview}>
          <MessageSquare size={20} color={Colors.nautical.teal} />
          <View style={styles.messageContent}>
            <Text style={styles.messageSender}>Emma Johnson</Text>
            <Text style={styles.messageText} numberOfLines={1}>
              Do you offer custom orders?
            </Text>
          </View>
          <View style={styles.unreadDot} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.messagePreview}>
          <MessageSquare size={20} color={Colors.nautical.teal} />
          <View style={styles.messageContent}>
            <Text style={styles.messageSender}>Michael Brown</Text>
            <Text style={styles.messageText} numberOfLines={1}>
              When will the mugs be back in stock?
            </Text>
          </View>
          <View style={styles.unreadDot} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderWorkshopsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workshops</Text>
        <Text style={styles.sectionDescription}>
          Host workshops and classes to engage with your community and showcase your expertise.
        </Text>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => router.push('/vendor-workshops')}
        >
          <Calendar size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>Manage Workshops</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'booth':
        return renderBoothTab();
      case 'products':
        return renderProductsTab();
      case 'theme':
        return renderThemeTab();
      case 'events':
        return renderEventsTab();
      case 'sales':
        return renderSalesTab();
      case 'workshops':
        return renderWorkshopsTab();
      case 'settings':
        return renderSettingsTab();
      case 'billing':
        return renderBillingTab();
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <HamburgerMenu />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Vendor Dashboard</Text>
          <Text style={styles.headerSubtitle}>{vendorBusinessName}</Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'booth' && styles.tabActive]}
            onPress={() => setActiveTab('booth')}
          >
            <Camera size={20} color={activeTab === 'booth' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'booth' && styles.tabTextActive]}>
              Booth
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
          >
            <Package size={20} color={activeTab === 'products' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
              Products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'theme' && styles.tabActive]}
            onPress={() => setActiveTab('theme')}
          >
            <Palette size={20} color={activeTab === 'theme' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'theme' && styles.tabTextActive]}>
              Theme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Calendar size={20} color={activeTab === 'events' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.tabActive]}
            onPress={() => setActiveTab('sales')}
          >
            <DollarSign size={20} color={activeTab === 'sales' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
              Sales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'workshops' && styles.tabActive]}
            onPress={() => setActiveTab('workshops')}
          >
            <Calendar size={20} color={activeTab === 'workshops' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'workshops' && styles.tabTextActive]}>
              Workshops
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <SettingsIcon size={20} color={activeTab === 'settings' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'billing' && styles.tabActive]}
            onPress={() => setActiveTab('billing')}
          >
            <DollarSign size={20} color={activeTab === 'billing' ? Colors.nautical.teal : Colors.light.muted} />
            <Text style={[styles.tabText, activeTab === 'billing' && styles.tabTextActive]}>
              Billing
            </Text>
          </TouchableOpacity>
        </View>

        {renderContent()}

        <View style={[styles.previewBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => router.push('/vendor/1')}
          >
            <Eye size={20} color={Colors.white} />
            <Text style={styles.previewButtonText}>Booth Preview</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.nautical.teal,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.nautical.sandLight,
  },
  tabText: {
    fontSize: 11,
    color: Colors.light.muted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: Colors.nautical.teal,
    fontWeight: '700' as const,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bannerPreview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  videoUpload: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  videoUploadText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  videoUploadSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 4,
  },
  bioInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.terracotta,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  addProductButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productCardImage: {
    width: '100%',
    height: 160,
  },
  productCardContent: {
    padding: 12,
  },
  productCardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  productCardPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
    marginBottom: 8,
  },
  productCardStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  productCardStockText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  productCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  productActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
  },
  themeDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 20,
  },
  themesGrid: {
    gap: 16,
    marginBottom: 24,
  },
  themeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.border,
    position: 'relative' as const,
  },
  themeCardSelected: {
    borderColor: Colors.nautical.teal,
  },
  themePreview: {
    width: '100%',
    height: 140,
  },
  themeInfo: {
    padding: 16,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  themeColors: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  liveNowCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  liveNowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveNowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  liveNowSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  liveBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#22C55E',
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.nautical.teal,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  joinEventButton: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinEventButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  messageBadge: {
    backgroundColor: Colors.light.terracotta,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messageContent: {
    flex: 1,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.terracotta,
  },
  previewBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.oceanDeep,
    paddingVertical: 16,
    borderRadius: 12,
  },
  previewButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  settingsSectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  settingsDescription: {
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
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  switchSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  complianceCard: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  complianceText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  inputSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  showcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  showcaseInput: {
    flex: 1,
    marginBottom: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputError: {
    borderColor: Colors.light.terracotta,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.terracotta,
    marginTop: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventVendorCount: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  requestStatusBadge: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  requestStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  lineupCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lineupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  lineupEventTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  lineupSection: {
    marginBottom: 20,
  },
  lineupSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  lineupSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  liveStatusCard: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  liveStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liveStatusText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  liveStatusButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  liveStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  liveStatusButtonActive: {
    backgroundColor: Colors.nautical.teal,
  },
  liveStatusButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  liveStatusButtonTextActive: {
    color: Colors.white,
  },
  chatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  chatLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  productSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  productSelectorItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.light.border,
    position: 'relative' as const,
  },
  productSelectorItemSelected: {
    borderColor: Colors.nautical.teal,
    borderWidth: 3,
  },
  productSelectorItemDisabled: {
    opacity: 0.4,
  },
  productSelectorImage: {
    width: '100%',
    height: '100%',
  },
  productSelectedBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: Colors.nautical.teal,
    borderRadius: 12,
    padding: 2,
  },
  productSelectorName: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
    padding: 4,
    textAlign: 'center' as const,
  },
  previewBoothButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.oceanDeep,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  previewBoothButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  billingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  billingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.nautical.sandLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  billingCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billingCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.border,
  },
  statusChipActive: {
    backgroundColor: Colors.nautical.teal,
  },
  statusChipPending: {
    backgroundColor: Colors.nautical.mustard,
  },
  statusChipInactive: {
    backgroundColor: Colors.light.muted,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statusChipTextActive: {
    color: Colors.white,
  },
  billingCardBody: {
    padding: 20,
  },
  billingInfo: {
    marginBottom: 20,
  },
  billingAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
  },
  billingRecurrence: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  billingDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  externalPaymentSection: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  markPaidButton: {
    backgroundColor: Colors.light.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    opacity: 0.6,
  },
  markPaidButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  activeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.sandLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  activeInfoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  eventsBillingNote: {
    backgroundColor: Colors.nautical.sandLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventsBillingNoteText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  billingFooter: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  billingFooterText: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  eventFeePanel: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventFeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventFeeAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  couponBadge: {
    backgroundColor: Colors.light.sage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  couponBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  payEventFeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  payEventFeeButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  feeStatusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.sandLight,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.nautical.mustard,
  },
  feeStatusPendingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  feeStatusPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.sandLight,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  feeStatusPaidText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  feeStatusWaived: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.sandLight,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  feeStatusWaivedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  feeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.terracotta,
  },
  feeWarningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.terracotta,
    lineHeight: 18,
  },
  liveStatusButtonDisabled: {
    opacity: 0.5,
  },
});
