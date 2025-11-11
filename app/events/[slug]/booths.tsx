import { Image } from 'expo-image';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Radio, Volume2, VolumeX, Users, Clock, AlertCircle, Store, ChevronRight, Sparkles, Map } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { vendors } from '@/mocks/vendors';
import { eventVendors } from '@/mocks/eventVendors';
import { useEventGuard } from '@/app/hooks/useEventGuard';

const { width, height } = Dimensions.get('window');

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const difference = +new Date(targetDate) - +new Date();
  
  if (difference > 0) {
    return {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  
  return null;
}

function CountdownClock({ targetTime }: { targetTime: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft(targetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  if (!timeLeft) {
    return null;
  }

  return (
    <View style={styles.countdownClock}>
      <Clock size={10} color="#FFF" />
      <Text style={styles.countdownText}>
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </Text>
    </View>
  );
}

function GlowingLights() {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse2, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
      ])
    );

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [pulse1, pulse2]);

  return (
    <View style={styles.lightsContainer}>
      <Animated.View style={[styles.lightBulb, { transform: [{ scale: pulse1 }] }]} />
      <Animated.View style={[styles.lightBulb, styles.lightBulb2, { transform: [{ scale: pulse2 }] }]} />
      <Animated.View style={[styles.lightBulb, styles.lightBulb3, { transform: [{ scale: pulse1 }] }]} />
    </View>
  );
}

function BoothBanner({ vendor, isLive }: { vendor: typeof vendors[0]; isLive: boolean }) {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 3, duration: 2000, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [sway]);

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ rotate: sway.interpolate({
      inputRange: [-3, 3],
      outputRange: ['-3deg', '3deg']
    }) }] }]}>
      <LinearGradient
        colors={isLive ? ['#FF6B35', '#F7931E'] : ['#2C5F2D', '#97BC62']}
        style={styles.banner}
      >
        <Text style={styles.bannerText}>{vendor.name}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function CrowdIndicator({ isLive }: { isLive: boolean }) {
  const bob1 = useRef(new Animated.Value(0)).current;
  const bob2 = useRef(new Animated.Value(0)).current;
  const bob3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLive) return;

    const createBobAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, { toValue: -6, duration: 500, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      );
    };

    const anim1 = createBobAnimation(bob1, 0);
    const anim2 = createBobAnimation(bob2, 200);
    const anim3 = createBobAnimation(bob3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [bob1, bob2, bob3, isLive]);

  if (!isLive) return null;

  return (
    <View style={styles.crowdContainer}>
      <Animated.Text style={[styles.crowdEmoji, { transform: [{ translateY: bob1 }] }]}>{'🙋'}</Animated.Text>
      <Animated.Text style={[styles.crowdEmoji, { transform: [{ translateY: bob2 }] }]}>{'🙋‍♂️'}</Animated.Text>
      <Animated.Text style={[styles.crowdEmoji, { transform: [{ translateY: bob3 }] }]}>{'🙋‍♀️'}</Animated.Text>
    </View>
  );
}

interface BoothCardProps {
  vendor: typeof vendors[0];
  eventVendor: typeof eventVendors[0];
  onEnter: () => void;
  style?: any;
}

function BoothCard({ vendor, eventVendor, onEnter, style }: BoothCardProps) {
  const isLive = eventVendor.liveStatus === 'live';
  const isCountdown = eventVendor.liveStatus === 'countdown';

  const boothColors = [
    ['#8B4513', '#D2691E'],
    ['#2C5F2D', '#97BC62'],
    ['#4B0082', '#9370DB'],
    ['#B22222', '#DC143C'],
    ['#006994', '#4CA8C5'],
  ];

  const colorIndex = parseInt(vendor.id, 10) % boothColors.length;
  const [color1, color2] = boothColors[colorIndex];

  return (
    <View style={[styles.boothCard, style]}>
      <LinearGradient
        colors={[color1, color2]}
        style={styles.boothFrame}
      >
        <View style={styles.boothRoof}>
          <BoothBanner vendor={vendor} isLive={isLive} />
          {isLive && <GlowingLights />}
        </View>

        <View style={styles.boothBody}>
          <View style={styles.boothWindow}>
            <Image
              source={{ uri: vendor.avatar }}
              style={styles.vendorAvatar}
              contentFit="cover"
            />
            
            {isLive && (
              <View style={styles.liveOverlay}>
                <LinearGradient
                  colors={['rgba(255,107,53,0.9)', 'rgba(247,147,30,0.9)']}
                  style={styles.liveGradient}
                >
                  <Radio size={16} color="#FFF" />
                  <Text style={styles.liveText}>LIVE NOW</Text>
                </LinearGradient>
              </View>
            )}

            {isCountdown && eventVendor.liveSlotStart && (
              <View style={styles.countdownOverlay}>
                <CountdownClock targetTime={eventVendor.liveSlotStart} />
                <Text style={styles.goingLiveText}>Going Live Soon</Text>
              </View>
            )}
          </View>

          <View style={styles.boothInfo}>
            <Text style={styles.boothVendorName} numberOfLines={1}>{vendor.name}</Text>
            <Text style={styles.boothVendorSpecialty} numberOfLines={1}>{vendor.specialty}</Text>
            
            <TouchableOpacity style={styles.enterButton} onPress={onEnter}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.enterButtonGradient}
              >
                <Store size={16} color="#FFF" />
                <Text style={styles.enterButtonText}>Visit Booth</Text>
                <ChevronRight size={16} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <CrowdIndicator isLive={isLive} />
      </LinearGradient>
    </View>
  );
}

function MapView({ booths, currentIndex, onSelectBooth }: { 
  booths: { vendor: typeof vendors[0]; eventVendor: typeof eventVendors[0] }[];
  currentIndex: number;
  onSelectBooth: (index: number) => void;
}) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current && currentIndex !== undefined) {
      scrollViewRef.current.scrollTo({
        y: currentIndex * 140,
        animated: true,
      });
    }
  }, [currentIndex]);

  return (
    <View style={styles.mapViewContainer}>
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.75)']}
        style={styles.mapViewGradient}
      >
        <View style={styles.mapHeader}>
          <Map size={24} color="#FFD700" />
          <Text style={styles.mapTitle}>Fairground Map</Text>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.mapList}
          showsVerticalScrollIndicator={false}
        >
          {booths.map((booth, index) => (
            <TouchableOpacity
              key={booth.eventVendor.id}
              style={[
                styles.mapItem,
                currentIndex === index && styles.mapItemActive
              ]}
              onPress={() => onSelectBooth(index)}
            >
              <Image
                source={{ uri: booth.vendor.avatar }}
                style={styles.mapItemAvatar}
                contentFit="cover"
              />
              <View style={styles.mapItemInfo}>
                <Text style={styles.mapItemName} numberOfLines={1}>
                  {booth.vendor.name}
                </Text>
                <Text style={styles.mapItemCategory} numberOfLines={1}>
                  {booth.vendor.specialty}
                </Text>
              </View>
              {booth.eventVendor.liveStatus === 'live' && (
                <View style={styles.mapItemLiveDot} />
              )}
              {currentIndex === index && (
                <View style={styles.youAreHereDot}>
                  <Sparkles size={16} color="#FFD700" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

export default function EventBoothsMapPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  
  const { event, isLoading, canShowLiveFeatures, shouldRedirect } = useEventGuard({ slug: slug || '', pollInterval: 5000 });
  
  const [currentBoothIndex, setCurrentBoothIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [walkMode, setWalkMode] = useState<'browse' | 'walk'>('browse');

  const scrollViewRef = useRef<ScrollView>(null);
  const walkInterval = useRef<NodeJS.Timeout | null>(null);

  const eventVendorsList = eventVendors
    .filter(ev => ev.eventId === slug)
    .sort((a, b) => a.boothOrder - b.boothOrder);

  const boothsData = eventVendorsList.map(ev => {
    const vendor = vendors.find(v => v.id === ev.vendorId);
    return { eventVendor: ev, vendor };
  }).filter(item => item.vendor !== undefined) as {
    eventVendor: typeof eventVendors[0];
    vendor: typeof vendors[0];
  }[];

  useEffect(() => {
    return () => {
      if (walkInterval.current) {
        clearInterval(walkInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (walkMode === 'walk') {
      walkInterval.current = setInterval(() => {
        setCurrentBoothIndex(prev => {
          if (prev >= boothsData.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 4000);
    } else {
      if (walkInterval.current) {
        clearInterval(walkInterval.current);
        walkInterval.current = null;
      }
    }

    return () => {
      if (walkInterval.current) {
        clearInterval(walkInterval.current);
      }
    };
  }, [walkMode, boothsData.length]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.nautical.teal} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  const handleEnterBooth = (vendorId: string) => {
    if (walkInterval.current) {
      clearInterval(walkInterval.current);
      walkInterval.current = null;
    }
    setWalkMode('browse');
    router.push(`/events/${slug}/booth/${vendorId}` as any);
  };

  const handleBackToEvent = () => {
    if (walkInterval.current) {
      clearInterval(walkInterval.current);
    }
    router.back();
  };

  const handleSelectBoothFromMap = (index: number) => {
    setCurrentBoothIndex(index);
    setShowMap(false);
  };

  const currentBooth = boothsData[currentBoothIndex];
  const viewerCount = 847 + Math.floor(Math.random() * 100);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#F5E6D3', '#E8DCC8']}
          style={styles.gradient}
        >
          <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
              style={styles.topBarGradient}
            >
              <View style={styles.topBarContent}>
                <TouchableOpacity onPress={handleBackToEvent} style={styles.backButton}>
                  <ArrowLeft size={20} color="#FFF" />
                  <Text style={styles.backButtonText}>Back to Event</Text>
                </TouchableOpacity>

                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  {canShowLiveFeatures && (
                    <View style={styles.liveChip}>
                      <Radio size={10} color="#FFF" />
                      <Text style={styles.liveChipText}>Live</Text>
                    </View>
                  )}
                  {event.status === 'upcoming' && (
                    <View style={styles.upcomingChip}>
                      <Clock size={10} color="#FFF" />
                      <Text style={styles.upcomingChipText}>Preview</Text>
                    </View>
                  )}
                </View>

                <View style={styles.topBarActions}>
                  {canShowLiveFeatures && (
                    <View style={styles.viewerCount}>
                      <Users size={14} color="#FFF" />
                      <Text style={styles.viewerCountText}>{viewerCount}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setAudioEnabled(!audioEnabled)}
                    style={styles.audioButton}
                    disabled={!canShowLiveFeatures}
                  >
                    {audioEnabled ? (
                      <Volume2 size={20} color={canShowLiveFeatures ? "#FFF" : "#999"} />
                    ) : (
                      <VolumeX size={20} color={canShowLiveFeatures ? "#FFF" : "#999"} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

          {event.status === 'upcoming' && (
            <View style={styles.previewBanner}>
              <LinearGradient
                colors={['#FFB347', '#FFCC80']}
                style={styles.previewBannerGradient}
              >
                <AlertCircle size={18} color={Colors.nautical.oceanDeep} />
                <Text style={styles.previewBannerText}>
                  Event hasn&apos;t started yet. Explore booths in preview mode.
                </Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.statusBar}>
            <Text style={styles.statusText}>
              You&apos;re visiting <Text style={styles.statusTextBold}>{currentBooth?.vendor.name}</Text> ({currentBoothIndex + 1} of {boothsData.length})
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, walkMode === 'walk' && styles.controlButtonActive]}
              onPress={() => setWalkMode(walkMode === 'walk' ? 'browse' : 'walk')}
            >
              <Sparkles size={18} color={walkMode === 'walk' ? '#FFF' : Colors.nautical.teal} />
              <Text style={[styles.controlButtonText, walkMode === 'walk' && styles.controlButtonTextActive]}>
                {walkMode === 'walk' ? 'Stop Walking' : 'Walk the Aisle'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowMap(!showMap)}
            >
              <Map size={18} color={Colors.nautical.teal} />
              <Text style={styles.controlButtonText}>View Map</Text>
            </TouchableOpacity>
          </View>

          {showMap && (
            <MapView
              booths={boothsData}
              currentIndex={currentBoothIndex}
              onSelectBooth={handleSelectBoothFromMap}
            />
          )}

          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={walkMode === 'browse'}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentBoothIndex(index);
            }}
            contentOffset={{ x: currentBoothIndex * width, y: 0 }}
            style={styles.boothsScrollView}
          >
            {boothsData.map((booth, index) => (
              <BoothCard
                key={booth.eventVendor.id}
                vendor={booth.vendor}
                eventVendor={booth.eventVendor}
                onEnter={() => handleEnterBooth(booth.vendor.id)}
                style={{ width }}
              />
            ))}
          </ScrollView>

          <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.boothThumbnails}
            >
              {boothsData.map((booth, index) => (
                <TouchableOpacity
                  key={booth.eventVendor.id}
                  style={[
                    styles.thumbnail,
                    currentBoothIndex === index && styles.thumbnailActive
                  ]}
                  onPress={() => setCurrentBoothIndex(index)}
                >
                  <Image
                    source={{ uri: booth.vendor.avatar }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                  />
                  {booth.eventVendor.liveStatus === 'live' && (
                    <View style={styles.thumbnailLiveDot} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cream,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.nautical.teal,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBarGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  topBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFF',
    flex: 1,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.terracotta,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveChipText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  upcomingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB347',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  upcomingChipText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  viewerCountText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  audioButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  previewBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  previewBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    lineHeight: 18,
  },
  statusBar: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
  },
  statusTextBold: {
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  controls: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  controlButtonActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  controlButtonTextActive: {
    color: '#FFF',
  },
  mapViewContainer: {
    position: 'absolute' as const,
    top: 200,
    right: 16,
    width: 280,
    maxHeight: height - 400,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  mapViewGradient: {
    flex: 1,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  mapList: {
    flex: 1,
  },
  mapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  mapItemActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  mapItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mapItemInfo: {
    flex: 1,
  },
  mapItemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  mapItemCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  mapItemLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  youAreHereDot: {
    marginLeft: 8,
  },
  boothsScrollView: {
    flex: 1,
    marginTop: 20,
  },
  boothCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  boothFrame: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  boothRoof: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerContainer: {
    width: '80%',
    marginBottom: 10,
  },
  banner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  lightsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  lightBulb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  lightBulb2: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
  },
  lightBulb3: {
    backgroundColor: '#4CA8C5',
    shadowColor: '#4CA8C5',
  },
  boothBody: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
  },
  boothWindow: {
    position: 'relative' as const,
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  liveOverlay: {
    position: 'absolute' as const,
    top: 10,
    right: width / 2 - 120,
    borderRadius: 20,
    overflow: 'hidden',
  },
  liveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  countdownOverlay: {
    position: 'absolute' as const,
    top: 10,
    right: width / 2 - 120,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  countdownClock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
    fontVariant: ['tabular-nums'] as any,
  },
  goingLiveText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginTop: 4,
  },
  boothInfo: {
    alignItems: 'center',
    gap: 8,
  },
  boothVendorName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
  },
  boothVendorSpecialty: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    textAlign: 'center' as const,
  },
  enterButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  enterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  crowdContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  crowdEmoji: {
    fontSize: 24,
  },
  bottomNav: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  boothThumbnails: {
    gap: 12,
    paddingHorizontal: 4,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative' as const,
  },
  thumbnailActive: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  thumbnailLiveDot: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
