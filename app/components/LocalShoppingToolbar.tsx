import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LocalShoppingToolbarProps {
  zipCode: string;
  onZipCodeChange: (zip: string) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

const RADIUS_OPTIONS = [10, 25, 50, 100];

export function LocalShoppingToolbar({
  zipCode,
  onZipCodeChange,
  radius,
  onRadiusChange,
}: LocalShoppingToolbarProps) {
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);

  const handleRadiusSelect = (selectedRadius: number) => {
    onRadiusChange(selectedRadius);
    setShowRadiusMenu(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.ropeDecor} />
      
      <View style={styles.content}>
        <Text style={styles.shopLocalTitle}>Shop Local</Text>
        
        <View style={styles.topRow}>
          <View style={styles.zipInputContainer}>
            <MapPin size={18} color={Colors.nautical.teal} />
            <TextInput
              style={styles.zipInput}
              placeholder="Enter ZIP code or address"
              placeholderTextColor={Colors.light.muted}
              value={zipCode}
              onChangeText={onZipCodeChange}
            />
          </View>

          <View style={styles.radiusContainer}>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => setShowRadiusMenu(!showRadiusMenu)}
            >
              <Text style={styles.radiusButtonText}>{radius} mi</Text>
              <ChevronDown size={16} color={Colors.nautical.oceanDeep} />
            </TouchableOpacity>

            {showRadiusMenu && (
              <View style={styles.radiusMenu}>
                {RADIUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radiusMenuItem,
                      radius === option && styles.radiusMenuItemActive,
                    ]}
                    onPress={() => handleRadiusSelect(option)}
                  >
                    <Text
                      style={[
                        styles.radiusMenuItemText,
                        radius === option && styles.radiusMenuItemTextActive,
                      ]}
                    >
                      {option} miles
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.nautical.sandLight,
    borderBottomWidth: 3,
    borderBottomColor: Colors.nautical.sand,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
  ropeDecor: {
    height: 2,
    backgroundColor: Colors.nautical.driftwood,
    opacity: 0.6,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 4,
  },
  shopLocalTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  zipInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  zipInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanDeep,
  },
  radiusContainer: {
    position: 'relative' as const,
    zIndex: 100,
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.nautical.sand,
    minWidth: 85,
    justifyContent: 'space-between',
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  radiusMenu: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.nautical.sand,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 110,
    overflow: 'hidden',
  },
  radiusMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  radiusMenuItemActive: {
    backgroundColor: Colors.nautical.oceanFoam,
  },
  radiusMenuItemText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanDeep,
  },
  radiusMenuItemTextActive: {
    fontWeight: '700' as const,
    color: Colors.nautical.tealDark,
  },

});
