import { router, Stack } from 'expo-router';
import { MapPin, Sparkles, Calendar } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { getFeaturedSpotlights } from '@/mocks/vendorSpotlights';
import { getPinnedPosts } from '@/mocks/communityBulletin';
import { shoutouts } from '@/mocks/shoutouts';
import HamburgerMenu from '@/app/components/HamburgerMenu';

const { width } = Dimensions.get('window');

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const featuredSpotlights = getFeaturedSpotlights(3);
  const pinnedPosts = getPinnedPosts();
  const recentShoutouts = shoutouts.slice(0, 3);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, Colors.nautical.teal, Colors.nautical.sandLight]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <HamburgerMenu />
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Community Hub</Text>
            <Text style={styles.description}>
              Connect, share, and celebrate with local makers
            </Text>
          </View>

          <View style={styles.content}>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Meet the Maker</Text>
              <Text style={styles.sectionSubtitle}>
                Discover the stories behind your favorite local artisans
              </Text>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spotlightsScroll}
              >
                {featuredSpotlights.map((spotlight) => (
                  <TouchableOpacity
                    key={spotlight.id}
                    style={styles.spotlightCard}
                    onPress={() => router.push(`/community/spotlight/${spotlight.id}`)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={spotlight.featuredImage}
                      style={styles.spotlightImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.spotlightOverlay}
                    >
                      <Text style={styles.spotlightVendor}>{spotlight.vendorName}</Text>
                      <Text style={styles.spotlightTitle} numberOfLines={2}>
                        {spotlight.title}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Shoutouts Wall</Text>
              <Text style={styles.sectionSubtitle}>
                Celebrate your favorite makers and their amazing work
              </Text>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shoutoutsScroll}
              >
                {recentShoutouts.map((shoutout) => (
                  <TouchableOpacity
                    key={shoutout.id}
                    style={styles.shoutoutCard}
                    onPress={() => router.push(`/vendor/${shoutout.vendorId}`)}
                    activeOpacity={0.8}
                  >
                    {shoutout.imageUrl && (
                      <Image
                        source={shoutout.imageUrl}
                        style={styles.shoutoutImage}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.shoutoutContent}>
                      <Text style={styles.shoutoutMessage} numberOfLines={3}>
                        &ldquo;{shoutout.message}&rdquo;
                      </Text>
                      <View style={styles.shoutoutFooter}>
                        <Text style={styles.shoutoutAuthor}>
                          — {shoutout.customerName}
                        </Text>
                        <Text style={styles.shoutoutVendor}>
                          @{shoutout.vendorName}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/community/shoutouts-wall')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllButtonText}>View All Shoutouts →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📌 Bulletin Board</Text>
              <Text style={styles.sectionSubtitle}>
                Announcements, giveaways, and community news
              </Text>
              
              {pinnedPosts.slice(0, 3).map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.bulletinCard}
                  onPress={() => {
                    if (post.link && post.link.startsWith('/')) {
                      router.push(post.link as any);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.bulletinHeader}>
                    <View style={[styles.bulletinBadge, { 
                      backgroundColor: post.type === 'giveaway' ? '#C25C8C' : '#EE6E56' 
                    }]}>
                      <Text style={styles.bulletinBadgeText}>
                        {post.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bulletinTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={styles.bulletinContent} numberOfLines={2}>
                    {post.content}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/community/bulletin')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllButtonText}>View Full Board →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎪 Events & Activities</Text>
              <Text style={styles.sectionSubtitle}>
                Join us for fairs, markets, and special gatherings
              </Text>
              
              <View style={styles.cardsGrid}>
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: Colors.nautical.teal }]}
                  onPress={() => router.push('/community/fair-schedule')}
                  activeOpacity={0.8}
                >
                  <Sparkles size={28} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.cardTitle}>Fair Schedule</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    View upcoming local fairs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.card, { backgroundColor: Colors.light.terracotta }]}
                  onPress={() => router.push('/(tabs)/events')}
                  activeOpacity={0.8}
                >
                  <Calendar size={28} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.cardTitle}>All Events</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    Browse all markets & events
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.card, { backgroundColor: '#7C9885' }]}
                  onPress={() => router.push('/workshops')}
                  activeOpacity={0.8}
                >
                  <Calendar size={28} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.cardTitle}>Workshops</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    Join classes & learn new skills
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🗺️ Discover Local</Text>
              <Text style={styles.sectionSubtitle}>
                Find small-town vendors and markets near you
              </Text>
              
              <TouchableOpacity
                style={[styles.fullWidthCard, { backgroundColor: '#81B29A' }]}
                onPress={() => router.push('/shop-local')}
                activeOpacity={0.8}
              >
                <View style={styles.fullWidthCardContent}>
                  <View style={styles.fullWidthIconContainer}>
                    <MapPin size={36} color={Colors.white} strokeWidth={2.5} />
                  </View>
                  <View style={styles.fullWidthTextContainer}>
                    <Text style={styles.fullWidthCardTitle}>Shop Local Map</Text>
                    <Text style={styles.fullWidthCardText}>
                      Discover vendors from small towns near you
                    </Text>
                  </View>
                </View>
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
  subtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 20,
    gap: 32,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.white,
    opacity: 0.85,
    lineHeight: 20,
    marginBottom: 8,
  },
  spotlightsScroll: {
    paddingRight: 20,
  },
  spotlightCard: {
    width: width - 80,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  spotlightVendor: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
    opacity: 0.95,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 24,
  },
  shoutoutsScroll: {
    paddingRight: 20,
  },
  shoutoutCard: {
    width: 260,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  shoutoutImage: {
    width: '100%',
    height: 140,
  },
  shoutoutContent: {
    padding: 16,
  },
  shoutoutMessage: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.light.charcoal,
    fontStyle: 'italic' as const,
    lineHeight: 20,
    marginBottom: 12,
  },
  shoutoutFooter: {
    gap: 4,
  },
  shoutoutAuthor: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  shoutoutVendor: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.nautical.teal,
  },
  bulletinCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bulletinHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletinBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  bulletinBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  bulletinTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 6,
    lineHeight: 22,
  },
  bulletinContent: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    lineHeight: 20,
  },
  viewAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 12,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.white,
    opacity: 0.95,
    lineHeight: 16,
  },
  fullWidthCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fullWidthCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fullWidthIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthTextContainer: {
    flex: 1,
  },
  fullWidthCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  fullWidthCardText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.white,
    opacity: 0.95,
    lineHeight: 20,
  },
});
