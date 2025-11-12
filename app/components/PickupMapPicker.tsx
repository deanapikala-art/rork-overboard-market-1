// Native-only version for iOS/Android
// Uses react-native-maps which is not available on web
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, Navigation, RotateCcw, ExternalLink } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import Colors from '@/app/constants/colors';

let MapView: any;
let Marker: any;
let Circle: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Circle = maps.Circle;
}

interface PickupMapPickerProps {
  pickupOriginZip: string;
  pickupGeoLat?: number;
  pickupGeoLon?: number;
  pickupRadiusMiles: number;
  onLocationChange?: (lat: number, lon: number) => void;
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const MILES_TO_METERS = 1609.34;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_WIDTH * 0.8, 400);

export function PickupMapPicker({
  pickupOriginZip,
  pickupGeoLat,
  pickupGeoLon,
  pickupRadiusMiles,
  onLocationChange,
}: PickupMapPickerProps) {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [markerCoordinate, setMarkerCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const geocodeZip = async (zip: string) => {
    try {
      const coords = await getCoordinatesFromZip(zip);
      if (coords) {
        const newRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(newRegion);
        setMarkerCoordinate(coords);
        onLocationChange?.(coords.latitude, coords.longitude);
      }
    } catch (error) {
      console.error('[PickupMapPicker] Error geocoding ZIP:', error);
    }
  };

  useEffect(() => {
    if (pickupGeoLat && pickupGeoLon) {
      const initialRegion = {
        latitude: pickupGeoLat,
        longitude: pickupGeoLon,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(initialRegion);
      setMarkerCoordinate({ latitude: pickupGeoLat, longitude: pickupGeoLon });
    } else if (pickupOriginZip && pickupOriginZip.length === 5) {
      geocodeZip(pickupOriginZip);
    }
  }, [pickupOriginZip, pickupGeoLat, pickupGeoLon]);

  const getCoordinatesFromZip = async (zip: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const results = await Location.geocodeAsync(`${zip}, USA`);
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
    } catch (error) {
      console.error('[PickupMapPicker] Geocoding error:', error);
    }
    return null;
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const roundedLat = Math.round(latitude * 1000) / 1000;
    const roundedLon = Math.round(longitude * 1000) / 1000;
    
    setMarkerCoordinate({ latitude: roundedLat, longitude: roundedLon });
    onLocationChange?.(roundedLat, roundedLon);
  };

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const roundedLat = Math.round(location.coords.latitude * 1000) / 1000;
      const roundedLon = Math.round(location.coords.longitude * 1000) / 1000;

      const newRegion = {
        latitude: roundedLat,
        longitude: roundedLon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(newRegion);
      setMarkerCoordinate({ latitude: roundedLat, longitude: roundedLon });
      mapRef.current?.animateToRegion(newRegion, 500);
      onLocationChange?.(roundedLat, roundedLon);
    } catch (error) {
      console.error('[PickupMapPicker] Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
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
      Linking.openURL(url);
    }
  };

  if (!region) {
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
        Tap on the map to set your pickup area. For privacy, your location is rounded to approximately 0.6 mile accuracy.
      </Text>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {markerCoordinate && (
            <>
              <Marker
                coordinate={markerCoordinate}
                title="Pickup Location"
                description="Approximate pickup area"
                pinColor={Colors.nautical.teal}
              />
              <Circle
                center={markerCoordinate}
                radius={pickupRadiusMiles * MILES_TO_METERS}
                strokeColor={Colors.nautical.teal}
                fillColor="rgba(0, 128, 128, 0.1)"
                strokeWidth={2}
              />
            </>
          )}
        </MapView>
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
  map: {
    width: '100%',
    height: '100%',
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
    fontFamily: 'monospace',
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
