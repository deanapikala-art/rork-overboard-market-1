import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Tag, Search, Percent, Gift, ChevronRight } from 'lucide-react-native';
import { useVendorSales, VendorSale } from '@/app/contexts/VendorSalesContext';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VendorInfo {
  id: string;
  shop_name: string;
  trust_score: number;
  is_verified: boolean;
}

interface SaleWithVendor extends VendorSale {
  vendor: VendorInfo;
}

export default function CurrentSalesScreen() {
  const { fetchActiveSales } = useVendorSales();
  const [sales, setSales] = useState<SaleWithVendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'flat' | 'bogo'>('all');

  const loadActiveSales = useCallback(async () => {
    try {
      setLoading(true);
      const activeSales = await fetchActiveSales();

      const salesWithVendors = await Promise.all(
        activeSales.map(async (sale) => {
          const { data: vendor } = await supabase
            .from('vendor_profiles')
            .select('id, shop_name, trust_score, is_verified')
            .eq('id', sale.vendor_id)
            .single();

          return {
            ...sale,
            vendor: vendor || { id: sale.vendor_id, shop_name: 'Unknown', trust_score: 0, is_verified: false },
          };
        })
      );

      setSales(salesWithVendors);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchActiveSales]);

  useEffect(() => {
    loadActiveSales();
  }, [loadActiveSales]);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.vendor.shop_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || sale.discount_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getDiscountLabel = (sale: VendorSale): string => {
    if (sale.discount_type === 'percentage') {
      return `${sale.discount_value}% off`;
    } else if (sale.discount_type === 'flat') {
      return `$${sale.discount_value} off`;
    } else if (sale.discount_type === 'bogo') {
      return `Buy ${sale.buy_qty}, Get ${sale.get_qty}`;
    }
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSalePress = (sale: SaleWithVendor) => {
    router.push(`/vendor/${sale.vendor_id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Current Sales</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.tabIconDefault} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search sales or vendors..."
          placeholderTextColor={Colors.light.tabIconDefault}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              All Sales
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'percentage' && styles.filterButtonActive]}
            onPress={() => setFilterType('percentage')}
          >
            <Percent size={16} color={filterType === 'percentage' ? '#fff' : Colors.primary} />
            <Text
              style={[styles.filterButtonText, filterType === 'percentage' && styles.filterButtonTextActive]}
            >
              % Off
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'flat' && styles.filterButtonActive]}
            onPress={() => setFilterType('flat')}
          >
            <Tag size={16} color={filterType === 'flat' ? '#fff' : Colors.primary} />
            <Text style={[styles.filterButtonText, filterType === 'flat' && styles.filterButtonTextActive]}>
              $ Off
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'bogo' && styles.filterButtonActive]}
            onPress={() => setFilterType('bogo')}
          >
            <Gift size={16} color={filterType === 'bogo' ? '#fff' : Colors.primary} />
            <Text style={[styles.filterButtonText, filterType === 'bogo' && styles.filterButtonTextActive]}>
              BOGO
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : filteredSales.length === 0 ? (
          <View style={styles.emptyState}>
            <Tag size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyStateText}>No active sales</Text>
            <Text style={styles.emptyStateSubtext}>Check back soon for new promotions!</Text>
          </View>
        ) : (
          filteredSales.map((sale) => (
            <TouchableOpacity
              key={sale.id}
              style={styles.saleCard}
              onPress={() => handleSalePress(sale)}
              activeOpacity={0.7}
            >
              <View style={styles.saleCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.saleTitle}>{sale.title}</Text>
                  <View style={styles.vendorRow}>
                    <Text style={styles.vendorName}>{sale.vendor.shop_name}</Text>
                    {sale.vendor.is_verified && <Text style={styles.verifiedBadge}>✓</Text>}
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.light.tabIconDefault} />
              </View>

              {sale.description && <Text style={styles.saleDescription} numberOfLines={2}>{sale.description}</Text>}

              <View style={styles.saleDetails}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{getDiscountLabel(sale)}</Text>
                </View>
                <Text style={styles.saleType}>{sale.applies_to}</Text>
              </View>

              <Text style={styles.saleDates}>
                Ends {formatDate(sale.end_date)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    textAlign: 'center',
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#10b981',
  },
  saleDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 12,
    lineHeight: 20,
  },
  saleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  saleType: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: 'capitalize',
  },
  saleDates: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
});
