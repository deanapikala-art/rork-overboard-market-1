import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import {
  Package,
  Truck,
  CheckCircle,
  ExternalLink,
  Clock,
  MapPin,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ShippingStatusCardProps {
  shippingStatus:
    | 'pending'
    | 'shipped'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'pickup_ready'
    | 'picked_up';
  shippingProvider: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  deliveryConfirmedBy: 'System' | 'Vendor' | 'Customer' | null;
  estimatedDeliveryDate: string | null;
  deliveryNotes: string | null;
  isLocalPickup?: boolean;
}

export default function ShippingStatusCard({
  shippingStatus,
  shippingProvider,
  trackingNumber,
  trackingUrl,
  shippedAt,
  deliveredAt,
  deliveryConfirmedBy,
  estimatedDeliveryDate,
  deliveryNotes,
  isLocalPickup = false,
}: ShippingStatusCardProps) {
  const getStatusColor = () => {
    switch (shippingStatus) {
      case 'pending':
        return Colors.light.muted;
      case 'shipped':
      case 'in_transit':
        return Colors.nautical.mustard;
      case 'out_for_delivery':
        return Colors.nautical.teal;
      case 'delivered':
      case 'picked_up':
        return '#22C55E';
      case 'pickup_ready':
        return Colors.nautical.oceanDeep;
      default:
        return Colors.light.muted;
    }
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    const size = 24;

    switch (shippingStatus) {
      case 'pending':
        return <Clock size={size} color={color} />;
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck size={size} color={color} />;
      case 'delivered':
      case 'picked_up':
        return <CheckCircle size={size} color={color} />;
      case 'pickup_ready':
        return <MapPin size={size} color={color} />;
      default:
        return <Package size={size} color={color} />;
    }
  };

  const getStatusText = () => {
    switch (shippingStatus) {
      case 'pending':
        return 'Preparing Order';
      case 'shipped':
        return 'Shipped';
      case 'in_transit':
        return 'In Transit';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'pickup_ready':
        return 'Ready for Pickup';
      case 'picked_up':
        return 'Picked Up';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = () => {
    if (isLocalPickup) {
      if (shippingStatus === 'pickup_ready') {
        return 'Your order is ready for pickup';
      } else if (shippingStatus === 'picked_up') {
        return 'Order has been picked up';
      }
      return 'Local pickup order';
    }

    switch (shippingStatus) {
      case 'pending':
        return 'Vendor is preparing your order for shipment';
      case 'shipped':
        return 'Your order has been shipped';
      case 'in_transit':
        return 'Your package is on its way';
      case 'out_for_delivery':
        return 'Your package is out for delivery today';
      case 'delivered':
        return deliveryConfirmedBy
          ? `Confirmed by ${deliveryConfirmedBy}`
          : 'Your package has been delivered';
      default:
        return '';
    }
  };

  const handleTrackingPress = async () => {
    if (trackingUrl) {
      try {
        await Linking.openURL(trackingUrl);
      } catch (error) {
        console.error('[ShippingStatusCard] Failed to open tracking URL:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.statusDescription}>{getStatusDescription()}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + '20', borderColor: getStatusColor() },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
        </View>
      </View>

      {!isLocalPickup && shippingProvider && trackingNumber && (
        <View style={styles.trackingSection}>
          <View style={styles.trackingInfo}>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Carrier:</Text>
              <Text style={styles.trackingValue}>{shippingProvider}</Text>
            </View>
            <View style={styles.trackingRow}>
              <Text style={styles.trackingLabel}>Tracking #:</Text>
              <Text style={styles.trackingValue}>{trackingNumber}</Text>
            </View>
          </View>

          {trackingUrl && (
            <TouchableOpacity style={styles.trackButton} onPress={handleTrackingPress}>
              <Text style={styles.trackButtonText}>Track Package</Text>
              <ExternalLink size={16} color={Colors.nautical.teal} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {shippedAt && (
        <View style={styles.dateInfo}>
          <Package size={16} color={Colors.light.muted} />
          <Text style={styles.dateText}>Shipped on {formatDate(shippedAt)}</Text>
        </View>
      )}

      {estimatedDeliveryDate && shippingStatus !== 'delivered' && (
        <View style={styles.dateInfo}>
          <Clock size={16} color={Colors.light.muted} />
          <Text style={styles.dateText}>
            Estimated delivery: {formatDate(estimatedDeliveryDate)}
          </Text>
        </View>
      )}

      {deliveredAt && (
        <View style={styles.dateInfo}>
          <CheckCircle size={16} color="#22C55E" />
          <Text style={[styles.dateText, styles.deliveredText]}>
            Delivered on {formatDate(deliveredAt)}
          </Text>
        </View>
      )}

      {deliveryNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Delivery Notes:</Text>
          <Text style={styles.notesText}>{deliveryNotes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trackingSection: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  trackingInfo: {
    marginBottom: 12,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginRight: 8,
    width: 80,
  },
  trackingValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  deliveredText: {
    color: '#22C55E',
    fontWeight: '600' as const,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
});
