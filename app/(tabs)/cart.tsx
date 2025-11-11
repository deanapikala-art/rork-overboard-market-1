import { Image } from 'expo-image';
import { Stack, router, Href } from 'expo-router';
import { ExternalLink, Minus, Plus, ShoppingBag, Trash2, Bookmark, Store, ChevronRight, MapPin } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/colors';
import { useCart, VendorCartGroup } from '../contexts/CartContext';
import { useSavedForLater } from '../contexts/SavedForLaterContext';
import { useOrders } from '../contexts/OrdersContext';
import { vendors, Vendor } from '../../mocks/vendors';
import { FeedbackButton } from '../components/FeedbackButton';
import { FeedbackModal } from '../components/FeedbackModal';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import HamburgerMenu from '../components/HamburgerMenu';
import { CartShippingInfo } from '../components/CartShippingInfo';
import { getDistanceMiles, isPickupAvailable } from '../utils/zipDistance';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, groupedByVendor, getCartTotal, getVendorTotal, removeItem, updateQuantity, clearCart, clearVendorCart, customerZip, setCustomerZip } = useCart();
  const { saveForLater } = useSavedForLater();
  const { isAuthenticated } = useCustomerAuth();
  const { createOrder } = useOrders();
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({});
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  const [showZipInput, setShowZipInput] = useState(false);
  const [zipInputValue, setZipInputValue] = useState(customerZip || '');

  const handleCheckout = async (vendorGroup: VendorCartGroup, paymentMethod: string, url?: string, type?: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to complete your purchase. Guest browsing is for exploring only.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/customer-auth') },
        ]
      );
      return;
    }

    const vendor = vendors.find(v => v.id === vendorGroup.vendorId);
    if (!vendor) {
      Alert.alert('Error', 'Vendor not found');
      return;
    }

    setProcessingOrders(prev => ({ ...prev, [vendorGroup.vendorId]: true }));

    try {
      const order = await createOrder({
        vendorId: vendorGroup.vendorId,
        vendorName: vendorGroup.vendorName,
        items: vendorGroup.items,
        paymentMethod: paymentMethod as any,
        paymentUrl: url,
      });

      if (order) {
        await clearVendorCart(vendorGroup.vendorId);
        
        Alert.alert(
          'Order Created',
          `Your order (${order.order_number}) has been sent to ${vendorGroup.vendorName}. They\'ll confirm once payment is received.`,
          [
            {
              text: 'View Orders',
              onPress: () => router.push('/profile' as Href),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );

        if (url && type) {
          console.log(`Opening ${type} checkout:`, url);
          Linking.openURL(url).catch(err => {
            console.error('Failed to open URL:', err);
          });
        }
      } else {
        Alert.alert('Error', 'Failed to create order. Please try again.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setProcessingOrders(prev => ({ ...prev, [vendorGroup.vendorId]: false }));
    }
  };

  const handleMessageVendor = (vendorGroup: VendorCartGroup) => {
    const vendor = vendors.find(v => v.id === vendorGroup.vendorId);
    if (!vendor) return;
    
    router.push(`/chat/${vendor.id}` as Href);
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
      ]
    );
  };

  const handleSaveForLater = async (productId: string, vendorId: string) => {
    const item = items.find(i => i.product.id === productId && i.vendorId === vendorId);
    if (item) {
      await saveForLater(item);
      await removeItem(productId, vendorId);
      Alert.alert('Saved', 'Item moved to Saved for Later');
    }
  };

  const toggleVendorExpanded = (vendorId: string) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId],
    }));
  };

  const handleZipSubmit = () => {
    if (zipInputValue.length === 5 && /^\d{5}$/.test(zipInputValue)) {
      setCustomerZip(zipInputValue);
      setShowZipInput(false);
      console.log('[Cart] Customer ZIP set to:', zipInputValue);
    } else {
      Alert.alert('Invalid ZIP', 'Please enter a valid 5-digit ZIP code');
    }
  };

  const enrichedVendorGroups = useMemo(() => {
    return groupedByVendor.map(group => {
      const vendor = vendors.find(v => v.id === group.vendorId);
      let distanceFromCustomer: number | null = null;
      let pickupAvailable = true;

      if (vendor?.zipCode && customerZip) {
        distanceFromCustomer = getDistanceMiles(vendor.zipCode, customerZip);
        pickupAvailable = isPickupAvailable(vendor.zipCode, customerZip, 75);
      }

      return {
        ...group,
        vendorData: vendor || null,
        distanceFromCustomer,
        pickupAvailable: pickupAvailable && (vendor?.pickupAvailable || false),
      };
    });
  }, [groupedByVendor, customerZip]);

  const handleClearVendorCart = (vendorId: string, vendorName: string) => {
    Alert.alert(
      'Clear Vendor Cart',
      `Remove all items from ${vendorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => clearVendorCart(vendorId) },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.container}>
          <HamburgerMenu />
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.headerTitle}>Your Market Bag</Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={64} color={Colors.light.muted} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Your Market Bag is empty</Text>
            <Text style={styles.emptySubtext}>Browse vendors and add items from multiple booths to your bag</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/shop' as Href)}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  const renderVendorCheckout = (vendorGroup: VendorCartGroup) => {
    const vendor = vendors.find(v => v.id === vendorGroup.vendorId);
    if (!vendor) return null;

    return (
      <View style={styles.checkoutSection}>
        <Text style={styles.checkoutTitle}>Checkout Options</Text>
        <Text style={styles.checkoutSubtext}>
          Complete your purchase directly with {vendor.name}
        </Text>

        {vendor.ecommerceUrl && (
          <TouchableOpacity
            style={[styles.checkoutButton, styles.primaryCheckoutButton]}
            onPress={() => handleCheckout(vendorGroup, 'external_website', vendor.ecommerceUrl!, 'vendor site')}
            disabled={processingOrders[vendorGroup.vendorId]}
          >
            <Text style={styles.primaryCheckoutText}>
              {processingOrders[vendorGroup.vendorId] ? 'Processing...' : `Buy on ${vendor.name} Site`}
            </Text>
            <ExternalLink size={20} color={Colors.light.card} />
          </TouchableOpacity>
        )}

        {vendor.paypalLink && (
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => handleCheckout(vendorGroup, 'external_paypal', vendor.paypalLink!, 'PayPal')}
            disabled={processingOrders[vendorGroup.vendorId]}
          >
            <Text style={styles.checkoutButtonText}>
              {processingOrders[vendorGroup.vendorId] ? 'Processing...' : 'Pay with PayPal'}
            </Text>
            <ExternalLink size={18} color={Colors.light.text} />
          </TouchableOpacity>
        )}

        {vendor.venmoHandle && (
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => {
              const total = getVendorTotal(vendor.id);
              const orderNote = `Order from ${vendor.name}`;
              const venmoUrl = `venmo://paycharge?txn=pay&recipients=${vendor.venmoHandle}&amount=${total}&note=${encodeURIComponent(orderNote)}`;
              handleCheckout(vendorGroup, 'external_venmo', venmoUrl, 'Venmo');
            }}
            disabled={processingOrders[vendorGroup.vendorId]}
          >
            <Text style={styles.checkoutButtonText}>
              {processingOrders[vendorGroup.vendorId] ? 'Processing...' : 'Pay with Venmo'}
            </Text>
            <ExternalLink size={18} color={Colors.light.text} />
          </TouchableOpacity>
        )}

        {vendor.cashappHandle && (
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => {
              const cashappUrl = `https://cash.app/${vendor.cashappHandle}`;
              handleCheckout(vendorGroup, 'external_cashapp', cashappUrl, 'Cash App');
            }}
            disabled={processingOrders[vendorGroup.vendorId]}
          >
            <Text style={styles.checkoutButtonText}>
              {processingOrders[vendorGroup.vendorId] ? 'Processing...' : 'Pay with Cash App'}
            </Text>
            <ExternalLink size={18} color={Colors.light.text} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => handleMessageVendor(vendorGroup)}
        >
          <Text style={styles.messageButtonText}>Message Vendor</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <HamburgerMenu />
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Your Market Bag</Text>
            <TouchableOpacity onPress={handleClearCart}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtext}>
            {groupedByVendor.length} {groupedByVendor.length === 1 ? 'vendor' : 'vendors'} • {items.reduce((sum, item) => sum + item.quantity, 0)} items
          </Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              You&apos;ll checkout separately with each vendor. After completing one purchase, return here for the next!
            </Text>
          </View>

          <View style={styles.zipSection}>
            {!customerZip || showZipInput ? (
              <View style={styles.zipInputContainer}>
                <Text style={styles.zipLabel}>Enter your ZIP code for accurate shipping & pickup options:</Text>
                <View style={styles.zipInputRow}>
                  <TextInput
                    style={styles.zipInput}
                    value={zipInputValue}
                    onChangeText={setZipInputValue}
                    placeholder="ZIP Code"
                    placeholderTextColor={Colors.light.muted}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  <TouchableOpacity style={styles.zipSubmitButton} onPress={handleZipSubmit}>
                    <Text style={styles.zipSubmitText}>Set ZIP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.zipDisplay}
                onPress={() => setShowZipInput(true)}
              >
                <MapPin size={16} color={Colors.nautical.teal} />
                <Text style={styles.zipDisplayText}>Delivery ZIP: {customerZip}</Text>
                <Text style={styles.zipChangeText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.feedbackButtonContainer}>
            <FeedbackButton variant="inline" />
          </View>

          {enrichedVendorGroups.map((vendorGroup) => {
            const vendor = vendorGroup.vendorData;
            const isExpanded = expandedVendors[vendorGroup.vendorId] !== false;

            return (
              <View key={vendorGroup.vendorId} style={styles.vendorSection}>
                <TouchableOpacity 
                  style={styles.vendorHeader}
                  onPress={() => toggleVendorExpanded(vendorGroup.vendorId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vendorHeaderLeft}>
                    {vendor && (
                      <Image
                        source={{ uri: vendor.avatar }}
                        style={styles.vendorAvatar}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendorGroup.vendorName}</Text>
                      <Text style={styles.vendorItemCount}>
                        {vendorGroup.items.length} {vendorGroup.items.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.vendorHeaderRight}>
                    <Text style={styles.vendorTotal}>${vendorGroup.total.toFixed(2)}</Text>
                    <ChevronRight 
                      size={20} 
                      color={Colors.light.muted} 
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.vendorContent}>
                    <View style={styles.itemsList}>
                      {vendorGroup.items.map((item, index) => (
                        <View key={`${item.product.id}-${index}`} style={styles.cartItem}>
                          <Image
                            source={{ uri: item.product.image }}
                            style={styles.itemImage}
                            contentFit="cover"
                          />
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                            <Text style={styles.itemPrice}>${item.product.price}</Text>
                            <View style={styles.quantityControls}>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item.product.id, item.vendorId, item.quantity - 1)}
                              >
                                <Minus size={16} color={Colors.light.text} />
                              </TouchableOpacity>
                              <Text style={styles.quantityText}>{item.quantity}</Text>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item.product.id, item.vendorId, item.quantity + 1)}
                              >
                                <Plus size={16} color={Colors.light.text} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.itemRight}>
                            <View style={styles.itemActions}>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleSaveForLater(item.product.id, item.vendorId)}
                              >
                                <Bookmark size={18} color={Colors.light.tint} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => removeItem(item.product.id, item.vendorId)}
                              >
                                <Trash2 size={18} color={Colors.light.muted} />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.itemTotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {vendorGroup.distanceFromCustomer !== null && vendorGroup.distanceFromCustomer !== undefined && customerZip && (
                      <View style={styles.distanceInfo}>
                        <MapPin size={14} color={Colors.light.muted} />
                        <Text style={styles.distanceText}>
                          {vendorGroup.distanceFromCustomer < 1 
                            ? 'Less than 1 mile away' 
                            : `${vendorGroup.distanceFromCustomer.toFixed(0)} miles from your ZIP`}
                        </Text>
                      </View>
                    )}

                    <CartShippingInfo
                      vendorName={vendorGroup.vendorName}
                      itemCount={vendorGroup.items.reduce((sum, item) => sum + item.quantity, 0)}
                      subtotal={vendorGroup.total}
                      settings={{
                        flatPerItem: 4.00,
                        flatPerOrder: 8.00,
                        freeShippingOver: 50,
                        allowLocalPickup: vendorGroup.pickupAvailable,
                        pickupInstructions: vendor?.pickupInstructions,
                      }}
                      distanceFromVendor={vendorGroup.distanceFromCustomer || undefined}
                    />

                    {renderVendorCheckout(vendorGroup)}

                    <TouchableOpacity
                      style={styles.clearVendorButton}
                      onPress={() => handleClearVendorCart(vendorGroup.vendorId, vendorGroup.vendorName)}
                    >
                      <Text style={styles.clearVendorText}>Remove All from {vendorGroup.vendorName}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.grandTotalSection}>
            <View style={styles.grandTotalCard}>
              <Store size={24} color={Colors.light.terracotta} />
              <View style={styles.grandTotalInfo}>
                <Text style={styles.grandTotalLabel}>Market Bag Total</Text>
                <Text style={styles.grandTotalSubtext}>Across {groupedByVendor.length} {groupedByVendor.length === 1 ? 'vendor' : 'vendors'}</Text>
              </View>
              <Text style={styles.grandTotalAmount}>${getCartTotal().toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <FeedbackModal currentPage="Cart" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.oceanDeep,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  headerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.sunsetCoral,
  },
  scroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.light.sunsetCoral,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: Colors.light.sageLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.sage + '40',
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  vendorSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.softGray,
  },
  vendorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorContent: {
    padding: 16,
    gap: 16,
  },
  vendorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.light.card,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  vendorItemCount: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  vendorTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  itemsList: {
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.softGray,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    minWidth: 24,
    textAlign: 'center',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  subtotalSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  subtotalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  checkoutSection: {
    gap: 10,
  },
  checkoutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  checkoutSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  primaryCheckoutButton: {
    backgroundColor: Colors.light.sunsetCoral,
    borderColor: Colors.light.sunsetCoral,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  primaryCheckoutText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.card,
  },
  messageButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  clearVendorButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearVendorText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  grandTotalSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  grandTotalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.terracotta,
    gap: 14,
  },
  grandTotalInfo: {
    flex: 1,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  grandTotalSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  grandTotalAmount: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.terracotta,
  },
  bottomPadding: {
    height: 40,
  },
  feedbackButtonContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  zipSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  zipInputContainer: {
    backgroundColor: Colors.light.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  zipLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  zipInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  zipInput: {
    flex: 1,
    backgroundColor: Colors.light.softGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  zipSubmitButton: {
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zipSubmitText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  zipDisplay: {
    backgroundColor: Colors.light.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    gap: 8,
  },
  zipDisplayText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  zipChangeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.light.muted,
    fontWeight: '600' as const,
  },
});
