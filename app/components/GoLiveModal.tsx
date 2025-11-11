import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { X, Video, AlertCircle, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { LivePlatform } from '@/app/contexts/VendorLiveContext';

type GoLiveModalProps = {
  visible: boolean;
  isCurrentlyLive: boolean;
  onClose: () => void;
  onGoLive: (platform: LivePlatform, url: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onEndLive: () => Promise<{ success: boolean; error?: string }>;
};

const PLATFORMS: { value: LivePlatform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Other' },
];

export default function GoLiveModal({ visible, isCurrentlyLive, onClose, onGoLive, onEndLive }: GoLiveModalProps) {
  const [platform, setPlatform] = useState<LivePlatform>('youtube');
  const [liveUrl, setLiveUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoLive = async () => {
    if (!liveUrl.trim()) {
      setError('Please enter a live stream URL');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await onGoLive(platform, liveUrl, notes);

    setIsLoading(false);

    if (result.success) {
      setLiveUrl('');
      setNotes('');
      onClose();
    } else {
      setError(result.error || 'Failed to go live');
    }
  };

  const handleEndLive = async () => {
    setIsLoading(true);
    setError('');

    const result = await onEndLive();

    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to end live session');
    }
  };

  const openHelpArticle = () => {
    Linking.openURL('https://support.google.com/youtube/answer/2474026');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Video size={24} color={Colors.nautical.teal} />
              <Text style={styles.title}>
                {isCurrentlyLive ? 'You&apos;re Live' : 'Go Live'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {isCurrentlyLive ? (
              <>
                <View style={styles.liveIndicatorBox}>
                  <View style={styles.liveIndicator} />
                  <Text style={styles.liveIndicatorText}>LIVE NOW</Text>
                </View>

                <Text style={styles.description}>
                  Your live stream is visible to shoppers. End your session when you&apos;re done.
                </Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color={Colors.light.terracotta} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, styles.endButton]}
                  onPress={handleEndLive}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>End Live Session</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.description}>
                  Paste your live link from YouTube, Instagram, Facebook, or TikTok. We&apos;ll show shoppers you&apos;re live—no fees, no fuss.
                </Text>

                <View style={styles.section}>
                  <Text style={styles.label}>Platform</Text>
                  <View style={styles.platformButtons}>
                    {PLATFORMS.map((p) => (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.platformButton,
                          platform === p.value && styles.platformButtonActive,
                        ]}
                        onPress={() => setPlatform(p.value)}
                      >
                        <Text
                          style={[
                            styles.platformButtonText,
                            platform === p.value && styles.platformButtonTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Live Stream URL *</Text>
                  <TextInput
                    style={styles.input}
                    value={liveUrl}
                    onChangeText={(text) => {
                      setLiveUrl(text);
                      if (error) setError('');
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor={Colors.light.muted}
                    autoCapitalize="none"
                    keyboardType="url"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.helpLink} onPress={openHelpArticle}>
                    <ExternalLink size={14} color={Colors.nautical.teal} />
                    <Text style={styles.helpLinkText}>How to get your live URL</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>What&apos;s happening? (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Today only: 15% off candles + Q&A"
                    placeholderTextColor={Colors.light.muted}
                    maxLength={80}
                    multiline
                  />
                  <Text style={styles.charCount}>{notes.length}/80</Text>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color={Colors.light.terracotta} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, styles.goLiveButton]}
                  onPress={handleGoLive}
                  disabled={isLoading || !liveUrl.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Go Live</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                  By going live, you agree to our streaming guidelines. No copyrighted content or adult material.
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 15,
    color: Colors.light.muted,
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  platformButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.white,
  },
  platformButtonActive: {
    borderColor: Colors.nautical.teal,
    backgroundColor: Colors.nautical.sandLight,
  },
  platformButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  platformButtonTextActive: {
    color: Colors.nautical.teal,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 6,
    textAlign: 'right' as const,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  helpLinkText: {
    fontSize: 13,
    color: Colors.nautical.teal,
    fontWeight: '600' as const,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLiveButton: {
    backgroundColor: Colors.nautical.teal,
  },
  endButton: {
    backgroundColor: Colors.light.terracotta,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    marginTop: 12,
    lineHeight: 18,
  },
  liveIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  liveIndicatorText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#22C55E',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.terracotta,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.terracotta,
    lineHeight: 20,
  },
});
