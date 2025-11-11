import { Stack } from 'expo-router';
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { FairScheduleEvent, getUpcomingEvents, getLiveEvents } from '@/mocks/fairSchedule';

const TYPE_COLORS = {
  'live-shopping': Colors.light.terracotta,
  'vendor-showcase': '#81B29A',
  'facebook-live': '#4267B2',
  'special-sale': '#C25C8C',
  'holiday-market': '#165B33',
  'workshop': '#F4B860',
};

const TYPE_LABELS = {
  'live-shopping': '🛍️ Live Shopping',
  'vendor-showcase': '✨ Vendor Showcase',
  'facebook-live': '📱 Facebook Live',
  'special-sale': '💰 Special Sale',
  'holiday-market': '🎄 Holiday Market',
  'workshop': '🎨 Workshop',
};

export default function FairScheduleScreen() {
  const [filter, setFilter] = useState<FairScheduleEvent['type'] | 'all'>('all');
  
  const liveEvents = getLiveEvents();
  const upcomingEvents = getUpcomingEvents();
  
  const filteredEvents = filter === 'all' 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.type === filter);

  const handleEventPress = (event: FairScheduleEvent) => {
    console.log('Event pressed:', event.title);
    if (event.streamUrl) {
      console.log('Opening stream:', event.streamUrl);
    }
  };

  const renderEvent = (event: FairScheduleEvent, isLive: boolean = false) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, isLive && styles.liveCard]}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.7}
    >
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>LIVE NOW</Text>
        </View>
      )}

      <Image source={{ uri: event.thumbnail }} style={styles.eventImage} resizeMode="cover" />

      <View style={styles.eventContent}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[event.type] }]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[event.type]}</Text>
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.nautical.teal} />
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={Colors.nautical.teal} />
            <Text style={styles.detailText}>{event.startTime} - {event.endTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color={Colors.nautical.teal} />
            <Text style={styles.detailText}>
              {event.location === 'online' ? 'Online Event' : event.location === 'in-person' ? event.venue : 'Hybrid Event'}
            </Text>
          </View>
          {event.featuredVendors && event.featuredVendors.length > 0 && (
            <View style={styles.detailRow}>
              <Users size={16} color={Colors.nautical.teal} />
              <Text style={styles.detailText}>{event.featuredVendors.join(', ')}</Text>
            </View>
          )}
        </View>

        {event.registrationRequired && (
          <View style={styles.registrationBanner}>
            <Text style={styles.registrationText}>📝 Registration Required</Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.tagsContainer}>
            {event.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {(event.streamUrl || event.registrationUrl) && (
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {isLive ? 'Join Now' : event.registrationRequired ? 'Register' : 'Learn More'}
              </Text>
              <ChevronRight size={16} color={Colors.nautical.teal} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Fair Schedule',
          headerStyle: {
            backgroundColor: Colors.nautical.teal,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }} 
      />

      <LinearGradient
        colors={[Colors.nautical.teal, Colors.nautical.sandLight]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Fair Schedule</Text>
          <Text style={styles.headerSubtitle}>
            Live shopping days, events, and special sales
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All Events
          </Text>
        </TouchableOpacity>

        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filter === type && styles.filterButtonActive,
              filter === type && { backgroundColor: TYPE_COLORS[type as FairScheduleEvent['type']] },
            ]}
            onPress={() => setFilter(type as FairScheduleEvent['type'])}
          >
            <Text style={[styles.filterButtonText, filter === type && styles.filterButtonTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {liveEvents.length > 0 && filter === 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Live Now</Text>
            {liveEvents.map(event => renderEvent(event, true))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {filter === 'all' ? '📅 Upcoming Events' : TYPE_LABELS[filter as FairScheduleEvent['type']]}
          </Text>
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => renderEvent(event, false))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No events found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  filterScroll: {
    flexGrow: 0,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.softGray,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.nautical.teal,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.darkGray,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  liveCard: {
    borderWidth: 2,
    borderColor: Colors.light.terracotta,
  },
  liveBadge: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    backgroundColor: Colors.light.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventContent: {
    padding: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
    lineHeight: 26,
  },
  eventDescription: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    lineHeight: 22,
    marginBottom: 16,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    flex: 1,
  },
  registrationBanner: {
    backgroundColor: Colors.nautical.sandLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  registrationText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    textAlign: 'center',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  tag: {
    backgroundColor: Colors.light.softGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.mediumGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
  },
});
