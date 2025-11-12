import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Save,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/app/constants/colors';
import { vendors } from '@/mocks/vendors';
import { events } from '@/mocks/events';

interface EventVendorFee {
  eventId: string;
  eventTitle: string;
  feeRequired: boolean;
  feeStatus: 'pending' | 'paid' | 'waived';
}

export default function AdminVendorDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const vendor = vendors.find((v) => v.id === id);

  const [marketplaceFeeOverride, setMarketplaceFeeOverride] = useState<string>(
    vendor?.billingOverrideMarketplaceFeeAmount?.toString() || ''
  );
  const [eventFeeOverride, setEventFeeOverride] = useState<string>('');
  const [waiveMarketplaceFee, setWaiveMarketplaceFee] = useState(false);

  const [eventFees, setEventFees] = useState<EventVendorFee[]>(
    events.map((event) => ({
      eventId: event.id,
      eventTitle: event.title,
      feeRequired: true,
      feeStatus: 'pending',
    }))
  );

  if (!vendor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Vendor not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    console.log('Saving vendor billing overrides:', {
      vendorId: vendor.id,
      marketplaceFeeOverride: marketplaceFeeOverride
        ? parseFloat(marketplaceFeeOverride)
        : null,
      eventFeeOverride: eventFeeOverride ? parseFloat(eventFeeOverride) : null,
      waiveMarketplaceFee,
      eventFees,
    });
    router.back();
  };

  const toggleEventFeeRequired = (eventId: string) => {
    setEventFees((prev) =>
      prev.map((ef) =>
        ef.eventId === eventId ? { ...ef, feeRequired: !ef.feeRequired } : ef
      )
    );
  };

  const updateEventFeeStatus = (
    eventId: string,
    status: 'pending' | 'paid' | 'waived'
  ) => {
    setEventFees((prev) =>
      prev.map((ef) =>
        ef.eventId === eventId ? { ...ef, feeStatus: status } : ef
      )
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Billing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.vendorHeader}>
          <Image source={{ uri: vendor.avatar }} style={styles.vendorAvatar} />
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.vendorSpecialty}>{vendor.specialty}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Marketplace Fee Override</Text>
        <Text style={styles.helperText}>
          Leave blank to use global settings. Enter a custom amount to override.
        </Text>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Custom Marketplace Fee Amount</Text>
          <View style={styles.currencyInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={marketplaceFeeOverride}
              onChangeText={setMarketplaceFeeOverride}
              keyboardType="decimal-pad"
              placeholder="Use global"
              placeholderTextColor={Colors.nautical.sand}
            />
            <Text style={styles.currencyCode}>USD</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Waive Marketplace Fee</Text>
              <Text style={styles.toggleSubtext}>
                Vendor will not be charged for marketplace listing
              </Text>
            </View>
            <Switch
              value={waiveMarketplaceFee}
              onValueChange={setWaiveMarketplaceFee}
              trackColor={{
                false: Colors.nautical.sand,
                true: Colors.nautical.teal,
              }}
              thumbColor={Colors.white}
            />
          </View>

          {waiveMarketplaceFee && (
            <View style={styles.infoBox}>
              <AlertCircle size={16} color={Colors.nautical.teal} />
              <Text style={styles.infoText}>
                Billing status will be set to waived for this vendor
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Event Fee Override</Text>
        <Text style={styles.helperText}>
          Set a custom per-event fee for this vendor across all events.
        </Text>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Custom Event Fee Amount</Text>
          <View style={styles.currencyInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={eventFeeOverride}
              onChangeText={setEventFeeOverride}
              keyboardType="decimal-pad"
              placeholder="Use global"
              placeholderTextColor={Colors.nautical.sand}
            />
            <Text style={styles.currencyCode}>USD</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Per-Event Fee Settings</Text>
        <Text style={styles.helperText}>
          Manage fee requirements and payment status for each event this vendor
          participates in.
        </Text>

        {eventFees.map((eventFee) => (
          <View key={eventFee.eventId} style={styles.eventCard}>
            <View style={styles.eventCardHeader}>
              <Calendar size={18} color={Colors.nautical.teal} />
              <Text style={styles.eventTitle}>{eventFee.eventTitle}</Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Fee Required</Text>
              <Switch
                value={eventFee.feeRequired}
                onValueChange={() => toggleEventFeeRequired(eventFee.eventId)}
                trackColor={{
                  false: Colors.nautical.sand,
                  true: Colors.nautical.teal,
                }}
                thumbColor={Colors.white}
              />
            </View>

            {eventFee.feeRequired && (
              <View style={styles.feeStatusSection}>
                <Text style={styles.feeStatusLabel}>Payment Status</Text>
                <View style={styles.feeStatusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.feeStatusButton,
                      eventFee.feeStatus === 'pending' &&
                        styles.feeStatusButtonActive,
                    ]}
                    onPress={() =>
                      updateEventFeeStatus(eventFee.eventId, 'pending')
                    }
                  >
                    <Text
                      style={[
                        styles.feeStatusButtonText,
                        eventFee.feeStatus === 'pending' &&
                          styles.feeStatusButtonTextActive,
                      ]}
                    >
                      Pending
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.feeStatusButton,
                      eventFee.feeStatus === 'paid' &&
                        styles.feeStatusButtonActive,
                    ]}
                    onPress={() =>
                      updateEventFeeStatus(eventFee.eventId, 'paid')
                    }
                  >
                    <Text
                      style={[
                        styles.feeStatusButtonText,
                        eventFee.feeStatus === 'paid' &&
                          styles.feeStatusButtonTextActive,
                      ]}
                    >
                      Paid
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.feeStatusButton,
                      eventFee.feeStatus === 'waived' &&
                        styles.feeStatusButtonActive,
                    ]}
                    onPress={() =>
                      updateEventFeeStatus(eventFee.eventId, 'waived')
                    }
                  >
                    <Text
                      style={[
                        styles.feeStatusButtonText,
                        eventFee.feeStatus === 'waived' &&
                          styles.feeStatusButtonTextActive,
                      ]}
                    >
                      Waived
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.nautical.oceanDeep,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  vendorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  vendorSpecialty: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.nautical.sand,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
    lineHeight: 18,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    padding: 0,
  },
  currencyCode: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    marginLeft: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 2,
  },
  toggleSubtext: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.nautical.oceanDeep,
    lineHeight: 16,
  },
  eventCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    flex: 1,
  },
  feeStatusSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  feeStatusLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  feeStatusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feeStatusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  feeStatusButtonActive: {
    borderColor: Colors.nautical.teal,
    backgroundColor: Colors.nautical.teal,
  },
  feeStatusButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  feeStatusButtonTextActive: {
    color: Colors.white,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.teal,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  errorText: {
    fontSize: 16,
    color: Colors.nautical.driftwood,
    textAlign: 'center',
    marginTop: 40,
  },
});
