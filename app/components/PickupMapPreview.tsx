import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { MapPin, ExternalLink } from 'lucide-react-native';
import Colors from '@/app/constants/colors';

interface PickupMapPreviewProps {
  pickupPublicLabel: string;
  pickupGeoLat: number;
  pickupGeoLon: number;
  pickupNotes?: string;
  variant?: 'compact' | 'detailed';
}

export function PickupMapPreview({
  pickupPublicLabel,
  pickupGeoLat,
  pickupGeoLon,
  pickupNotes,
  variant = 'compact',
}: PickupMapPreviewProps) {
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${pickupGeoLat},${pickupGeoLon}`;
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      import('expo-linking').then(({ default: Linking }) => {
        Linking.openURL(url);
      });
    }
  };

  const getStaticMapUrl = () => {
    const roundedLat = pickupGeoLat.toFixed(3);
    const roundedLon = pickupGeoLon.toFixed(3);
    const zoom = variant === 'compact' ? 12 : 14;
    const size = variant === 'compact' ? '300x150' : '400x200';
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${roundedLat},${roundedLon}&zoom=${zoom}&size=${size}&markers=color:teal%7C${roundedLat},${roundedLon}&key=YOUR_API_KEY`;
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <MapPin size={16} color={Colors.nautical.teal} />
          <Text style={styles.compactTitle}>Pickup available near</Text>
        </View>
        <Text style={styles.compactLocation}>{pickupPublicLabel}</Text>
        <TouchableOpacity style={styles.compactButton} onPress={openInGoogleMaps}>
          <ExternalLink size={14} color={Colors.nautical.teal} />
          <Text style={styles.compactButtonText}>View in Maps</Text>
        </TouchableOpacity>
        <Text style={styles.compactNote}>(Approximate location)</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      <View style={styles.detailedHeader}>
        <MapPin size={20} color={Colors.nautical.teal} />
        <Text style={styles.detailedTitle}>Pickup Location</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color={Colors.nautical.teal} />
        <Text style={styles.mapPlaceholderText}>Map Preview</Text>
        <Text style={styles.mapPlaceholderCoords}>
          {pickupGeoLat.toFixed(3)}, {pickupGeoLon.toFixed(3)}
        </Text>
      </View>

      <View style={styles.detailedInfo}>
        <Text style={styles.detailedLocation}>{pickupPublicLabel}</Text>
        {pickupNotes && <Text style={styles.detailedNotes}>{pickupNotes}</Text>}
      </View>

      <TouchableOpacity style={styles.detailedButton} onPress={openInGoogleMaps}>
        <ExternalLink size={18} color={Colors.white} />
        <Text style={styles.detailedButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>

      <Text style={styles.privacyNote}>
        📍 Approximate area shown. Exact address provided after order.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    gap: 6,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 6,
  },
  compactTitle: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '500' as const,
  },
  compactLocation: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    alignSelf: 'flex-start' as const,
  },
  compactButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  compactNote: {
    fontSize: 11,
    color: Colors.light.muted,
    fontStyle: 'italic' as const,
  },
  detailedContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 10,
  },
  detailedTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  mapPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  mapPlaceholderCoords: {
    fontSize: 12,
    color: Colors.light.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailedInfo: {
    gap: 6,
  },
  detailedLocation: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  detailedNotes: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  detailedButton: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  detailedButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  privacyNote: {
    fontSize: 11,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
});
