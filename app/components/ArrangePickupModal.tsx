import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { X, MapPin, Calendar, MessageCircle, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/app/constants/colors';
import { Vendor } from '@/mocks/vendors';
import { useCart, CartItem } from '@/app/contexts/CartContext';

interface ArrangePickupModalProps {
  visible: boolean;
  onClose: () => void;
  vendor: Vendor;
}

export default function ArrangePickupModal({ visible, onClose, vendor }: ArrangePickupModalProps) {
  const { items, getCartTotal } = useCart();
  const [isMessaging, setIsMessaging] = useState(false);

  const handleMessageVendor = () => {
    const cartSummary = items.length > 0 
      ? items.map((item: CartItem) => `${item.quantity}x ${item.product.name}`).join(', ')
      : 'No items in cart';
    
    const message = `Hi ${vendor.name}! I'd like to arrange pickup for the following items:\n\n${cartSummary}\n\nTotal: $${getCartTotal().toFixed(2)}\n\nWhen would be a good time for pickup?\n\nThank you!`;
    
    console.log('Message to vendor:', message);
    setIsMessaging(true);
    setTimeout(() => {
      setIsMessaging(false);
      onClose();
    }, 1500);
  };

  const handleGetDirections = () => {
    if (vendor.latitude && vendor.longitude) {
      const scheme = Platform.select({
        ios: 'maps:',
        android: 'geo:',
        default: 'https://maps.google.com/',
      });
      
      const url = Platform.select({
        ios: `${scheme}?q=${vendor.latitude},${vendor.longitude}`,
        android: `${scheme}${vendor.latitude},${vendor.longitude}?q=${vendor.latitude},${vendor.longitude}`,
        default: `https://maps.google.com/?q=${vendor.latitude},${vendor.longitude}`,
      });

      Linking.openURL(url);
    } else if (vendor.location) {
      const encodedLocation = encodeURIComponent(vendor.location);
      Linking.openURL(`https://maps.google.com/?q=${encodedLocation}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MapPin size={24} color={Colors.nautical.teal} />
              <Text style={styles.modalTitle}>Arrange Pickup</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.vendorInfoCard}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              
              <View style={styles.infoRow}>
                <MapPin size={18} color={Colors.nautical.teal} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoText}>{vendor.location}</Text>
                  {vendor.zipCode && (
                    <Text style={styles.infoSubtext}>{vendor.zipCode}</Text>
                  )}
                </View>
              </View>

              {vendor.pickupInstructions && (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsLabel}>Pickup Instructions:</Text>
                  <Text style={styles.instructionsText}>{vendor.pickupInstructions}</Text>
                </View>
              )}
            </View>

            {vendor.pickupSchedulerUrl && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Schedule Your Visit</Text>
                <TouchableOpacity
                  style={styles.schedulerButton}
                  onPress={() => {
                    if (vendor.pickupSchedulerUrl) {
                      Linking.openURL(vendor.pickupSchedulerUrl);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                    style={styles.schedulerGradient}
                  >
                    <Calendar size={20} color="#FFF" />
                    <Text style={styles.schedulerButtonText}>Open Scheduler</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Cart Summary</Text>
                <View style={styles.cartSummaryCard}>
                  {items.map((item: CartItem, index: number) => (
                    <View key={item.product.id} style={styles.cartItem}>
                      <Text style={styles.cartItemText}>
                        {item.quantity}x {item.product.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.cartTotalRow}>
                    <Text style={styles.cartTotalLabel}>Total:</Text>
                    <Text style={styles.cartTotalAmount}>${getCartTotal().toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMessageVendor}
                activeOpacity={0.8}
                disabled={isMessaging}
              >
                <LinearGradient
                  colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                  style={styles.actionButtonGradient}
                >
                  <MessageCircle size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>
                    {isMessaging ? 'Sending...' : 'Message Vendor'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGetDirections}
                activeOpacity={0.8}
              >
                <Navigation size={20} color={Colors.nautical.teal} />
                <Text style={styles.secondaryButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.light.softGray,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  vendorInfoCard: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    lineHeight: 22,
  },
  infoSubtext: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginTop: 4,
  },
  instructionsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 12,
  },
  schedulerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  schedulerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  schedulerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  cartSummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  cartTotalAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    letterSpacing: 0.3,
  },
});
