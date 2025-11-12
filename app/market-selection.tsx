import { router, Stack } from 'expo-router';
import { Store, Calendar, ChevronRight, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';
import { events, Event } from '@/mocks/events';

export default function MarketSelectionPage() {
  const insets = useSafeAreaInsets();
  const liveEvents = events.filter(event => event.status === 'live');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (liveEvents.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [liveEvents.length, pulseAnim]);

  const handleShopMarketplace = () => {
    router.replace('/(tabs)/shop');
  };

  const handleEnterEvent = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const handleBrowseAllEvents = () => {
    router.push('/events');
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
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Experience</Text>
            <Text style={styles.subtitle}>Shop year-round or join a live event</Text>
          </View>

          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={styles.card}
              onPress={handleShopMarketplace}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Shop Marketplace"
            >
              <View style={styles.cardIconContainer}>
                <Store size={48} color={Colors.nautical.teal} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>Shop Marketplace</Text>
              <Text style={styles.cardSubtitle}>
                Discover handmade treasures from local makers, available year-round
              </Text>
              
              <View style={styles.cardButton}>
                <LinearGradient
                  colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Enter Marketplace</Text>
                  <ChevronRight size={20} color={Colors.white} />
                </LinearGradient>
              </View>
            </TouchableOpacity>

            {liveEvents.length > 0 && (
              <View style={styles.liveEventsSection}>
                <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.livePulse} />
                  <Sparkles size={16} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.liveText}>LIVE NOW</Text>
                </Animated.View>

                {liveEvents.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleEnterEvent(event)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Enter ${event.title}`}
                  >
                    <View style={styles.eventHeader}>
                      <View style={styles.eventIconContainer}>
                        <Calendar size={40} color={Colors.light.terracotta} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.eventEmoji}>🎉</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventSubtitle}>
                        {event.vendorCount} vendors • {event.time}
                      </Text>
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        Drop anchor at our live fair! Shop exclusive deals and connect with makers in real-time.
                      </Text>
                    </View>
                    
                    <View style={styles.eventButton}>
                      <LinearGradient
                        colors={[Colors.light.terracotta, Colors.light.terracottaDark]}
                        style={styles.eventButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.eventButtonText}>Enter Event</Text>
                        <ChevronRight size={20} color={Colors.white} />
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.browseLink}
              onPress={handleBrowseAllEvents}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Browse all events"
            >
              <Text style={styles.browseLinkText}>View All Events →</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
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
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginTop: 8,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  cardIconContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  cardButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  liveEventsSection: {
    gap: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.terracotta,
    shadowColor: Colors.light.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  liveText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.terracotta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 76, 0.2)',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventEmoji: {
    fontSize: 32,
  },
  eventInfo: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 6,
  },
  eventSubtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666666',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#444444',
    lineHeight: 20,
  },
  eventButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  eventButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eventButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  browseLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  browseLinkText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 24,
    gap: 12,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
