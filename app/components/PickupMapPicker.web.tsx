import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Navigation, RotateCcw, ExternalLink } from 'lucide-react-native';
import Colors from '@/app/constants/colors';

interface PickupMapPickerProps {
  pickupOriginZip: string;
  pickupGeoLat?: number;
  pickupGeoLon?: number;
  pickupRadiusMiles: number;
  onLocationChange?: (lat: number, lon: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_WIDTH * 0.8, 400);

export function PickupMapPicker({
  pickupOriginZip,
  pickupGeoLat,
  pickupGeoLon,
  pickupRadiusMiles,
  onLocationChange,
}: PickupMapPickerProps) {
  const [markerCoordinate, setMarkerCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pickupGeoLat && pickupGeoLon) {
      setMarkerCoordinate({ latitude: pickupGeoLat, longitude: pickupGeoLon });
      setIsLoading(false);
    } else if (pickupOriginZip && pickupOriginZip.length === 5) {
      geocodeZip(pickupOriginZip);
    } else {
      setIsLoading(false);
    }
  }, [pickupOriginZip, pickupGeoLat, pickupGeoLon]);

  const geocodeZip = async (zip: string) => {
    try {
      const coords = await getCoordinatesFromZip(zip);
      if (coords) {
        setMarkerCoordinate(coords);
        onLocationChange?.(coords.latitude, coords.longitude);
      }
    } catch (error) {
      console.error('[PickupMapPicker] Error geocoding ZIP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCoordinatesFromZip = async (zip: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (response.ok) {
        const data = await response.json();
        if (data.places && data.places.length > 0) {
          return {
            latitude: parseFloat(data.places[0].latitude),
            longitude: parseFloat(data.places[0].longitude),
          };
        }
      }
    } catch (error) {
      console.error('[PickupMapPicker] Geocoding error:', error);
    }
    return null;
  };

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const roundedLat = Math.round(position.coords.latitude * 1000) / 1000;
          const roundedLon = Math.round(position.coords.longitude * 1000) / 1000;

          setMarkerCoordinate({ latitude: roundedLat, longitude: roundedLon });
          onLocationChange?.(roundedLat, roundedLon);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('[PickupMapPicker] Error getting location:', error);
          alert('Failed to get your location. Please enable location services and try again.');
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error('[PickupMapPicker] Error getting location:', error);
      alert('Failed to get your location. Please try again.');
      setIsLoadingLocation(false);
    }
  };

  const handleReset = () => {
    if (pickupOriginZip && pickupOriginZip.length === 5) {
      geocodeZip(pickupOriginZip);
    }
  };

  const openInGoogleMaps = () => {
    if (markerCoordinate) {
      const url = `https://www.google.com/maps/search/?api=1&query=${markerCoordinate.latitude},${markerCoordinate.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.nautical.teal} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapHeader}>
        <MapPin size={20} color={Colors.nautical.teal} />
        <Text style={styles.mapTitle}>Choose Pickup Location</Text>
      </View>
      
      <Text style={styles.mapDescription}>
        Set your pickup area. For privacy, your location is rounded to approximately 0.6 mile accuracy.
      </Text>

      <View style={styles.mapContainer}>
        <View style={styles.webMapPlaceholder}>
          <MapPin size={48} color={Colors.nautical.teal} />
          <Text style={styles.webMapText}>Map Preview</Text>
          <Text style={styles.webMapSubtext}>
            {markerCoordinate 
              ? `Selected: ${markerCoordinate.latitude.toFixed(3)}, ${markerCoordinate.longitude.toFixed(3)}`
              : 'No location selected'}
          </Text>
          <Text style={styles.webMapNote}>
            Map picker available on mobile app
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleUseMyLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={Colors.nautical.teal} />
            ) : (
              <Navigation size={18} color={Colors.nautical.teal} />
            )}
            <Text style={styles.controlButtonText}>Use My Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleReset}
          >
            <RotateCcw size={18} color={Colors.nautical.teal} />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {markerCoordinate && (
          <TouchableOpacity
            style={styles.viewInMapsButton}
            onPress={openInGoogleMaps}
          >
            <ExternalLink size={18} color={Colors.white} />
            <Text style={styles.viewInMapsButtonText}>View in Google Maps</Text>
          </TouchableOpacity>
        )}
      </View>

      {markerCoordinate && (
        <View style={styles.coordinatesBox}>
          <Text style={styles.coordinatesLabel}>Selected Coordinates (Rounded):</Text>
          <Text style={styles.coordinatesText}>
            {markerCoordinate.latitude.toFixed(3)}, {markerCoordinate.longitude.toFixed(3)}
          </Text>
          <Text style={styles.coordinatesNote}>
            Pickup radius: {pickupRadiusMiles} miles
          </Text>
        </View>
      )}

      <View style={styles.privacyNote}>
        <Text style={styles.privacyNoteText}>
          🔒 Your exact address is never shown. Coordinates are rounded to protect your privacy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    height: MAP_HEIGHT,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  mapDescription: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  webMapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.nautical.sandLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  webMapText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  webMapSubtext: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  webMapNote: {
    fontSize: 12,
    color: Colors.nautical.teal,
    textAlign: 'center' as const,
    marginTop: 8,
    fontWeight: '600' as const,
  },
  controls: {
    marginTop: 12,
    gap: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  viewInMapsButton: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  viewInMapsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  coordinatesBox: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  coordinatesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    fontFamily: 'Courier',
  },
  coordinatesNote: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 4,
  },
  privacyNote: {
    backgroundColor: 'rgba(0, 128, 128, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  privacyNoteText: {
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 16,
  },
});
