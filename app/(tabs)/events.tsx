import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Calendar, Store, ChevronDown, ChevronUp, Radio, CalendarPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';

import Colors from '@/constants/colors';
import { events, Event } from '@/mocks/events';
import { TopNavigation } from '@/app/components/TopNavigation';
import HamburgerMenu from '@/app/components/HamburgerMenu';

export default function EventsScreen() {
  const router = useRouter();
  const [pastEventsExpanded, setPastEventsExpanded] = useState(false);

  const liveEvents = events.filter(event => event.status === 'live');
  const upcomingEvents = events.filter(event => event.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastEvents = events.filter(event => event.status === 'past')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const createCalendarLink = (event: Event) => {
    const startDate = new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description);
    const location = encodeURIComponent('Overboard North Craft Fair');
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}&location=${location}`;
  };

  const handleAddToCalendar = (event: Event) => {
    const googleCalendarUrl = createCalendarLink(event);
    Linking.openURL(googleCalendarUrl).catch(err => {
      console.error('Failed to open calendar:', err);
    });
  };

  const renderEventCard = (event: Event) => (
    <TouchableOpacity 
      key={event.id} 
      style={styles.eventCard}
      onPress={() => router.push(`/events/${event.id}` as any)}
    >
      <Image
        source={{ uri: event.image }}
        style={styles.eventImage}
        contentFit="cover"
      />
      <View style={styles.eventContent}>
        <View style={[
          styles.statusChip,
          event.status === 'live' && styles.statusChipLive,
          event.status === 'upcoming' && styles.statusChipUpcoming,
          event.status === 'past' && styles.statusChipPast,
        ]}>
          {event.status === 'live' && <Radio size={12} color={Colors.light.terracotta} />}
          <Text style={[
            styles.statusChipText,
            event.status === 'live' && styles.statusChipTextLive,
            event.status === 'upcoming' && styles.statusChipTextUpcoming,
            event.status === 'past' && styles.statusChipTextPast,
          ]}>
            {event.status === 'live' ? 'Live Now' : event.status === 'upcoming' ? 'Upcoming' : 'Past Event'}
          </Text>
        </View>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.eventDetails}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={Colors.light.muted} />
            <Text style={styles.detailText}>
              {formatDate(event.date)} - {formatDate(event.endDate)}
            </Text>
          </View>
          {event.time && (
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{event.time}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Store size={14} color={Colors.light.muted} />
            <Text style={styles.detailText}>{event.vendorCount} vendors</Text>
          </View>
        </View>
        
        {event.status === 'live' && (
          <TouchableOpacity 
            style={styles.liveButton}
            onPress={() => router.push('/docks-map')}
          >
            <Text style={styles.liveButtonText}>Enter the Docks</Text>
          </TouchableOpacity>
        )}
        
        {event.status === 'upcoming' && (
          <View style={styles.upcomingActions}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => router.push(`/events/${event.id}` as any)}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => handleAddToCalendar(event)}
            >
              <CalendarPlus size={18} color={Colors.light.sage} />
              <Text style={styles.calendarButtonText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {event.status === 'past' && (
          <TouchableOpacity 
            style={styles.recapButton}
            disabled
          >
            <Text style={styles.recapButtonText}>View Recap (Coming Soon)</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <HamburgerMenu />
        <TopNavigation />
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.infoBanner}>
            <Radio size={16} color={Colors.light.terracotta} />
            <Text style={styles.infoBannerText}>
              During live events, booths light up and some vendors stream video.
            </Text>
          </View>

          {liveEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Live Now</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{liveEvents.length}</Text>
                </View>
              </View>
              {liveEvents.map(event => renderEventCard(event))}
            </View>
          )}

          {upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{upcomingEvents.length}</Text>
                </View>
              </View>
              {upcomingEvents.map(event => renderEventCard(event))}
            </View>
          )}

          {pastEvents.length > 0 && (
            <View style={[styles.section, { marginBottom: 32 }]}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setPastEventsExpanded(!pastEventsExpanded)}
              >
                <Text style={styles.sectionTitle}>Past Events</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{pastEvents.length}</Text>
                </View>
                {pastEventsExpanded ? (
                  <ChevronUp size={20} color={Colors.light.text} />
                ) : (
                  <ChevronDown size={20} color={Colors.light.text} />
                )}
              </TouchableOpacity>
              {pastEventsExpanded && pastEvents.map(event => renderEventCard(event))}
            </View>
          )}

          {liveEvents.length === 0 && upcomingEvents.length === 0 && pastEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Calendar size={64} color={Colors.light.muted} />
              <Text style={styles.emptyTitle}>No Events Available</Text>
              <Text style={styles.emptyDescription}>
                Check back soon for upcoming craft fairs and markets!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.oceanDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.white,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  countBadge: {
    backgroundColor: Colors.light.sunsetCoral,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  eventCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventContent: {
    padding: 20,
  },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  statusChipLive: {
    backgroundColor: Colors.light.accentLight,
  },
  statusChipUpcoming: {
    backgroundColor: Colors.light.sageLight,
  },
  statusChipPast: {
    backgroundColor: Colors.light.softGray,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusChipTextLive: {
    color: Colors.light.terracotta,
  },
  statusChipTextUpcoming: {
    color: Colors.light.sage,
  },
  statusChipTextPast: {
    color: Colors.light.muted,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.charcoal,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  liveButton: {
    backgroundColor: Colors.light.sunsetCoral,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  liveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.card,
  },
  upcomingActions: {
    marginTop: 16,
    gap: 10,
  },
  detailsButton: {
    backgroundColor: Colors.light.sage,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.card,
  },
  calendarButton: {
    borderWidth: 1.5,
    borderColor: Colors.light.sage,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.sage,
  },
  recapButton: {
    backgroundColor: Colors.light.softGray,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  recapButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
});
