import { Image } from 'expo-image';
import { Camera, X, Upload, Send, AlertCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';

import Colors from '@/app/constants/colors';
import { useShoutouts } from '@/app/contexts/ShoutoutsContext';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';

interface PostShoutoutModalProps {
  visible: boolean;
  onClose: () => void;
  vendorId?: string;
  vendorName?: string;
  productName?: string;
}

export default function PostShoutoutModal({ 
  visible, 
  onClose, 
  vendorId,
  vendorName,
  productName,
}: PostShoutoutModalProps) {
  const { addShoutout } = useShoutouts();
  const { profile, isAuthenticated } = useCustomerAuth();
  
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(vendorId || '');
  const [selectedVendorName, setSelectedVendorName] = useState(vendorName || '');

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !profile) {
      Alert.alert('Sign In Required', 'Please sign in to post a shoutout.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please write a message for your shoutout.');
      return;
    }

    if (!selectedVendorId || !selectedVendorName) {
      Alert.alert('Vendor Required', 'Please select a vendor to tag.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addShoutout({
        customerId: profile.id,
        customerName: profile.name,
        customerAvatar: undefined,
        vendorId: selectedVendorId,
        vendorName: selectedVendorName,
        message: message.trim(),
        imageUrl: selectedImage || undefined,
        productName: productName,
      });

      Alert.alert('Success!', 'Your shoutout has been posted! 🎉');
      
      setMessage('');
      setSelectedImage(null);
      onClose();
    } catch (error) {
      console.error('Error posting shoutout:', error);
      Alert.alert('Error', 'Failed to post shoutout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSelectedImage(null);
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleClose}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.signInPrompt}>
                  <AlertCircle size={48} color={Colors.nautical.teal} />
                  <Text style={styles.signInTitle}>Sign In Required</Text>
                  <Text style={styles.signInMessage}>
                    Please sign in to share your shopping experience with the community!
                  </Text>
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Your Experience</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
                  <X size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.vendorTag}>
                  <Text style={styles.label}>Tagging Vendor</Text>
                  <View style={styles.vendorTagBadge}>
                    <Text style={styles.vendorTagText}>{selectedVendorName || 'Select vendor'}</Text>
                  </View>
                </View>

                {productName && (
                  <View style={styles.productTag}>
                    <Text style={styles.productTagLabel}>Product:</Text>
                    <Text style={styles.productTagText}>{productName}</Text>
                  </View>
                )}

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Your Message</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Share what you loved about your purchase..."
                    placeholderTextColor={Colors.light.muted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={280}
                    textAlignVertical="top"
                  />
                  <Text style={styles.characterCount}>{message.length}/280</Text>
                </View>

                <View style={styles.imageSection}>
                  <Text style={styles.label}>Add a Photo (Optional)</Text>
                  
                  {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.imagePreview}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <X size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handlePickImage}
                      disabled={isSubmitting}
                    >
                      <LinearGradient
                        colors={[Colors.nautical.oceanFoam, Colors.nautical.sandLight]}
                        style={styles.uploadGradient}
                      >
                        <Camera size={32} color={Colors.nautical.teal} />
                        <Text style={styles.uploadText}>Upload Photo</Text>
                        <Upload size={18} color={Colors.nautical.teal} />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={
                      isSubmitting 
                        ? [Colors.light.muted, Colors.light.muted] 
                        : [Colors.nautical.teal, Colors.nautical.tealDark]
                    }
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <>
                        <ActivityIndicator size="small" color="#FFF" />
                        <Text style={styles.submitButtonText}>Posting...</Text>
                      </>
                    ) : (
                      <>
                        <Send size={20} color="#FFF" />
                        <Text style={styles.submitButtonText}>Post Shoutout</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  closeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  vendorTag: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 8,
  },
  vendorTagBadge: {
    backgroundColor: Colors.nautical.oceanFoam,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  vendorTagText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    textAlign: 'center',
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  productTagLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  productTagText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    flex: 1,
  },
  inputSection: {
    marginBottom: 20,
  },
  messageInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'right',
    marginTop: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  imagePreviewContainer: {
    position: 'relative' as const,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  signInPrompt: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  signInTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    textAlign: 'center',
  },
  signInMessage: {
    fontSize: 15,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});
