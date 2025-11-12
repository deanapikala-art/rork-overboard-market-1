import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Truck, MapPin, Clock } from 'lucide-react-native';
import Colors from '@/app/constants/colors';

interface ShippingSettings {
  flatPerItem?: number;
  flatPerOrder?: number;
  freeShippingOver?: number;
  allowLocalPickup?: boolean;
  pickupInstructions?: string;
  handlingTimeDays?: number;
  deliveryMessage?: string;
  pickupPublicLabel?: string;
  pickupNotes?: string;
  pickupRadiusMiles?: number;
}

interface ShippingDisplayProps {
  settings: ShippingSettings;
  location?: string;
  variant?: 'compact' | 'detailed';
}

export function ShippingDisplay({ settings, location, variant = 'compact' }: ShippingDisplayProps) {
  const hasShipping = settings.flatPerItem || settings.flatPerOrder || settings.freeShippingOver;

  if (!hasShipping && !settings.allowLocalPickup) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Truck size={16} color={Colors.nautical.teal} />
        <Text style={styles.compactText}>
          {settings.flatPerItem && `Shipping from $${settings.flatPerItem.toFixed(2)} per item`}
          {settings.flatPerOrder && !settings.flatPerItem && `Flat rate shipping $${settings.flatPerOrder.toFixed(2)}`}
          {settings.freeShippingOver && ` • Free over $${settings.freeShippingOver.toFixed(2)}`}
        </Text>
        {settings.allowLocalPickup && (
          <>
            <Text style={styles.compactSeparator}>•</Text>
            <MapPin size={16} color={Colors.nautical.teal} />
            <Text style={styles.compactText}>Local pickup</Text>
          </>
        )}
        {settings.handlingTimeDays && settings.handlingTimeDays > 0 && (
          <>
            <Text style={styles.compactSeparator}>•</Text>
            <Clock size={16} color={Colors.nautical.teal} />
            <Text style={styles.compactText}>Ships in {settings.handlingTimeDays} {settings.handlingTimeDays === 1 ? 'day' : 'days'}</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      <Text style={styles.detailedTitle}>Shipping Policy</Text>
      <View style={styles.detailedContent}>
        {settings.flatPerItem && (
          <View style={styles.detailedRow}>
            <Text style={styles.detailedLabel}>• Flat rate per item:</Text>
            <Text style={styles.detailedValue}>${settings.flatPerItem.toFixed(2)}</Text>
          </View>
        )}
        {settings.flatPerOrder && (
          <View style={styles.detailedRow}>
            <Text style={styles.detailedLabel}>• Flat rate per order:</Text>
            <Text style={styles.detailedValue}>${settings.flatPerOrder.toFixed(2)}</Text>
          </View>
        )}
        {settings.freeShippingOver && (
          <View style={styles.detailedRow}>
            <Text style={styles.detailedLabel}>• Free shipping over:</Text>
            <Text style={styles.detailedValue}>${settings.freeShippingOver.toFixed(2)}</Text>
          </View>
        )}
        {settings.allowLocalPickup && (
          <View style={styles.detailedRow}>
            <MapPin size={16} color={Colors.nautical.teal} />
            <Text style={styles.detailedValue}>Local pickup available</Text>
            {settings.pickupPublicLabel && (
              <Text style={styles.detailedLocation}>({settings.pickupPublicLabel})</Text>
            )}
          </View>
        )}
        {settings.allowLocalPickup && settings.pickupRadiusMiles && (
          <View style={styles.detailedRow}>
            <Text style={styles.detailedLabel}>• Pickup radius:</Text>
            <Text style={styles.detailedValue}>{settings.pickupRadiusMiles} miles</Text>
          </View>
        )}
        {settings.handlingTimeDays && settings.handlingTimeDays > 0 && (
          <View style={styles.detailedRow}>
            <Text style={styles.detailedLabel}>• Handling time:</Text>
            <Text style={styles.detailedValue}>{settings.handlingTimeDays} business {settings.handlingTimeDays === 1 ? 'day' : 'days'}</Text>
          </View>
        )}
        {settings.deliveryMessage && (
          <Text style={styles.deliveryMessage}>{settings.deliveryMessage}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  compactText: {
    fontSize: 13,
    color: Colors.nautical.oceanDeep,
    fontWeight: '500' as const,
  },
  compactSeparator: {
    fontSize: 13,
    color: Colors.light.muted,
    marginHorizontal: 2,
  },
  detailedContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  detailedContent: {
    gap: 8,
  },
  detailedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailedLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  detailedValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  detailedLocation: {
    fontSize: 14,
    color: Colors.light.muted,
    fontStyle: 'italic' as const,
  },
  deliveryMessage: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 8,
    lineHeight: 18,
  },
});
