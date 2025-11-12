import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronRight, MapPin, ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/app/constants/colors';
import { getVendorSpotlightById } from '@/mocks/vendorSpotlights';
import { vendors } from '@/mocks/vendors';

export default function VendorSpotlightDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const spotlight = getVendorSpotlightById(id);
  const vendor = vendors.find(v => v.id === spotlight?.vendorId);

  if (!spotlight || !vendor) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Spotlight' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Spotlight not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View>
          <Image source={{ uri: spotlight.featuredImage }} style={styles.heroImage} resizeMode="cover" />
          
          <LinearGradient
            colors={['rgba(100, 181, 193, 0.95)', 'rgba(100, 181, 193, 0.85)']}
            style={[styles.headerOverlay, { paddingTop: insets.top + 12 }]}
          >
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color={Colors.nautical.oceanDeep} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vendor Spotlight</Text>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          <View style={styles.vendorHeader}>
            <Image source={{ uri: spotlight.vendorAvatar }} style={styles.vendorAvatar} />
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{spotlight.vendorName}</Text>
              <View style={styles.locationContainer}>
                <MapPin size={14} color={Colors.light.mediumGray} />
                <Text style={styles.locationText}>{vendor.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>{spotlight.title}</Text>
            <Text style={styles.subtitle}>{spotlight.subtitle}</Text>
            <Text style={styles.publishDate}>Published {formatDate(spotlight.publishDate)}</Text>
          </View>

          <View style={styles.highlightsContainer}>
            {spotlight.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightCard}>
                <Text style={styles.highlightIcon}>{highlight.icon}</Text>
                <Text style={styles.highlightValue}>{highlight.value}</Text>
                <Text style={styles.highlightLabel}>{highlight.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.storySection}>
            <Text style={styles.storyText}>{spotlight.story}</Text>
          </View>

          <View style={styles.tagsSection}>
            {spotlight.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.visitButton}
            onPress={() => router.push(`/vendor/${vendor.id}`)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Visit {spotlight.vendorName}&apos;s Shop</Text>
              <ChevronRight size={20} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  vendorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: Colors.nautical.teal,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 12,
  },
  publishDate: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
  },
  highlightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 16,
  },
  highlightCard: {
    alignItems: 'center',
    flex: 1,
  },
  highlightIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.darkGray,
    textAlign: 'center',
  },
  storySection: {
    marginBottom: 24,
  },
  storyText: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    lineHeight: 26,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  tag: {
    backgroundColor: Colors.nautical.sandLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  visitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
  },
});
