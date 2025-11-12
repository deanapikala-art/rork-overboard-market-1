import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Upload,
  FileText,
  AlertCircle,
  Copy,
  DollarSign,
  Package,
  Truck,
  Clock,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Linking,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';
import { useOrders } from '@/app/contexts/OrdersContext';
import {
  generatePaymentMemo,
  generateVenmoDeeplink,
  generatePayPalMeLink,
  generateEcommerceUrl,
} from '@/app/utils/paymentMemo';
import ShippingStatusCard from '@/app/components/ShippingStatusCard';
import AddShippingModal from '@/app/components/AddShippingModal';
import PickupCodeDisplay from '@/app/components/PickupCodeDisplay';
import VerifyPickupCodeModal from '@/app/components/VerifyPickupCodeModal';
import { manuallyMarkAsDelivered } from '@/app/utils/deliveryTracking';
import type { ShippingInfo } from '@/app/components/AddShippingModal';

export interface CustomizationValue {
  code: string;
  label: string;
  value: string | boolean;
  price_delta: number;
}

interface OrderLineItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  basePrice: number;
  customizations?: CustomizationValue[];
  requires_proof?: boolean;
  proof_status?: 'awaiting' | 'submitted' | 'approved';
  proof_url?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  vendorPaymentInfo?: {
    venmoUsername?: string;
    paypalUsername?: string;
    ecommerceUrl?: string;
  };
}

const mockOrders: Record<string, Order> = {
  '1234': {
    id: '1234',
    orderNumber: '#1234',
    customerName: 'Emma Johnson',
    customerEmail: 'emma.j@email.com',
    date: '2 hours ago',
    status: 'processing',
    vendorPaymentInfo: {
      venmoUsername: 'LunaCeramics',
      paypalUsername: 'LunaCeramics',
      ecommerceUrl: 'https://shop.lunaceramics.com/checkout',
    },
    items: [
      {
        id: 'line1',
        productName: 'Ceramic Mug',
        productImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80',
        quantity: 2,
        basePrice: 32,
        customizations: [
          {
            code: 'monogram',
            label: 'Add Monogram',
            value: 'EJM',
            price_delta: 8,
          },
          {
            code: 'gift_wrap',
            label: 'Gift Wrap',
            value: true,
            price_delta: 5,
          },
          {
            code: 'glaze_color',
            label: 'Glaze Color',
            value: 'Sunset Orange',
            price_delta: 3,
          },
        ],
        requires_proof: false,
      },
    ],
    subtotal: 96,
    tax: 8.64,
    total: 104.64,
  },
  '1233': {
    id: '1233',
    orderNumber: '#1233',
    customerName: 'Michael Brown',
    customerEmail: 'michael.b@email.com',
    date: '1 day ago',
    status: 'shipped',
    vendorPaymentInfo: {
      venmoUsername: 'StitchAndStory',
      paypalUsername: 'StitchAndStory',
    },
    items: [
      {
        id: 'line2',
        productName: 'Custom Pet Portrait',
        productImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80',
        quantity: 1,
        basePrice: 125,
        customizations: [
          {
            code: 'pet_name',
            label: 'Pet Name',
            value: 'Buddy',
            price_delta: 0,
          },
          {
            code: 'frame_color',
            label: 'Frame Color',
            value: 'Gold',
            price_delta: 25,
          },
          {
            code: 'pet_photo',
            label: 'Pet Photo',
            value: 'buddy-photo.jpg',
            price_delta: 0,
          },
        ],
        requires_proof: true,
        proof_status: 'awaiting',
      },
      {
        id: 'line3',
        productName: 'Wooden Cutting Board',
        productImage: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=400&q=80',
        quantity: 1,
        basePrice: 48,
        customizations: [
          {
            code: 'engraving',
            label: 'Custom Engraving',
            value: 'The Brown Family',
            price_delta: 15,
          },
          {
            code: 'rush_order',
            label: 'Rush Order (2-3 days)',
            value: true,
            price_delta: 25,
          },
        ],
        requires_proof: true,
        proof_status: 'approved',
        proof_url: 'https://example.com/proof-cutting-board.pdf',
      },
    ],
    subtotal: 213,
    tax: 19.17,
    total: 232.17,
  },
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, isLoading, markAsDelivered, addShippingInfo, verifyPickupCode } = useOrders();
  const dbOrder = getOrderById(id as string);

  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [proofApproved, setProofApproved] = useState<Record<string, boolean>>({});
  const [showAddShippingModal, setShowAddShippingModal] = useState<boolean>(false);
  const [showVerifyPickupModal, setShowVerifyPickupModal] = useState<boolean>(false);

  const order: Order | undefined = dbOrder ? {
    ...dbOrder,
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    customerName: dbOrder.customer_name,
    customerEmail: dbOrder.customer_email || '',
    date: dbOrder.created_at,
    status: dbOrder.status === 'completed' ? 'delivered' : dbOrder.status === 'awaiting_vendor_confirmation' ? 'processing' : 'cancelled',
    items: dbOrder.items.map(item => ({
      id: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      basePrice: item.price,
      customizations: item.customizations,
    })),
    subtotal: dbOrder.subtotal,
    tax: dbOrder.tax,
    total: dbOrder.total,
  } as Order : undefined;

  const handleMarkDelivered = async () => {
    if (!dbOrder) return;
    
    Alert.alert(
      'Confirm Delivery',
      'Mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const success = await markAsDelivered(dbOrder.id, 'Customer');
            if (success) {
              Alert.alert('Success', 'Order marked as delivered');
            } else {
              Alert.alert('Error', 'Failed to mark order as delivered');
            }
          },
        },
      ]
    );
  };

  const handleAddShipping = async (shippingInfo: ShippingInfo) => {
    if (!dbOrder) return;
    
    const success = await addShippingInfo(dbOrder.id, shippingInfo);
    if (!success) {
      throw new Error('Failed to add shipping information');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Order Details',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8 }}>
                <ArrowLeft size={24} color={Colors.light.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.nautical.teal} />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Order Details',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8 }}>
                <ArrowLeft size={24} color={Colors.light.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Package size={64} color={Colors.light.muted} />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSendProof = (lineItemId: string) => {
    const url = proofUrls[lineItemId];
    if (!url || url.trim() === '') {
      Alert.alert('Error', 'Please enter a proof URL');
      return;
    }

    Alert.alert(
      'Proof Sent',
      'The proof has been sent to the customer for review.',
      [{ text: 'OK' }]
    );

    const lineItem = order.items.find((item) => item.id === lineItemId);
    if (lineItem) {
      lineItem.proof_status = 'submitted';
      lineItem.proof_url = url;
    }
  };

  const handleCopyMemo = (memo: string) => {
    Clipboard.setString(memo);
    Alert.alert('Copied!', 'Payment memo copied to clipboard');
  };

  const handlePaymentLink = async (type: 'venmo' | 'paypal' | 'ecommerce', item: OrderLineItem) => {
    const memo = generatePaymentMemo({
      orderIntentId: order.id,
      productTitle: item.productName,
      customizations: item.customizations,
    });

    const itemTotal = (item.basePrice + (item.customizations?.reduce((sum, c) => sum + c.price_delta, 0) || 0)) * item.quantity;

    try {
      if (type === 'venmo' && order.vendorPaymentInfo?.venmoUsername) {
        const venmoLink = generateVenmoDeeplink(
          order.vendorPaymentInfo.venmoUsername,
          itemTotal,
          memo
        );
        await Linking.openURL(venmoLink);
      } else if (type === 'paypal' && order.vendorPaymentInfo?.paypalUsername) {
        handleCopyMemo(memo);
        const paypalLink = generatePayPalMeLink(
          order.vendorPaymentInfo.paypalUsername,
          itemTotal
        );
        Alert.alert(
          'PayPal Payment',
          `Memo copied! Opening PayPal...\n\nPlease paste the memo in the note field:\n${memo}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open PayPal', onPress: () => Linking.openURL(paypalLink) },
          ]
        );
      } else if (type === 'ecommerce' && order.vendorPaymentInfo?.ecommerceUrl) {
        const ecommerceLink = generateEcommerceUrl(
          order.vendorPaymentInfo.ecommerceUrl,
          memo,
          itemTotal
        );
        if (ecommerceLink === order.vendorPaymentInfo.ecommerceUrl) {
          handleCopyMemo(memo);
          Alert.alert(
            'Checkout',
            `Memo copied! Opening checkout...\n\nPlease include this memo:\n${memo}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Checkout', onPress: () => Linking.openURL(ecommerceLink) },
            ]
          );
        } else {
          await Linking.openURL(ecommerceLink);
        }
      }
    } catch (error) {
      console.error('Failed to open payment link:', error);
      Alert.alert('Error', 'Could not open payment link');
    }
  };

  const handleToggleApproval = (lineItemId: string, value: boolean) => {
    setProofApproved((prev) => ({
      ...prev,
      [lineItemId]: value,
    }));

    const lineItem = order.items.find((item) => item.id === lineItemId);
    if (lineItem && value) {
      lineItem.proof_status = 'approved';
      Alert.alert('Success', 'Proof has been marked as approved. You can now proceed with production.');
    } else if (lineItem && !value) {
      lineItem.proof_status = 'awaiting';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'awaiting_vendor_confirmation':
        return { label: 'Pending', color: Colors.nautical.mustard, icon: Clock };
      case 'completed':
        return { label: 'Completed', color: '#22C55E', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Cancelled', color: Colors.light.muted, icon: AlertCircle };
      default:
        return { label: status, color: Colors.light.muted, icon: Package };
    }
  };

  const getShippingStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Not Shipped', color: Colors.light.muted };
      case 'shipped':
      case 'in_transit':
        return { label: 'In Transit', color: Colors.nautical.teal };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', color: Colors.nautical.mustard };
      case 'delivered':
        return { label: 'Delivered', color: '#22C55E' };
      case 'pickup_ready':
        return { label: 'Ready for Pickup', color: Colors.nautical.mustard };
      case 'picked_up':
        return { label: 'Picked Up', color: '#22C55E' };
      default:
        return { label: 'Pending', color: Colors.light.muted };
    }
  };

  const getProofStatusColor = (status?: 'awaiting' | 'submitted' | 'approved') => {
    switch (status) {
      case 'awaiting':
        return Colors.light.terracotta;
      case 'submitted':
        return Colors.nautical.mustard;
      case 'approved':
        return '#22C55E';
      default:
        return Colors.light.muted;
    }
  };

  const getProofStatusText = (status?: 'awaiting' | 'submitted' | 'approved') => {
    switch (status) {
      case 'awaiting':
        return 'Awaiting Proof Approval';
      case 'submitted':
        return 'Proof Submitted';
      case 'approved':
        return 'Proof Approved';
      default:
        return 'No Proof Required';
    }
  };

  const statusConfig = dbOrder ? getStatusConfig(dbOrder.status) : { label: 'Unknown', color: Colors.light.muted, icon: Package };
  const shippingConfig = dbOrder ? getShippingStatusConfig(dbOrder.shipping_status) : { label: 'Unknown', color: Colors.light.muted };
  const StatusIcon = statusConfig.icon;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `Order ${order.orderNumber}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8 }}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
            </View>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.customerEmail}>{order.customerEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Image
                  source={{ uri: item.productImage }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemBasePrice}>
                    Base: ${item.basePrice.toFixed(2)}
                  </Text>
                </View>
              </View>

              {item.customizations && item.customizations.length > 0 && (
                <View style={styles.customizationSection}>
                  <Text style={styles.customizationTitle}>Customizations</Text>
                  {item.customizations.map((custom, idx) => (
                    <View key={idx} style={styles.customizationRow}>
                      <View style={styles.customizationInfo}>
                        <Text style={styles.customizationLabel}>{custom.label}:</Text>
                        <Text style={styles.customizationValue}>
                          {typeof custom.value === 'boolean'
                            ? custom.value
                              ? 'Yes'
                              : 'No'
                            : custom.value}
                        </Text>
                      </View>
                      {custom.price_delta !== 0 && (
                        <Text style={styles.customizationPrice}>
                          +${custom.price_delta.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  ))}

                  {item.requires_proof && (
                    <>
                      <View style={styles.proofStatusSection}>
                        <View
                          style={[
                            styles.proofStatusChip,
                            { backgroundColor: getProofStatusColor(item.proof_status) },
                          ]}
                        >
                          <AlertCircle size={14} color={Colors.white} />
                          <Text style={styles.proofStatusText}>
                            {getProofStatusText(item.proof_status)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.proofActions}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Proof URL or Link</Text>
                          <View style={styles.proofInputRow}>
                            <TextInput
                              style={styles.proofInput}
                              value={proofUrls[item.id] || item.proof_url || ''}
                              onChangeText={(text) =>
                                setProofUrls((prev) => ({ ...prev, [item.id]: text }))
                              }
                              placeholder="https://example.com/proof.pdf"
                              placeholderTextColor={Colors.light.muted}
                              editable={item.proof_status !== 'approved'}
                            />
                            <TouchableOpacity
                              style={[
                                styles.uploadIconButton,
                                item.proof_status === 'approved' && styles.uploadIconButtonDisabled,
                              ]}
                              onPress={() => handleSendProof(item.id)}
                              disabled={item.proof_status === 'approved'}
                            >
                              <Upload size={18} color={Colors.white} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {item.proof_status === 'submitted' || item.proof_status === 'approved' ? (
                          <View style={styles.approvalRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.approvalLabel}>Mark Proof as Approved</Text>
                              <Text style={styles.approvalSubtext}>
                                Confirm that the proof is final
                              </Text>
                            </View>
                            <Switch
                              value={proofApproved[item.id] || false}
                              onValueChange={(value) => handleToggleApproval(item.id, value)}
                              trackColor={{
                                false: Colors.light.border,
                                true: '#22C55E',
                              }}
                              thumbColor={Colors.white}
                            />
                          </View>
                        ) : null}

                        {item.proof_url && (
                          <TouchableOpacity style={styles.viewProofButton}>
                            <FileText size={16} color={Colors.nautical.teal} />
                            <Text style={styles.viewProofButtonText}>View Proof</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}

              <View style={styles.itemTotal}>
                <Text style={styles.itemTotalLabel}>Item Total:</Text>
                <Text style={styles.itemTotalPrice}>
                  $
                  {(
                    (item.basePrice +
                      (item.customizations?.reduce((sum, c) => sum + c.price_delta, 0) || 0)) *
                    item.quantity
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>$8.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>${(order.total + 8).toFixed(2)}</Text>
          </View>
        </View>

        {order.vendorPaymentInfo && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            {order.items.map((item) => {
              const memo = generatePaymentMemo({
                orderIntentId: order.id,
                productTitle: item.productName,
                customizations: item.customizations,
              });
              
              return (
                <View key={item.id} style={styles.paymentCard}>
                  <Text style={styles.paymentItemName}>{item.productName}</Text>
                  <View style={styles.memoContainer}>
                    <Text style={styles.memoLabel}>Payment Memo:</Text>
                    <View style={styles.memoBox}>
                      <Text style={styles.memoText} numberOfLines={2}>{memo}</Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopyMemo(memo)}
                      >
                        <Copy size={16} color={Colors.nautical.teal} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.paymentButtons}>
                    {order.vendorPaymentInfo?.venmoUsername && (
                      <TouchableOpacity
                        style={styles.paymentMethodButton}
                        onPress={() => handlePaymentLink('venmo', item)}
                      >
                        <DollarSign size={18} color={Colors.white} />
                        <Text style={styles.paymentMethodText}>Pay via Venmo</Text>
                      </TouchableOpacity>
                    )}
                    
                    {order.vendorPaymentInfo?.paypalUsername && (
                      <TouchableOpacity
                        style={[styles.paymentMethodButton, styles.paypalButton]}
                        onPress={() => handlePaymentLink('paypal', item)}
                      >
                        <DollarSign size={18} color={Colors.white} />
                        <Text style={styles.paymentMethodText}>Pay via PayPal</Text>
                      </TouchableOpacity>
                    )}
                    
                    {order.vendorPaymentInfo?.ecommerceUrl && (
                      <TouchableOpacity
                        style={[styles.paymentMethodButton, styles.ecommerceButton]}
                        onPress={() => handlePaymentLink('ecommerce', item)}
                      >
                        <DollarSign size={18} color={Colors.white} />
                        <Text style={styles.paymentMethodText}>Checkout</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {dbOrder && dbOrder.is_local_pickup && dbOrder.pickup_confirmation_code && (
          <PickupCodeDisplay
            code={dbOrder.pickup_confirmation_code}
            orderNumber={dbOrder.order_number}
            isPickedUp={dbOrder.shipping_status === 'picked_up'}
          />
        )}

        {dbOrder && (
          <View style={styles.shippingSection}>
            <Text style={styles.sectionTitle}>Shipping & Delivery</Text>
            <ShippingStatusCard
              shippingStatus={dbOrder.shipping_status as any}
              shippingProvider={dbOrder.shipping_provider}
              trackingNumber={dbOrder.tracking_number}
              trackingUrl={dbOrder.tracking_url}
              shippedAt={dbOrder.shipped_at}
              deliveredAt={dbOrder.delivered_at}
              deliveryConfirmedBy={dbOrder.delivery_confirmed_by as any}
              estimatedDeliveryDate={dbOrder.estimated_delivery_date}
              deliveryNotes={dbOrder.delivery_notes}
              isLocalPickup={dbOrder.is_local_pickup}
            />
            
            {dbOrder.is_local_pickup && dbOrder.shipping_status === 'pending' && dbOrder.status === 'completed' && (
              <TouchableOpacity 
                style={styles.verifyPickupButton}
                onPress={() => setShowVerifyPickupModal(true)}
              >
                <CheckCircle size={20} color={Colors.white} />
                <Text style={styles.verifyPickupButtonText}>Verify Pickup Code</Text>
              </TouchableOpacity>
            )}

            {!dbOrder.is_local_pickup && dbOrder.shipping_status === 'pending' && dbOrder.status === 'completed' && (
              <TouchableOpacity 
                style={styles.addShippingButton}
                onPress={() => setShowAddShippingModal(true)}
              >
                <Truck size={20} color={Colors.white} />
                <Text style={styles.addShippingButtonText}>Add Shipping Info</Text>
              </TouchableOpacity>
            )}

            {dbOrder.shipping_status === 'shipped' && !dbOrder.delivered_at && (
              <TouchableOpacity 
                style={styles.markDeliveredButton}
                onPress={handleMarkDelivered}
              >
                <CheckCircle size={20} color={Colors.white} />
                <Text style={styles.markDeliveredButtonText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Contact Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {dbOrder && (
        <>
          <AddShippingModal
            visible={showAddShippingModal}
            onClose={() => setShowAddShippingModal(false)}
            onSubmit={handleAddShipping}
            orderNumber={dbOrder.order_number}
          />
          <VerifyPickupCodeModal
            visible={showVerifyPickupModal}
            onClose={() => setShowVerifyPickupModal(false)}
            onVerify={(code) => verifyPickupCode(dbOrder.id, code, dbOrder.vendor_id)}
            orderNumber={dbOrder.order_number}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.muted,
    marginTop: 16,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  customerInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  customerEmail: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 2,
  },
  itemBasePrice: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  customizationSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  customizationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  customizationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  customizationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customizationLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  customizationValue: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  customizationPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  proofStatusSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  proofStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  proofStatusText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  proofActions: {
    marginTop: 12,
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  proofInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  proofInput: {
    flex: 1,
    backgroundColor: Colors.light.cream,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  uploadIconButton: {
    backgroundColor: Colors.nautical.teal,
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconButtonDisabled: {
    opacity: 0.5,
  },
  approvalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 12,
  },
  approvalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  approvalSubtext: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 2,
  },
  viewProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    borderRadius: 10,
  },
  viewProofButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  itemTotalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  itemTotalPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  summarySection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.light.text,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  summaryTotal: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  secondaryButtonText: {
    color: Colors.nautical.teal,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.muted,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  paymentSection: {
    padding: 20,
    paddingTop: 0,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paymentItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  memoContainer: {
    marginBottom: 12,
  },
  memoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginBottom: 6,
  },
  memoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  memoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace' as const,
    color: Colors.light.text,
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  paymentButtons: {
    gap: 8,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#008CFF',
    paddingVertical: 12,
    borderRadius: 10,
  },
  paypalButton: {
    backgroundColor: '#0070BA',
  },
  ecommerceButton: {
    backgroundColor: Colors.nautical.teal,
  },
  paymentMethodText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  shippingSection: {
    padding: 20,
    paddingTop: 0,
  },
  addShippingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  addShippingButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  markDeliveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  markDeliveredButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  verifyPickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  verifyPickupButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
