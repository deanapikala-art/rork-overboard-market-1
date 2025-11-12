import { router, Stack } from 'expo-router';
import { ArrowLeft, Radio, Gift, Music, Users, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/app/constants/colors';

const { width } = Dimensions.get('window');

interface StageEvent {
  id: string;
  type: 'giveaway' | 'interview' | 'music';
  title: string;
  time: string;
  description: string;
  host: string;
  status: 'live' | 'upcoming' | 'ended';
}

const STAGE_EVENTS: StageEvent[] = [
  {
    id: '1',
    type: 'giveaway',
    title: 'Grand Prize Giveaway',
    time: '2:00 PM EST',
    description: 'Win a $500 shopping spree at any booth! Must be present in the fair to win.',
    host: 'Overboard North Team',
    status: 'live',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Meet the Maker: Luna Ceramics',
    time: '3:30 PM EST',
    description: 'Join us for an intimate conversation with Luna about her pottery journey and creative process.',
    host: 'Sarah Mitchell',
    status: 'upcoming',
  },
  {
    id: '3',
    type: 'music',
    title: 'Acoustic Sessions by The Dockside Band',
    time: '5:00 PM EST',
    description: 'Enjoy live acoustic music while you shop. Mellow coastal vibes to set the perfect fair atmosphere.',
    host: 'The Dockside Band',
    status: 'upcoming',
  },
  {
    id: '4',
    type: 'giveaway',
    title: 'Flash Sale Alert',
    time: '6:30 PM EST',
    description: 'Select booths offering 25% off for the next hour only. Check your favorite vendors!',
    host: 'Overboard North',
    status: 'upcoming',
  },
];

function GlowingLantern({ size = 40 }: { size?: number }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
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
        ]),
        Animated.sequence([
          Animated.timing(swingAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(swingAnim, {
            toValue: -1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [glowAnim, swingAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const rotation = swingAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.lantern,
        {
          width: size,
          height: size * 1.3,
          opacity: glowOpacity,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        style={styles.lanternGradient}
      >
        <View style={styles.lanternTop} />
        <View style={styles.lanternGlow} />
      </LinearGradient>
    </Animated.View>
  );
}

function StringLights() {
  const lights = Array.from({ length: 8 });
  const animations = useRef(lights.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = animations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      )
    );

    anims.forEach(anim => anim.start());

    return () => anims.forEach(anim => anim.stop());
  }, [animations]);

  return (
    <View style={styles.stringLightsContainer}>
      <View style={styles.stringWire} />
      {animations.map((anim, index) => {
        const opacity = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.stringLight,
              {
                left: `${(index / 7) * 100}%`,
                opacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#FFE44D', '#FFD700']}
              style={styles.stringLightBulb}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

function StageEventCard({ event }: { event: StageEvent }) {
  const getEventIcon = () => {
    switch (event.type) {
      case 'giveaway':
        return <Gift size={24} color={Colors.nautical.mustard} />;
      case 'interview':
        return <Radio size={24} color={Colors.nautical.teal} />;
      case 'music':
        return <Music size={24} color={Colors.nautical.oceanDeep} />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'giveaway':
        return Colors.nautical.mustard;
      case 'interview':
        return Colors.nautical.teal;
      case 'music':
        return Colors.nautical.oceanDeep;
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (event.status === 'live') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
  }, [event.status, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.eventCard,
        event.status === 'live' && {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={
          event.status === 'live'
            ? ['#FFE8D6', '#FFF8F0']
            : ['#FFFFFF', '#F9F9F9']
        }
        style={styles.eventCardGradient}
      >
        {event.status === 'live' && (
          <View style={styles.liveIndicator}>
            <LinearGradient
              colors={['#FF4444', '#CC0000']}
              style={styles.liveBadgeGradient}
            >
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.eventHeader}>
          <View style={[styles.eventIconContainer, { backgroundColor: getEventColor() + '20' }]}>
            {getEventIcon()}
          </View>
          <View style={styles.eventHeaderText}>
            <Text style={styles.eventTime}>{event.time}</Text>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
          </View>
        </View>

        <Text style={styles.eventDescription}>{event.description}</Text>

        <View style={styles.eventFooter}>
          <View style={styles.hostBadge}>
            <Users size={14} color={Colors.nautical.oceanDeep} />
            <Text style={styles.hostText}>{event.host}</Text>
          </View>
          {event.status === 'live' && (
            <TouchableOpacity style={styles.watchButton}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.watchButtonGradient}
              >
                <Sparkles size={16} color="#FFF" fill="#FFF" />
                <Text style={styles.watchButtonText}>Watch Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function FairStagePage() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFA07A', '#FF8C69', '#FF7F50']}
          style={styles.gradient}
        >
          <View style={[styles.safeTop, { paddingTop: insets.top }]}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Fair Stage</Text>
              <View style={styles.placeholder} />
            </View>
          </View>

          <StringLights />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stageHeader}>
              <View style={styles.lanternRow}>
                <GlowingLantern size={50} />
                <GlowingLantern size={60} />
                <GlowingLantern size={50} />
              </View>

              <View style={styles.stageSign}>
                <LinearGradient
                  colors={[Colors.nautical.driftwood, '#6B5A4A']}
                  style={styles.stageSignGradient}
                >
                  <Text style={styles.stageTitle}>🎪 Fair Stage 🎪</Text>
                  <Text style={styles.stageSubtitle}>Live Events, Giveaways & Music</Text>
                </LinearGradient>
              </View>

              <Text style={styles.welcomeText}>
                Welcome to the heart of Overboard North! Join us for special events, meet the makers, and win amazing prizes.
              </Text>
            </View>

            <View style={styles.eventsSection}>
              <View style={styles.sectionHeader}>
                <Radio size={20} color={Colors.nautical.oceanDeep} />
                <Text style={styles.sectionTitle}>Today's Lineup</Text>
              </View>

              {STAGE_EVENTS.map(event => (
                <StageEventCard key={event.id} event={event} />
              ))}
            </View>

            <View style={styles.chatSection}>
              <View style={styles.chatHeader}>
                <Users size={20} color={Colors.nautical.oceanDeep} />
                <Text style={styles.chatTitle}>Fair Chat</Text>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>234 online</Text>
                </View>
              </View>

              <View style={styles.chatBox}>
                <View style={styles.chatPlaceholder}>
                  <Users size={32} color={Colors.light.muted} />
                  <Text style={styles.chatPlaceholderText}>
                    Chat with fellow fair-goers during live events
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
  safeTop: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },
  stringLightsContainer: {
    height: 40,
    marginTop: 8,
    marginHorizontal: 16,
    position: 'relative' as const,
  },
  stringWire: {
    position: 'absolute' as const,
    top: 8,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(139, 123, 106, 0.6)',
  },
  stringLight: {
    position: 'absolute' as const,
    top: 0,
  },
  stringLightBulb: {
    width: 12,
    height: 16,
    borderRadius: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stageHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lanternRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    marginBottom: 20,
  },
  lantern: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  lanternGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  lanternTop: {
    position: 'absolute' as const,
    top: 0,
    width: '80%',
    height: 4,
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  lanternGlow: {
    width: '60%',
    height: '60%',
    backgroundColor: '#FFFF00',
    borderRadius: 100,
    opacity: 0.7,
  },
  stageSign: {
    width: width - 40,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stageSignGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#5A4A3A',
  },
  stageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  stageSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.sandLight,
    textAlign: 'center',
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.nautical.oceanDeep,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  eventCardGradient: {
    padding: 16,
    position: 'relative' as const,
  },
  liveIndicator: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  liveBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventHeaderText: {
    flex: 1,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.nautical.oceanDeep,
    lineHeight: 22,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 20,
  },
  hostText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  watchButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  watchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  watchButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  chatSection: {
    marginBottom: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.nautical.oceanDeep,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF00',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  chatBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chatPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  chatPlaceholderText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
  },
});
