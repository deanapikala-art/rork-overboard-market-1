import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWorkshops, Workshop } from '@/app/contexts/WorkshopsContext';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';

export default function WorkshopsScreen() {
  const router = useRouter();
  const { profile } = useCustomerAuth();
  const {
    workshops,
    myRegistrations,
    fetchWorkshops,
    fetchMyRegistrations,
    registerForWorkshop,
    cancelRegistration,
  } = useWorkshops();

  const [filterType, setFilterType] = useState<'all' | 'in_person' | 'online'>('all');
  const [viewMode, setViewMode] = useState<'browse' | 'registered'>('browse');

  useEffect(() => {
    fetchWorkshops({ status: 'published' });
    if (profile) {
      fetchMyRegistrations();
    }
  }, [profile, fetchWorkshops, fetchMyRegistrations]);

  const handleRegister = async (workshop: Workshop) => {
    if (!profile) {
      Alert.alert('Sign In Required', 'Please sign in to register for workshops', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/customer-auth') },
      ]);
      return;
    }

    const alreadyRegistered = myRegistrations.some(r => r.workshop_id === workshop.id);
    if (alreadyRegistered) {
      Alert.alert('Already Registered', 'You are already registered for this workshop');
      return;
    }

    if ((workshop.registrations_count || 0) >= workshop.max_attendees) {
      Alert.alert('Workshop Full', 'This workshop has reached maximum capacity');
      return;
    }

    Alert.alert(
      'Register for Workshop',
      `${workshop.title}\n\n${workshop.price_cents > 0 ? `Price: $${(workshop.price_cents / 100).toFixed(2)}` : 'Free'}\n\nAre you sure you want to register?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            const result = await registerForWorkshop(workshop.id);
            if (result.success) {
              Alert.alert('Success', 'You are now registered for this workshop!');
              fetchWorkshops({ status: 'published' });
            } else {
              Alert.alert('Error', result.error || 'Failed to register');
            }
          },
        },
      ]
    );
  };

  const handleCancelRegistration = (registrationId: string, workshopTitle: string) => {
    Alert.alert(
      'Cancel Registration',
      `Are you sure you want to cancel your registration for "${workshopTitle}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelRegistration(registrationId);
            if (result.success) {
              Alert.alert('Cancelled', 'Registration cancelled');
              fetchWorkshops({ status: 'published' });
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel');
            }
          },
        },
      ]
    );
  };

  const filteredWorkshops =
    filterType === 'all' ? workshops : workshops.filter(w => w.type === filterType);

  const upcomingWorkshops = filteredWorkshops.filter(w => new Date(w.date) >= new Date());

  const isRegistered = (workshopId: string) =>
    myRegistrations.some(r => r.workshop_id === workshopId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workshops</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.viewModeBar}>
        <TouchableOpacity
          onPress={() => setViewMode('browse')}
          style={[
            styles.viewModeButton,
            viewMode === 'browse' && styles.viewModeButtonActive,
          ]}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'browse' && styles.viewModeTextActive,
            ]}
          >
            Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('registered')}
          style={[
            styles.viewModeButton,
            viewMode === 'registered' && styles.viewModeButtonActive,
          ]}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'registered' && styles.viewModeTextActive,
            ]}
          >
            My Workshops ({myRegistrations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'browse' && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'in_person', 'online'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilterType(type)}
                style={[
                  styles.filterChip,
                  filterType === type && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === type && styles.filterChipTextActive,
                  ]}
                >
                  {type === 'all' ? 'All' : type === 'in_person' ? 'In-Person' : 'Online'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {viewMode === 'browse' ? (
          upcomingWorkshops.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No workshops available</Text>
              <Text style={styles.emptySubtext}>
                Check back soon for new workshops and events
              </Text>
            </View>
          ) : (
            upcomingWorkshops.map(workshop => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                isRegistered={isRegistered(workshop.id)}
                onRegister={() => handleRegister(workshop)}
              />
            ))
          )
        ) : myRegistrations.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No registrations yet</Text>
            <Text style={styles.emptySubtext}>
              Browse workshops to find classes that interest you
            </Text>
            <TouchableOpacity
              onPress={() => setViewMode('browse')}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>Browse Workshops</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myRegistrations.map(registration => {
            const workshop = (registration as any).workshop;
            if (!workshop) return null;

            return (
              <View key={registration.id} style={styles.registrationCard}>
                <WorkshopCard workshop={workshop} isRegistered />
                <View style={styles.registrationInfo}>
                  <View style={styles.registrationStatus}>
                    <Text style={styles.registrationLabel}>Status:</Text>
                    <Text style={styles.registrationValue}>
                      {registration.attendance_status}
                    </Text>
                  </View>
                  <View style={styles.registrationStatus}>
                    <Text style={styles.registrationLabel}>Payment:</Text>
                    <Text style={styles.registrationValue}>
                      {registration.payment_status}
                    </Text>
                  </View>
                </View>
                {workshop.type === 'online' && workshop.meeting_link && (
                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingLabel}>Meeting Link:</Text>
                    <Text style={styles.meetingLink}>{workshop.meeting_link}</Text>
                    {workshop.meeting_password && (
                      <Text style={styles.meetingPassword}>
                        Password: {workshop.meeting_password}
                      </Text>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => handleCancelRegistration(registration.id, workshop.title)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel Registration</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkshopCard({
  workshop,
  isRegistered,
  onRegister,
}: {
  workshop: Workshop;
  isRegistered: boolean;
  onRegister?: () => void;
}) {
  const isFull = (workshop.registrations_count || 0) >= workshop.max_attendees;
  const spotsLeft = workshop.max_attendees - (workshop.registrations_count || 0);

  return (
    <View style={styles.workshopCard}>
      {workshop.image_url && (
        <Image source={{ uri: workshop.image_url }} style={styles.workshopImage} />
      )}

      <View style={styles.workshopContent}>
        <View style={styles.workshopHeader}>
          <View style={styles.workshopType}>
            {workshop.type === 'in_person' ? (
              <MapPin size={16} color={Colors.primary} />
            ) : (
              <Video size={16} color={Colors.secondary} />
            )}
            <Text style={styles.workshopTypeText}>
              {workshop.type === 'in_person' ? 'In-Person' : 'Online'}
            </Text>
          </View>
          {workshop.vendor && (
            <Text style={styles.vendorName}>{workshop.vendor.business_name}</Text>
          )}
        </View>

        <Text style={styles.workshopTitle}>{workshop.title}</Text>
        <Text style={styles.workshopDescription} numberOfLines={2}>
          {workshop.description}
        </Text>

        <View style={styles.workshopMeta}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={Colors.textLight} />
            <Text style={styles.metaText}>
              {new Date(workshop.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textLight} />
            <Text style={styles.metaText}>
              {workshop.start_time} - {workshop.end_time}
            </Text>
          </View>
        </View>

        {workshop.type === 'in_person' && workshop.location && (
          <View style={styles.locationInfo}>
            <MapPin size={14} color={Colors.textLight} />
            <Text style={styles.locationText}>{workshop.location}</Text>
          </View>
        )}

        <View style={styles.workshopFooter}>
          <View style={styles.priceInfo}>
            {workshop.price_cents > 0 ? (
              <>
                <DollarSign size={16} color={Colors.primary} />
                <Text style={styles.priceText}>
                  ${(workshop.price_cents / 100).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.freeText}>Free</Text>
            )}
          </View>
          <View style={styles.attendeeInfo}>
            <Users size={14} color={Colors.textLight} />
            <Text style={styles.attendeeText}>
              {spotsLeft} spots left
            </Text>
          </View>
        </View>

        {onRegister && (
          <TouchableOpacity
            onPress={onRegister}
            style={[
              styles.registerButton,
              (isRegistered || isFull) && styles.registerButtonDisabled,
            ]}
            disabled={isRegistered || isFull}
          >
            <Text
              style={[
                styles.registerButtonText,
                (isRegistered || isFull) && styles.registerButtonTextDisabled,
              ]}
            >
              {isRegistered ? 'Registered' : isFull ? 'Full' : 'Register'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  viewModeBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  viewModeTextActive: {
    color: '#fff',
  },
  filterBar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  workshopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  workshopImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  workshopContent: {
    padding: 16,
  },
  workshopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workshopType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workshopTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textLight,
  },
  vendorName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  workshopTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  workshopDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  workshopMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  workshopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  freeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendeeText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: Colors.border,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  registerButtonTextDisabled: {
    color: Colors.textLight,
  },
  registrationCard: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  registrationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginTop: 12,
  },
  registrationStatus: {
    alignItems: 'center',
  },
  registrationLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  registrationValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  meetingInfo: {
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginTop: 12,
  },
  meetingLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  meetingLink: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 4,
  },
  meetingPassword: {
    fontSize: 12,
    color: Colors.textLight,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
});
