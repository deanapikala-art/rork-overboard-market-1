import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Truck, Package, MapPin, Clock, Save, CheckCircle, Shield } from 'lucide-react-native';
import { useVendorAuth } from './contexts/VendorAuthContext';
import Colors from '@/app/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PickupSafetyTipsModal from './components/PickupSafetyTipsModal';

interface ShippingSettings {
  flatPerItem: string;
  flatPerOrder: string;
  freeShippingThreshold: string;
  allowLocalPickup: boolean;
  pickupInstructions: string;
  handlingDays: string;
  deliveryMessage: string;
  pickupOriginZip: string;
  pickupAddressHidden: boolean;
  pickupPublicLabel: string;
  pickupNotes: string;
  pickupRadiusMiles: string;
  pickupGeoLat?: number;
  pickupGeoLon?: number;
}

const STORAGE_KEY = '@overboard_vendor_shipping_settings';



export default function VendorShippingSettingsScreen() {
  const router = useRouter();
  const { profile } = useVendorAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyModalSeen, setSafetyModalSeen] = useState(false);

  const [settings, setSettings] = useState<ShippingSettings>({
    flatPerItem: '',
    flatPerOrder: '',
    freeShippingThreshold: '',
    allowLocalPickup: false,
    pickupInstructions: '',
    handlingDays: '2',
    deliveryMessage: '',
    pickupOriginZip: '',
    pickupAddressHidden: true,
    pickupPublicLabel: '',
    pickupNotes: '',
    pickupRadiusMiles: '75',
    pickupGeoLat: undefined,
    pickupGeoLon: undefined,
  });

  useEffect(() => {
    loadSettings();
    loadSafetyPreference();
  }, [profile?.id]);

  const loadSafetyPreference = async () => {
    if (!profile?.id) return;
    try {
      const key = `@pickup_safety_seen_vendor_${profile.id}`;
      const seen = await AsyncStorage.getItem(key);
      setSafetyModalSeen(seen === 'true');
    } catch (error) {
      console.error('[ShippingSettings] Error loading safety preference:', error);
    }
  };

  const loadSettings = async () => {
    if (!profile?.id) return;

    try {
      const storageKey = `${STORAGE_KEY}_${profile.id}`;
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        console.log('[ShippingSettings] Loaded settings for vendor:', profile.id);
      }
    } catch (error) {
      console.error('[ShippingSettings] Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      const storageKey = `${STORAGE_KEY}_${profile.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(settings));
      console.log('[ShippingSettings] Settings saved for vendor:', profile.id);
      
      setHasChanges(false);
      
      if (Platform.OS === 'web') {
        alert('✅ Shipping settings saved successfully.');
      } else {
        Alert.alert('Success', '✅ Shipping settings saved successfully.');
      }
    } catch (error) {
      console.error('[ShippingSettings] Error saving settings:', error);
      
      if (Platform.OS === 'web') {
        alert('Failed to save settings. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save settings. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof ShippingSettings>(
    key: K,
    value: ShippingSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);

    if (key === 'allowLocalPickup' && value === true && !safetyModalSeen) {
      setShowSafetyModal(true);
    }
  };

  const handleSafetyModalClose = () => {
    setShowSafetyModal(false);
  };

  const handleDontShowAgain = async (value: boolean) => {
    if (value && profile?.id) {
      try {
        const key = `@pickup_safety_seen_vendor_${profile.id}`;
        await AsyncStorage.setItem(key, 'true');
        setSafetyModalSeen(true);
        console.log('[ShippingSettings] Safety preference saved');
      } catch (error) {
        console.error('[ShippingSettings] Error saving safety preference:', error);
      }
    }
  };

  const calculateShippingPreview = () => {
    const flatPerItem = parseFloat(settings.flatPerItem) || 0;
    const flatPerOrder = parseFloat(settings.flatPerOrder) || 0;
    const freeThreshold = parseFloat(settings.freeShippingThreshold) || 0;
    const handlingDays = parseInt(settings.handlingDays, 10) || 2;

    let previewText = '';

    if (flatPerItem > 0 || flatPerOrder > 0) {
      if (flatPerItem > 0 && flatPerOrder > 0) {
        previewText = `Shipping from $${flatPerItem.toFixed(2)} per item or $${flatPerOrder.toFixed(2)} per order (lower applies)`;
      } else if (flatPerItem > 0) {
        previewText = `Shipping $${flatPerItem.toFixed(2)} per item`;
      } else {
        previewText = `Shipping $${flatPerOrder.toFixed(2)} per order`;
      }
    } else {
      previewText = 'Shipping rates not set';
    }

    if (freeThreshold > 0) {
      previewText += ` • Free over $${freeThreshold.toFixed(2)}`;
    }

    previewText += ` • Est. delivery ${handlingDays + 3}-${handlingDays + 7} days`;

    if (settings.allowLocalPickup) {
      previewText += ' • Local pickup available';
    }

    return previewText;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Shipping Settings',
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { color: Colors.light.text },
          headerRight: () =>
            hasChanges ? (
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={styles.headerSaveButton}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.nautical.teal} />
                ) : (
                  <Text style={styles.headerSaveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            ) : null,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shipping Settings</Text>
            <Text style={styles.headerDescription}>
              Set how you charge for shipping and give customers clear expectations for
              delivery or local pickup.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Flat Rate Options</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Choose how you charge for shipping.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Flat rate per item</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={settings.flatPerItem}
                  onChangeText={(text) => updateSetting('flatPerItem', text)}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.helpText}>
                Charge this amount for each item purchased.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Flat rate per order</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={settings.flatPerOrder}
                  onChangeText={(text) => updateSetting('flatPerOrder', text)}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.helpText}>
                Charge this total shipping cost once per order, regardless of items.
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 If both are filled, the system will use whichever gives the customer the
                lower total.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Free Shipping Threshold</Text>
            </View>
            <Text style={styles.sectionDescription}>Encourage larger orders.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Free shipping for orders over</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={settings.freeShippingThreshold}
                  onChangeText={(text) => updateSetting('freeShippingThreshold', text)}
                  placeholder="0.00"
                  placeholderTextColor={Colors.light.muted}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.helpText}>
                Set a total purchase amount that qualifies for free shipping.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Local Pickup</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Offer free pickup for local customers.
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Text style={styles.switchLabel}>Enable Local Pickup</Text>
                <Text style={styles.switchSubtext}>
                  When turned on, customers can select pickup at checkout.
                </Text>
              </View>
              <Switch
                value={settings.allowLocalPickup}
                onValueChange={(val) => updateSetting('allowLocalPickup', val)}
                trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
                thumbColor={Colors.white}
              />
            </View>

            {settings.allowLocalPickup && (
              <>
                <TouchableOpacity
                  style={styles.safetyTipsButton}
                  onPress={() => setShowSafetyModal(true)}
                >
                  <Shield size={18} color={Colors.nautical.teal} />
                  <Text style={styles.safetyTipsButtonText}>View Pickup Safety Tips</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    💡 Your full address will never be shown publicly. Customers will only see the location name you provide below.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pickup ZIP Code</Text>
                  <TextInput
                    style={[styles.input, styles.narrowInput]}
                    value={settings.pickupOriginZip}
                    onChangeText={(text) => updateSetting('pickupOriginZip', text)}
                    placeholder="54016"
                    placeholderTextColor={Colors.light.muted}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  <Text style={styles.helpText}>
                    Used to calculate distance for local pickup availability.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Public Location Name</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.pickupPublicLabel}
                    onChangeText={(text) => updateSetting('pickupPublicLabel', text)}
                    placeholder="Hudson, WI – Downtown Park & Ride"
                    placeholderTextColor={Colors.light.muted}
                  />
                  <Text style={styles.helpText}>
                    This is what customers will see. Use a general area or public meeting spot.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pickup Radius (miles)</Text>
                  <View style={styles.radiusSelector}>
                    {['25', '50', '75', '100'].map((radius) => (
                      <TouchableOpacity
                        key={radius}
                        style={[
                          styles.radiusButton,
                          settings.pickupRadiusMiles === radius && styles.radiusButtonActive,
                        ]}
                        onPress={() => updateSetting('pickupRadiusMiles', radius)}
                      >
                        <Text
                          style={[
                            styles.radiusButtonText,
                            settings.pickupRadiusMiles === radius && styles.radiusButtonTextActive,
                          ]}
                        >
                          {radius} mi
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.helpText}>
                    Customers outside this radius won't see the pickup option.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pickup Instructions</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={settings.pickupNotes}
                    onChangeText={(text) => updateSetting('pickupNotes', text)}
                    placeholder="Example: Pickup by appointment. Message me to schedule a time."
                    placeholderTextColor={Colors.light.muted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <Text style={styles.helpText}>
                    Additional details customers should know about pickup.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pickup Coordinates (Optional)</Text>
                  <Text style={styles.helpText} style={{ marginBottom: 12 }}>
                    💡 Find coordinates using Google Maps. Right-click on your location and copy the coordinates.
                  </Text>
                  <View style={styles.coordinatesInputRow}>
                    <View style={styles.coordinateInput}>
                      <Text style={styles.coordinateLabel}>Latitude</Text>
                      <TextInput
                        style={styles.input}
                        value={settings.pickupGeoLat?.toString() || ''}
                        onChangeText={(text) => {
                          const val = parseFloat(text);
                          if (!isNaN(val)) {
                            updateSetting('pickupGeoLat', val);
                          }
                        }}
                        placeholder="0.000"
                        placeholderTextColor={Colors.light.muted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.coordinateInput}>
                      <Text style={styles.coordinateLabel}>Longitude</Text>
                      <TextInput
                        style={styles.input}
                        value={settings.pickupGeoLon?.toString() || ''}
                        onChangeText={(text) => {
                          const val = parseFloat(text);
                          if (!isNaN(val)) {
                            updateSetting('pickupGeoLon', val);
                          }
                        }}
                        placeholder="0.000"
                        placeholderTextColor={Colors.light.muted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  {settings.pickupGeoLat && settings.pickupGeoLon && (
                    <TouchableOpacity
                      style={styles.viewInMapsButton}
                      onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${settings.pickupGeoLat},${settings.pickupGeoLon}`;
                        if (Platform.OS === 'web') {
                          window.open(url, '_blank');
                        } else {
                          import('expo-linking').then(Linking => {
                            Linking.openURL(url);
                          });
                        }
                      }}
                    >
                      <Text style={styles.viewInMapsButtonText}>📍 View in Google Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {settings.pickupPublicLabel && settings.pickupOriginZip.length === 5 && (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewLabel}>Pickup Preview (Customer View)</Text>
                    <View style={styles.pickupPreview}>
                      <MapPin size={18} color={Colors.nautical.teal} />
                      <View style={styles.pickupPreviewText}>
                        <Text style={styles.pickupPreviewTitle}>{settings.pickupPublicLabel}</Text>
                        <Text style={styles.pickupPreviewSubtitle}>
                          Available within {settings.pickupRadiusMiles} miles
                        </Text>
                        {settings.pickupNotes && (
                          <Text style={styles.pickupPreviewNotes}>{settings.pickupNotes}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

        <PickupSafetyTipsModal
          visible={showSafetyModal}
          onClose={handleSafetyModalClose}
          userType="vendor"
          onDontShowAgain={handleDontShowAgain}
          showDontShowAgain={true}
        />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Handling & Delivery</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Set basic expectations for fulfillment time.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Handling time (days)</Text>
              <TextInput
                style={[styles.input, styles.narrowInput]}
                value={settings.handlingDays}
                onChangeText={(text) => updateSetting('handlingDays', text)}
                placeholder="2"
                placeholderTextColor={Colors.light.muted}
                keyboardType="number-pad"
              />
              <Text style={styles.helpText}>
                Days between receiving payment and shipping the order.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shipping note to customers (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.deliveryMessage}
                onChangeText={(text) => updateSetting('deliveryMessage', text)}
                placeholder="Example: Orders ship Mon–Fri. Tracking provided once shipped."
                placeholderTextColor={Colors.light.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color={Colors.nautical.teal} />
              <Text style={styles.sectionTitle}>Preview</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Customers will see this on your listings:
            </Text>

            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{calculateShippingPreview()}</Text>
            </View>
          </View>

          {hasChanges && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Save size={20} color={Colors.white} />
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {!settings.flatPerItem &&
            !settings.flatPerOrder &&
            !settings.allowLocalPickup && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You haven't set up shipping rates yet. Add your flat rates or pickup options
                  to start taking orders.
                </Text>
              </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 15,
    color: Colors.light.muted,
    lineHeight: 22,
  },
  headerSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerSaveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: 'transparent',
  },
  narrowInput: {
    backgroundColor: Colors.nautical.sandLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    maxWidth: 100,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
    backgroundColor: Colors.nautical.sandLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
  },
  helpText: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  switchContent: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  previewBox: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  previewText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.teal,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  emptyState: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: Colors.light.border,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  radiusSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  radiusButton: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.nautical.sandLight,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  radiusButtonActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  radiusButtonTextActive: {
    color: Colors.white,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 12,
  },
  pickupPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start' as const,
    gap: 10,
  },
  pickupPreviewText: {
    flex: 1,
    gap: 4,
  },
  pickupPreviewTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  pickupPreviewSubtitle: {
    fontSize: 13,
    color: Colors.nautical.teal,
    fontWeight: '500' as const,
  },
  pickupPreviewNotes: {
    fontSize: 12,
    color: Colors.light.muted,
    lineHeight: 16,
    marginTop: 4,
  },

  safetyTipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    marginBottom: 16,
  },
  safetyTipsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },

  coordinatesInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginBottom: 6,
  },
  viewInMapsButton: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  viewInMapsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
