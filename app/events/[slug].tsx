import { Image } from 'expo-image';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Store, MapPin, ArrowRight, Radio, Plus, Download } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/app/constants/colors';
import { events } from '@/mocks/events';
import { vendors } from '@/mocks/vendors';
import { CAL } from '@/app/utils/calendar';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const difference = +new Date(targetDate) - +new Date();
  
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  
  return null;
}

export default function EventDetailsScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const eventId = Array.isArray(slug) ? slug[0] : slug;
  const event = events.find(e => e.id === eventId);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    event?.status === 'upcoming' ? calculateTimeLeft(event.date) : null
  );

  useEffect(() => {
    if (event?.status !== 'upcoming') return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(event.date));
    }, 1000);

    return () => clearInterval(timer);
  }, [event?.date, event?.status]);

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ title: 'Event Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const featuredVendors = vendors.slice(0, 4);

  const handleExploreFairground = () => {
    if (event.status === 'live') {
      router.push(`/events/${eventId}/booths` as any);
    } else {
      router.push(`/events/${eventId}/booths` as any);
    }
  };

  const handleAddToCalendar = (type: 'google' | 'apple' | 'outlook' | 'ics') => {
    const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.id}`;

    switch (type) {
      case 'google': {
        const url = CAL.googleLink({
          title: event.title,
          details: event.description,
          startIso: event.date,
          endIso: event.endDate,
        });
        Linking.openURL(url);
        break;
      }
      case 'outlook': {
        const url = CAL.outlookLink({
          title: event.title,
          details: event.description,
          startIso: event.date,
          endIso: event.endDate,
        });
        Linking.openURL(url);
        break;
      }
      case 'apple':
      case 'ics': {
        const icsContent = CAL.icsContent({
          title: event.title,
          details: event.description,
          startIso: event.date,
          endIso: event.endDate,
          url: eventUrl,
        });
        const filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
        
        if (Platform.OS === 'web') {
          CAL.downloadIcs(icsContent, filename);
        } else {
          Alert.alert(
            'Download Calendar File',
            'Please use the Google or Outlook option to add this event to your calendar on mobile devices.',
            [
              { text: 'Try Google Calendar', onPress: () => handleAddToCalendar('google') },
              { text: 'Try Outlook', onPress: () => handleAddToCalendar('outlook') },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
        break;
      }
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: event.title,
          headerStyle: {
            backgroundColor: Colors.light.cream,
          },
          headerTintColor: Colors.light.text,
        }} 
      />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Image
            source={{ uri: event.image }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            {event.status === 'live' && (
              <View style={styles.liveBadge}>
                <Radio size={14} color={Colors.light.card} />
                <Text style={styles.liveBadgeText}>Live Now</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>{event.title}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.dateSection}>
            <View style={styles.dateItem}>
              <Calendar size={18} color={Colors.light.sage} />
              <Text style={styles.dateText}>
                {formatDate(event.date)} - {formatDate(event.endDate)}
              </Text>
            </View>
            {event.time && (
              <Text style={styles.timeText}>{event.time}</Text>
            )}
            <View style={styles.dateItem}>
              <Store size={18} color={Colors.light.sage} />
              <Text style={styles.dateText}>{event.vendorCount} vendors participating</Text>
            </View>
          </View>

          {event.status === 'upcoming' && timeLeft && (
            <View style={styles.countdownSection}>
              <Text style={styles.countdownLabel}>Event starts in:</Text>
              <View style={styles.countdownGrid}>
                {timeLeft.days > 0 && (
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownNumber}>{timeLeft.days}</Text>
                    <Text style={styles.countdownUnit}>Days</Text>
                  </View>
                )}
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownNumber}>
                    {String(timeLeft.hours).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownUnit}>Hours</Text>
                </View>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownNumber}>
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownNumber}>
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownUnit}>Seconds</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.calendarSection}>
            <Text style={styles.calendarTitle}>Add to Calendar</Text>
            <Text style={styles.calendarHelper}>
              Times will appear in your local timezone when added.
            </Text>
            <View style={styles.calendarButtons}>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => handleAddToCalendar('google')}
              >
                <Plus size={18} color={Colors.light.sage} />
                <Text style={styles.calendarButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => handleAddToCalendar('apple')}
              >
                <Plus size={18} color={Colors.light.sage} />
                <Text style={styles.calendarButtonText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => handleAddToCalendar('outlook')}
              >
                <Plus size={18} color={Colors.light.sage} />
                <Text style={styles.calendarButtonText}>Outlook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => handleAddToCalendar('ics')}
              >
                <Download size={18} color={Colors.light.sage} />
                <Text style={styles.calendarButtonText}>.ICS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>

          {featuredVendors.length > 0 && (
            <View style={styles.vendorsSection}>
              <Text style={styles.sectionTitle}>Featured Vendors</Text>
              <View style={styles.vendorGrid}>
                {featuredVendors.map(vendor => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={styles.vendorCard}
                    onPress={() => router.push(`/vendor/${vendor.id}` as any)}
                  >
                    <Image
                      source={{ uri: vendor.avatar }}
                      style={styles.vendorAvatar}
                      contentFit="cover"
                    />
                    <Text style={styles.vendorName} numberOfLines={1}>
                      {vendor.name}
                    </Text>
                    <Text style={styles.vendorSpecialty} numberOfLines={1}>
                      {vendor.specialty}
                    </Text>
                    {vendor.isLive && (
                      <View style={styles.vendorLiveBadge}>
                        <Radio size={8} color={Colors.light.terracotta} />
                        <Text style={styles.vendorLiveText}>Live</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push(`/events/${eventId}/booths` as any)}
              >
                <Text style={styles.viewAllText}>Browse Vendor Booths</Text>
                <ArrowRight size={16} color={Colors.light.sage} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.mainCTA,
              event.status === 'live' && styles.mainCTALive,
            ]}
            onPress={handleExploreFairground}
          >
            {event.status === 'live' ? (
              <>
                <Radio size={20} color={Colors.light.card} />
                <Text style={styles.mainCTAText}>Enter the Fairground</Text>
              </>
            ) : (
              <>
                <MapPin size={20} color={Colors.light.card} />
                <Text style={styles.mainCTAText}>Explore the Fairground</Text>
              </>
            )}
          </TouchableOpacity>

          {event.status === 'live' && (
            <View style={styles.liveInfoBanner}>
              <Text style={styles.liveInfoText}>
                🎪 The fair is happening now! Explore booths, watch live streams, and shop from makers in real-time.
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.push('/legal/customer-terms')}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLinkText}>Customer Terms & Conditions</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
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
    textAlign: 'center',
  },
  heroSection: {
    height: 300,
    position: 'relative' as const,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  heroContent: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  liveBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.light.card,
    lineHeight: 34,
  },
  content: {
    padding: 20,
  },
  dateSection: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.muted,
    marginLeft: 28,
  },
  countdownSection: {
    backgroundColor: Colors.light.sageLight,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.sage,
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  countdownBox: {
    backgroundColor: Colors.light.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.light.sage,
    fontVariant: ['tabular-nums'] as any,
  },
  countdownUnit: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginTop: 4,
    textTransform: 'uppercase' as const,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.light.text,
  },
  vendorsSection: {
    marginBottom: 24,
  },
  vendorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  vendorCard: {
    width: '48%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vendorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  vendorSpecialty: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center',
  },
  vendorLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  vendorLiveText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.sage,
    gap: 8,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.sage,
  },
  mainCTA: {
    backgroundColor: Colors.light.sage,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: Colors.light.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  mainCTALive: {
    backgroundColor: Colors.light.terracotta,
    shadowColor: Colors.light.terracotta,
  },
  mainCTAText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  liveInfoBanner: {
    backgroundColor: Colors.light.accentLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  liveInfoText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    textAlign: 'center',
  },
  calendarSection: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  calendarHelper: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  calendarButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendarButton: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.sage,
    backgroundColor: Colors.light.card,
    gap: 8,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.sage,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 24,
    gap: 12,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.muted,
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: 12,
    color: Colors.light.muted,
  },
});
