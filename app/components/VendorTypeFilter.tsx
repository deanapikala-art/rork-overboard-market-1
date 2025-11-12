import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '@/app/constants/colors';
import { ALL_SERVICE_CATEGORIES } from '@/app/constants/serviceCategories';

export type VendorFilterType = 'all' | 'product' | 'service';

interface VendorTypeFilterProps {
  selectedType: VendorFilterType;
  onTypeChange: (type: VendorFilterType) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function VendorTypeFilter({
  selectedType,
  onTypeChange,
  selectedCategories,
  onCategoriesChange,
}: VendorTypeFilterProps) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.filterLabel}>Filter by</Text>
      
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            styles.segmentButtonLeft,
            selectedType === 'all' && styles.segmentButtonActive,
          ]}
          onPress={() => onTypeChange('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentButtonText,
              selectedType === 'all' && styles.segmentButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            styles.segmentButtonMiddle,
            selectedType === 'product' && styles.segmentButtonActive,
          ]}
          onPress={() => onTypeChange('product')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentButtonText,
              selectedType === 'product' && styles.segmentButtonTextActive,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            styles.segmentButtonRight,
            selectedType === 'service' && styles.segmentButtonActive,
          ]}
          onPress={() => onTypeChange('service')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentButtonText,
              selectedType === 'service' && styles.segmentButtonTextActive,
            ]}
          >
            Services
          </Text>
        </TouchableOpacity>
      </View>

      {selectedType === 'service' && (
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>Service Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {ALL_SERVICE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category) && styles.categoryChipActive,
                ]}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategories.includes(category) && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default VendorTypeFilter;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.light.softGray,
    borderRadius: 10,
    padding: 3,
    height: 44,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  segmentButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonMiddle: {
    marginHorizontal: 2,
  },
  segmentButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  segmentButtonTextActive: {
    color: Colors.nautical.teal,
    fontWeight: '700' as const,
  },
  categoriesSection: {
    gap: 10,
  },
  categoriesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  categoriesScroll: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
});
