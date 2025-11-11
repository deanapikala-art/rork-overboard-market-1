import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Truck, MapPin, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ShippingSettings {
  flatPerItem?: number;
  flatPerOrder?: number;
  freeShippingOver?: number;
  allowLocalPickup?: boolean;
  pickupInstructions?: string;
  pickupOriginZip?: string;
  pickupPublicLabel?: string;
  pickupNotes?: string;
  pickupRadiusMiles?: number;
}

interface CartShippingInfoProps {
  vendorName: string;
  itemCount: number;
  subtotal: number;
  settings: ShippingSettings;
  onPickupToggle?: (enabled: boolean) => void;
  distanceFromVendor?: number;
}

export function CartShippingInfo({ 
  vendorName, 
  itemCount, 
  subtotal, 
  settings,
  onPickupToggle,
  distanceFromVendor 
}: CartShippingInfoProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(false);

  const calculateShipping = () => {
    if (pickupEnabled) return 0;
    
    if (settings.freeShippingOver && subtotal >= settings.freeShippingOver) {
      return 0;
    }

    const perItemCost = (settings.flatPerItem || 0) * itemCount;
    const perOrderCost = settings.flatPerOrder || 0;

    if (perItemCost > 0 && perOrderCost > 0) {
      return Math.min(perItemCost, perOrderCost);
    }

    return perItemCost || perOrderCost;
  };

  const shippingCost = calculateShipping();
  const qualifiesForFreeShipping = 
    settings.freeShippingOver && 
    subtotal >= settings.freeShippingOver;

  const handlePickupToggle = (value: boolean) => {
    setPickupEnabled(value);
    onPickupToggle?.(value);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setShowDetails(!showDetails)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Truck size={18} color={Colors.nautical.teal} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Shipping</Text>
            <Text style={styles.shippingCost}>
              {pickupEnabled ? 'Free (Pickup)' : shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
            </Text>
          </View>
        </View>
        {showDetails ? (
          <ChevronUp size={18} color={Colors.light.muted} />
        ) : (
          <ChevronDown size={18} color={Colors.light.muted} />
        )}
      </TouchableOpacity>

      {qualifiesForFreeShipping && !pickupEnabled && (
        <View style={styles.freeBanner}>
          <AlertCircle size={14} color="#22C55E" />
          <Text style={styles.freeBannerText}>
            🎉 You qualified for free shipping from {vendorName}!
          </Text>
        </View>
      )}

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items ({itemCount}):</Text>
            <Text style={styles.detailValue}>${subtotal.toFixed(2)}</Text>
          </View>

          {!pickupEnabled && (
            <>
              {settings.flatPerItem && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Flat per item:</Text>
                  <Text style={styles.detailValue}>${settings.flatPerItem.toFixed(2)}</Text>
                </View>
              )}
              {settings.flatPerOrder && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Flat per order:</Text>
                  <Text style={styles.detailValue}>${settings.flatPerOrder.toFixed(2)}</Text>
                </View>
              )}
              {settings.freeShippingOver && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Free shipping over:</Text>
                  <Text style={styles.detailValue}>${settings.freeShippingOver.toFixed(2)}</Text>
                </View>
              )}
            </>
          )}

          {settings.allowLocalPickup ? (
            distanceFromVendor && distanceFromVendor > (settings.pickupRadiusMiles || 75) ? (
              <View style={[styles.pickupSection, styles.pickupDisabled]}>
                <View style={styles.pickupInfo}>
                  <MapPin size={16} color={Colors.light.muted} />
                  <Text style={styles.pickupDisabledText}>
                    Local pickup only available within {settings.pickupRadiusMiles || 75} miles of {settings.pickupPublicLabel || 'vendor'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.pickupSection}>
                <View style={styles.pickupToggleRow}>
                  <View style={styles.pickupInfo}>
                    <MapPin size={16} color={Colors.nautical.teal} />
                    <View style={styles.pickupTextContainer}>
                      <Text style={styles.pickupLabel}>Pick up locally instead</Text>
                      {settings.pickupPublicLabel && (
                        <Text style={styles.pickupLocation}>{settings.pickupPublicLabel}</Text>
                      )}
                    </View>
                  </View>
                  <Switch
                    value={pickupEnabled}
                    onValueChange={handlePickupToggle}
                    trackColor={{ false: Colors.light.border, true: Colors.nautical.teal }}
                    thumbColor={Colors.white}
                  />
                </View>
                {pickupEnabled && settings.pickupNotes && (
                  <View style={styles.pickupInstructions}>
                    <Text style={styles.pickupInstructionsText}>
                      {settings.pickupNotes}
                    </Text>
                  </View>
                )}
              </View>
            )
          ) : null}

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Subtotal + Shipping:</Text>
            <Text style={styles.totalValue}>${(subtotal + shippingCost).toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  shippingCost: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  freeBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#22C55E',
    flex: 1,
  },
  details: {
    padding: 14,
    paddingTop: 0,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  pickupSection: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  pickupToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickupLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  pickupInstructions: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  pickupInstructionsText: {
    fontSize: 12,
    color: Colors.light.muted,
    lineHeight: 16,
  },
  totalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  pickupDisabled: {
    backgroundColor: Colors.light.softGray,
    borderColor: Colors.light.border,
    opacity: 0.7,
  },
  pickupDisabledText: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  pickupTextContainer: {
    flex: 1,
    gap: 2,
  },
  pickupLocation: {
    fontSize: 12,
    color: Colors.nautical.teal,
    fontWeight: '500' as const,
  },
});
