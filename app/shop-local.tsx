import { router, Stack } from 'expo-router';
import { MapPin, ChevronRight, Store } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';
import { US_STATES, US_REGIONS, State } from '@/app/constants/states';
import { vendors, Vendor } from '@/mocks/vendors';
import { events, Event } from '@/mocks/events';

type FilterMode = 'state' | 'region';

export default function ShopLocalPage() {
  const insets = useSafeAreaInsets();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('state');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = useMemo(() => {
    let result = vendors.filter(v => v.subscriptionStatus === 'active');

    if (filterMode === 'state' && selectedState) {
      result = result.filter(v => v.state === selectedState);
    } else if (filterMode === 'region' && selectedRegion) {
      result = result.filter(v => v.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        v =>
          v.name.toLowerCase().includes(query) ||
          v.specialty?.toLowerCase().includes(query) ||
          v.location.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedState, selectedRegion, filterMode, searchQuery]);

  const relevantEvents = useMemo((): Event[] => {
    if (!selectedState && !selectedRegion) return [];
    
    return events.filter(event => {
      if (event.status !== 'live') return false;
      
      if (filterMode === 'state' && selectedState) {
        return (
          event.locationScope === 'Nationwide' ||
          event.featuredStateCodes?.includes(selectedState) ||
          event.locationScope === selectedState
        );
      }
      
      if (filterMode === 'region' && selectedRegion) {
        return (
          event.locationScope === 'Nationwide' ||
          event.locationScope === selectedRegion
        );
      }
      
      return false;
    });
  }, [selectedState, selectedRegion, filterMode]);

  const handleStateSelect = (stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedRegion(null);
    setFilterMode('state');
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setSelectedState(null);
    setFilterMode('region');
  };

  const handleVendorPress = (vendor: Vendor) => {
    router.push(`/vendor/${vendor.id}`);
  };

  const handleEventPress = (event: Event) => {
    router.push(`/events/${event.slug || event.id}/booths`);
  };

  const handleClearFilters = () => {
    setSelectedState(null);
    setSelectedRegion(null);
    setSearchQuery('');
  };

  const renderStateButton = ({ item }: { item: State }) => (
    <TouchableOpacity
      style={[
        styles.stateButton,
        selectedState === item.code && styles.stateButtonSelected,
      ]}
      onPress={() => handleStateSelect(item.code)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.stateButtonText,
          selectedState === item.code && styles.stateButtonTextSelected,
        ]}
      >
        {item.name}
      </Text>
      <Text style={styles.stateButtonCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  const renderRegionButton = (region: string) => (
    <TouchableOpacity
      key={region}
      style={[
        styles.regionButton,
        selectedRegion === region && styles.regionButtonSelected,
      ]}
      onPress={() => handleRegionSelect(region)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.regionButtonText,
          selectedRegion === region && styles.regionButtonTextSelected,
        ]}
      >
        {region}
      </Text>
    </TouchableOpacity>
  );

  const renderVendorCard = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => handleVendorPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.avatar }}
        style={styles.vendorAvatar}
        contentFit="cover"
      />
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.vendorSpecialty} numberOfLines={1}>
          {item.specialty}
        </Text>
        <View style={styles.vendorLocation}>
          <MapPin size={14} color={Colors.nautical.teal} />
          <Text style={styles.vendorLocationText}>{item.location}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.light.mediumGray} />
    </TouchableOpacity>
  );

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.eventImage}
        contentFit="cover"
      />
      <View style={styles.eventOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.eventGradient}
        >
          <View style={styles.eventLiveBadge}>
            <View style={styles.eventLivePulse} />
            <Text style={styles.eventLiveText}>LIVE</Text>
          </View>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.eventMeta}>
            {item.vendorCount} vendors • {item.time}
          </Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Shop Local',
          headerStyle: {
            backgroundColor: Colors.nautical.teal,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 18,
          },
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.nautical.teal, Colors.nautical.oceanDeep]}
          style={styles.headerSection}
        >
          <Text style={styles.headerTitle}>Discover Local Makers</Text>
          <Text style={styles.headerSubtitle}>
            Shop from vendors in your state or explore nearby regions
          </Text>
        </LinearGradient>

        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors or specialties..."
            placeholderTextColor={Colors.light.mediumGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter by Region</Text>
            {(selectedState || selectedRegion) && (
              <TouchableOpacity onPress={handleClearFilters} activeOpacity={0.7}>
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionScrollContent}
          >
            {US_REGIONS.map(region => renderRegionButton(region))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filter by State</Text>
          <FlatList
            data={US_STATES}
            keyExtractor={item => item.code}
            renderItem={renderStateButton}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.stateGrid}
            contentContainerStyle={styles.stateListContent}
          />
        </View>

        {relevantEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>
              Live Events in{' '}
              {filterMode === 'state' && selectedState
                ? US_STATES.find(s => s.code === selectedState)?.name
                : selectedRegion}
            </Text>
            <FlatList
              data={relevantEvents}
              keyExtractor={item => item.id}
              renderItem={renderEventCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsListContent}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.vendorsSection}>
          <View style={styles.sectionHeader}>
            <Store size={24} color={Colors.nautical.teal} />
            <Text style={styles.sectionTitle}>
              {selectedState || selectedRegion
                ? `Vendors in ${
                    filterMode === 'state' && selectedState
                      ? US_STATES.find(s => s.code === selectedState)?.name
                      : selectedRegion
                  }`
                : 'All Active Vendors'}
            </Text>
          </View>
          <Text style={styles.vendorCount}>
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
          </Text>
          <FlatList
            data={filteredVendors}
            keyExtractor={item => item.id}
            renderItem={renderVendorCard}
            scrollEnabled={false}
            contentContainerStyle={styles.vendorListContent}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    padding: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanFoam,
    lineHeight: 22,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.charcoal,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  regionScrollContent: {
    gap: 8,
  },
  regionButton: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  regionButtonSelected: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  regionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
  },
  regionButtonTextSelected: {
    color: Colors.white,
  },
  stateGrid: {
    gap: 12,
  },
  stateListContent: {
    gap: 12,
  },
  stateButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  stateButtonSelected: {
    backgroundColor: Colors.nautical.sandLight,
    borderColor: Colors.nautical.teal,
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
  },
  stateButtonTextSelected: {
    color: Colors.nautical.teal,
    fontWeight: '700' as const,
  },
  stateButtonCode: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.light.mediumGray,
  },
  eventsSection: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  eventsListContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  eventCard: {
    width: 280,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light.softGray,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  eventGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  eventLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  eventLivePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.terracotta,
  },
  eventLiveText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  vendorsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  vendorCount: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  vendorListContent: {
    gap: 12,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  vendorInfo: {
    flex: 1,
    gap: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
  },
  vendorSpecialty: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.muted,
  },
  vendorLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorLocationText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.nautical.teal,
  },
});
