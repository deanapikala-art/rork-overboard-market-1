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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  Clock,
  Calendar,
  MessageCircle,
  Info,
  Check,
  AlertCircle,
  ChevronRight
} from 'lucide-react-native';
import { useAutoResponder, AutoResponderMode, DEFAULT_MESSAGE_TEMPLATES } from '../contexts/AutoResponderContext';
import { useVendorAuth } from '../contexts/VendorAuthContext';

export default function AutoResponderSettingsScreen() {
  const router = useRouter();
  const { profile } = useVendorAuth();
  const {
    settings,
    isLoading,
    isSaving,
    error,
    loadSettings,
    createSettings,
    updateSettings,
    toggleEnabled,
    testAutoReply
  } = useAutoResponder();

  const [localEnabled, setLocalEnabled] = useState(false);
  const [localMode, setLocalMode] = useState<AutoResponderMode>('AfterHours');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [localCooldown, setLocalCooldown] = useState('12');
  const [localOpenTime, setLocalOpenTime] = useState('09:00');
  const [localCloseTime, setLocalCloseTime] = useState('17:00');
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState<{ shouldSend: boolean; reason: string } | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadSettings(profile.id);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (settings) {
      setLocalEnabled(settings.isEnabled);
      setLocalMode(settings.mode);
      setLocalStartDate(settings.startDate || '');
      setLocalEndDate(settings.endDate || '');
      setLocalMessage(settings.messageTemplate);
      setLocalCooldown(settings.cooldownHours.toString());
      setLocalOpenTime(settings.businessHours.open);
      setLocalCloseTime(settings.businessHours.close);
      setHasChanges(false);
    } else if (!isLoading && profile?.id) {
      setLocalMessage(DEFAULT_MESSAGE_TEMPLATES[localMode]);
    }
  }, [settings, isLoading]);

  const handleModeChange = (mode: AutoResponderMode) => {
    setLocalMode(mode);
    if (!settings || localMessage === DEFAULT_MESSAGE_TEMPLATES[localMode]) {
      setLocalMessage(DEFAULT_MESSAGE_TEMPLATES[mode]);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    const updates = {
      isEnabled: localEnabled,
      mode: localMode,
      startDate: localStartDate || undefined,
      endDate: localEndDate || undefined,
      businessHours: {
        open: localOpenTime,
        close: localCloseTime,
        timezone: 'America/Chicago'
      },
      messageTemplate: localMessage,
      triggerTypes: ['newMessage' as const, 'newOrder' as const],
      cooldownHours: parseInt(localCooldown, 10) || 12
    };

    let result;
    if (settings) {
      result = await updateSettings(profile.id, updates);
    } else {
      result = await createSettings(profile.id, updates);
    }

    if (result.success) {
      setHasChanges(false);
      if (Platform.OS === 'web') {
        alert('Auto-responder settings saved successfully!');
      } else {
        Alert.alert('Success', 'Auto-responder settings saved successfully!');
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Failed to save settings');
      } else {
        Alert.alert('Error', result.error || 'Failed to save settings');
      }
    }
  };

  const handleTest = async () => {
    if (!profile?.id) return;

    const result = await testAutoReply(profile.id);
    setTestResult(result);

    const message = result.shouldSend
      ? `✅ Auto-reply would be sent!\n\n${result.reason}`
      : `❌ Auto-reply would NOT be sent\n\n${result.reason}`;

    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Test Result', message);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (!profile?.id) return;

    setLocalEnabled(value);

    if (settings) {
      const result = await toggleEnabled(profile.id, value);
      if (!result.success) {
        setLocalEnabled(!value);
        if (Platform.OS === 'web') {
          alert(result.error || 'Failed to toggle auto-responder');
        } else {
          Alert.alert('Error', result.error || 'Failed to toggle auto-responder');
        }
      }
    } else {
      setHasChanges(true);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Auto-Responder',
            headerStyle: { backgroundColor: '#F2F2F7' }
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Auto-Responder',
          headerStyle: { backgroundColor: '#F2F2F7' },
          headerRight: () => (
            hasChanges ? (
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={styles.saveButton}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            ) : null
          )
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.sectionTitle}>Enable Auto-Responder</Text>
                <Text style={styles.sectionDescription}>
                  Automatically reply to messages when you're unavailable
                </Text>
              </View>
              <Switch
                value={localEnabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {localEnabled && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mode</Text>
                <Text style={styles.sectionDescription}>
                  Choose when auto-replies should be sent
                </Text>

                <View style={styles.modeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      localMode === 'AfterHours' && styles.modeButtonActive
                    ]}
                    onPress={() => handleModeChange('AfterHours')}
                  >
                    <Clock
                      size={24}
                      color={localMode === 'AfterHours' ? '#007AFF' : '#8E8E93'}
                      strokeWidth={localMode === 'AfterHours' ? 2.5 : 2}
                    />
                    <Text
                      style={[
                        styles.modeButtonText,
                        localMode === 'AfterHours' && styles.modeButtonTextActive
                      ]}
                    >
                      After Hours
                    </Text>
                    {localMode === 'AfterHours' && (
                      <Check size={20} color="#007AFF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      localMode === 'Vacation' && styles.modeButtonActive
                    ]}
                    onPress={() => handleModeChange('Vacation')}
                  >
                    <Calendar
                      size={24}
                      color={localMode === 'Vacation' ? '#007AFF' : '#8E8E93'}
                      strokeWidth={localMode === 'Vacation' ? 2.5 : 2}
                    />
                    <Text
                      style={[
                        styles.modeButtonText,
                        localMode === 'Vacation' && styles.modeButtonTextActive
                      ]}
                    >
                      Vacation
                    </Text>
                    {localMode === 'Vacation' && (
                      <Check size={20} color="#007AFF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      localMode === 'AlwaysOn' && styles.modeButtonActive
                    ]}
                    onPress={() => handleModeChange('AlwaysOn')}
                  >
                    <MessageCircle
                      size={24}
                      color={localMode === 'AlwaysOn' ? '#007AFF' : '#8E8E93'}
                      strokeWidth={localMode === 'AlwaysOn' ? 2.5 : 2}
                    />
                    <Text
                      style={[
                        styles.modeButtonText,
                        localMode === 'AlwaysOn' && styles.modeButtonTextActive
                      ]}
                    >
                      Always On
                    </Text>
                    {localMode === 'AlwaysOn' && (
                      <Check size={20} color="#007AFF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {localMode === 'AfterHours' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Business Hours</Text>
                  <Text style={styles.sectionDescription}>
                    Set your shop hours (replies sent outside these times)
                  </Text>

                  <View style={styles.hoursRow}>
                    <View style={styles.timeInputContainer}>
                      <Text style={styles.timeLabel}>Open</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={localOpenTime}
                        onChangeText={(text) => {
                          setLocalOpenTime(text);
                          setHasChanges(true);
                        }}
                        placeholder="09:00"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>

                    <Text style={styles.timeSeparator}>to</Text>

                    <View style={styles.timeInputContainer}>
                      <Text style={styles.timeLabel}>Close</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={localCloseTime}
                        onChangeText={(text) => {
                          setLocalCloseTime(text);
                          setHasChanges(true);
                        }}
                        placeholder="17:00"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                </View>
              )}

              {localMode === 'Vacation' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vacation Dates</Text>
                  <Text style={styles.sectionDescription}>
                    Set when you'll be away (YYYY-MM-DD format)
                  </Text>

                  <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={localStartDate}
                        onChangeText={(text) => {
                          setLocalStartDate(text);
                          setHasChanges(true);
                        }}
                        placeholder="2025-01-01"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>

                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={localEndDate}
                        onChangeText={(text) => {
                          setLocalEndDate(text);
                          setHasChanges(true);
                        }}
                        placeholder="2025-01-07"
                        placeholderTextColor="#C7C7CC"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <Info size={16} color="#007AFF" />
                    <Text style={styles.infoText}>
                      Use {'{{returnDate}}'} in your message to show the return date
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Auto-Reply Message</Text>
                <Text style={styles.sectionDescription}>
                  This message will be sent automatically
                </Text>

                <TextInput
                  style={styles.messageInput}
                  value={localMessage}
                  onChangeText={(text) => {
                    setLocalMessage(text);
                    setHasChanges(true);
                  }}
                  placeholder="Enter your auto-reply message..."
                  placeholderTextColor="#C7C7CC"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <View style={styles.characterCount}>
                  <Text style={styles.characterCountText}>
                    {localMessage.length} characters
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cooldown Period</Text>
                <Text style={styles.sectionDescription}>
                  Minimum hours between replies to the same person
                </Text>

                <TextInput
                  style={styles.cooldownInput}
                  value={localCooldown}
                  onChangeText={(text) => {
                    setLocalCooldown(text);
                    setHasChanges(true);
                  }}
                  placeholder="12"
                  placeholderTextColor="#C7C7CC"
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity style={styles.testButton} onPress={handleTest}>
                <Info size={20} color="#007AFF" />
                <Text style={styles.testButtonText}>Test Auto-Responder</Text>
                <ChevronRight size={20} color="#007AFF" />
              </TouchableOpacity>
            </>
          )}

          {hasChanges && (
            <TouchableOpacity
              style={styles.saveButtonBottom}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonBottomText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93'
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30'
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 20
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  headerTextContainer: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20
  },
  modeContainer: {
    marginTop: 16,
    gap: 12
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  modeButtonActive: {
    backgroundColor: '#E5F2FF',
    borderColor: '#007AFF'
  },
  modeButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000'
  },
  modeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginTop: 16
  },
  timeInputContainer: {
    flex: 1
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8
  },
  timeInput: {
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  timeSeparator: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12
  },
  dateRow: {
    marginTop: 16,
    gap: 12
  },
  dateInputContainer: {
    flex: 1
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8
  },
  dateInput: {
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E5F2FF',
    borderRadius: 8
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18
  },
  messageInput: {
    marginTop: 16,
    minHeight: 120,
    padding: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    lineHeight: 22
  },
  characterCount: {
    marginTop: 8,
    alignItems: 'flex-end'
  },
  characterCountText: {
    fontSize: 13,
    color: '#8E8E93'
  },
  cooldownInput: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  testButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF'
  },
  saveButtonBottom: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  saveButtonBottomText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});
