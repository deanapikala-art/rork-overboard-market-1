import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Image as ImageIcon,
  Check,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function AdminEventCreate() {
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [allowChat, setAllowChat] = useState(false);
  const [status, setStatus] = useState<'upcoming' | 'live' | 'past'>('upcoming');

  const handleCreate = () => {
    if (!title || !startDate || !endDate || !description) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    const newEvent = {
      title,
      startDate,
      endDate,
      time,
      description,
      imageUrl,
      featured,
      allowChat,
      status,
    };

    console.log('Creating new event:', newEvent);
    
    Alert.alert(
      'Event Created',
      `Successfully created "${title}"`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Summer Makers Festival"
              placeholderTextColor={Colors.nautical.sand}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your event..."
              placeholderTextColor={Colors.nautical.sand}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Start Date *</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color={Colors.nautical.teal} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.nautical.sand}
                />
              </View>
              <Text style={styles.helperText}>Format: 2025-06-01</Text>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>End Date *</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color={Colors.nautical.teal} />
                <TextInput
                  style={styles.textInputWithIcon}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.nautical.sand}
                />
              </View>
              <Text style={styles.helperText}>Format: 2025-06-30</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operating Hours</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={20} color={Colors.nautical.teal} />
              <TextInput
                style={styles.textInputWithIcon}
                value={time}
                onChangeText={setTime}
                placeholder="e.g., 9:00 AM - 5:00 PM"
                placeholderTextColor={Colors.nautical.sand}
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media & Display</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Image URL</Text>
            <View style={styles.inputWithIcon}>
              <ImageIcon size={20} color={Colors.nautical.teal} />
              <TextInput
                style={styles.textInputWithIcon}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={Colors.nautical.sand}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.helperText}>Use an Unsplash or other image URL</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Event Status</Text>
              <Text style={styles.toggleDescription}>
                Set the current status of this event
              </Text>
            </View>
          </View>

          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'upcoming' && styles.statusButtonActive,
              ]}
              onPress={() => setStatus('upcoming')}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === 'upcoming' && styles.statusButtonTextActive,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'live' && styles.statusButtonActive,
              ]}
              onPress={() => setStatus('live')}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === 'live' && styles.statusButtonTextActive,
                ]}
              >
                Live
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'past' && styles.statusButtonActive,
              ]}
              onPress={() => setStatus('past')}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === 'past' && styles.statusButtonTextActive,
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Feature on Home Page</Text>
              <Text style={styles.toggleDescription}>
                Display this event prominently on the entrance page
              </Text>
            </View>
            <Switch
              value={featured}
              onValueChange={setFeatured}
              trackColor={{
                false: Colors.nautical.sand,
                true: Colors.nautical.teal,
              }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Enable Live Chat</Text>
              <Text style={styles.toggleDescription}>
                Allow visitors to chat during this event
              </Text>
            </View>
            <Switch
              value={allowChat}
              onValueChange={setAllowChat}
              trackColor={{
                false: Colors.nautical.sand,
                true: Colors.nautical.teal,
              }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Check size={20} color={Colors.white} />
          <Text style={styles.createButtonText}>Create Event</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.nautical.oceanDeep,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: Colors.nautical.oceanDeep,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  textInputWithIcon: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: Colors.nautical.oceanDeep,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.nautical.sand,
    marginVertical: 8,
    opacity: 0.3,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.nautical.sand,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
    lineHeight: 18,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.nautical.sand,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: Colors.nautical.teal,
    backgroundColor: Colors.nautical.teal,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  statusButtonTextActive: {
    color: Colors.white,
  },
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
