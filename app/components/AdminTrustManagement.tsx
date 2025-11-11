import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Shield, TrendingUp, AlertCircle, CheckCircle, Search } from 'lucide-react-native';

interface VendorTrustData {
  id: string;
  shopName: string;
  trustScore: number;
  trustTier: string;
  verifiedVendor: boolean;
  ordersFulfilled: number;
  disputesCount: number;
  warningsCount: number;
  trustRecoveryActive: boolean;
  lastUpdate: string;
}

export default function AdminTrustManagement() {
  const [vendors, setVendors] = useState<VendorTrustData[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<VendorTrustData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [showRecoveryOnly, setShowRecoveryOnly] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterTier, showRecoveryOnly, vendors]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, shop_name, trust_score, trust_tier, verified_vendor, orders_fulfilled, disputes_count, warnings_count, trust_recovery_active, last_trust_score_update')
        .order('trust_score', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedData: VendorTrustData[] = data.map((v) => ({
          id: v.id,
          shopName: v.shop_name || 'Unknown',
          trustScore: v.trust_score || 70,
          trustTier: v.trust_tier || 'New or Improving',
          verifiedVendor: v.verified_vendor || false,
          ordersFulfilled: v.orders_fulfilled || 0,
          disputesCount: v.disputes_count || 0,
          warningsCount: v.warnings_count || 0,
          trustRecoveryActive: v.trust_recovery_active || false,
          lastUpdate: v.last_trust_score_update || new Date().toISOString(),
        }));
        setVendors(mappedData);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to load vendor trust data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vendors];

    if (searchQuery) {
      filtered = filtered.filter((v) =>
        v.shopName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterTier) {
      filtered = filtered.filter((v) => v.trustTier === filterTier);
    }

    if (showRecoveryOnly) {
      filtered = filtered.filter((v) => v.trustRecoveryActive);
    }

    setFilteredVendors(filtered);
  };

  const recalculateScore = async (vendorId: string) => {
    try {
      const { error } = await supabase.rpc('update_vendor_trust_score', {
        vendor_uuid: vendorId,
      });

      if (error) throw error;

      Alert.alert('Success', 'Trust score recalculated');
      await fetchVendors();
    } catch (error) {
      console.error('Error recalculating score:', error);
      Alert.alert('Error', 'Failed to recalculate trust score');
    }
  };

  const toggleVerification = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ verified_vendor: !currentStatus })
        .eq('id', vendorId);

      if (error) throw error;

      await supabase.from('trust_admin_actions').insert({
        vendor_id: vendorId,
        action_type: currentStatus ? 'verification_revoked' : 'verification_granted',
        notes: `Admin ${currentStatus ? 'revoked' : 'granted'} verification`,
      });

      Alert.alert('Success', `Vendor ${currentStatus ? 'unverified' : 'verified'}`);
      await fetchVendors();
    } catch (error) {
      console.error('Error toggling verification:', error);
      Alert.alert('Error', 'Failed to update verification status');
    }
  };

  const addWarning = async (vendorId: string) => {
    Alert.alert(
      'Add Warning',
      'This will increase the vendor warning count and may affect their trust score.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const vendor = vendors.find((v) => v.id === vendorId);
              if (!vendor) return;

              const { error } = await supabase
                .from('vendor_profiles')
                .update({ warnings_count: vendor.warningsCount + 1 })
                .eq('id', vendorId);

              if (error) throw error;

              await supabase.from('trust_admin_actions').insert({
                vendor_id: vendorId,
                action_type: 'warning_added',
                notes: 'Admin added warning',
              });

              await recalculateScore(vendorId);
            } catch (error) {
              console.error('Error adding warning:', error);
              Alert.alert('Error', 'Failed to add warning');
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Trusted Vendor':
        return '#4C7D7C';
      case 'Verified & Reliable':
        return '#10B981';
      case 'New or Improving':
        return '#F59E0B';
      case 'Under Review':
        return '#EE6E56';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7D7C" />
        <Text style={styles.loadingText}>Loading vendor trust data...</Text>
      </View>
    );
  }

  const stats = {
    total: vendors.length,
    trusted: vendors.filter((v) => v.trustTier === 'Trusted Vendor').length,
    verified: vendors.filter((v) => v.verifiedVendor).length,
    inRecovery: vendors.filter((v) => v.trustRecoveryActive).length,
    underReview: vendors.filter((v) => v.trustTier === 'Under Review').length,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Shield size={32} color="#4C7D7C" />
        <Text style={styles.headerTitle}>Trust Management</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Vendors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#4C7D7C' }]}>{stats.trusted}</Text>
          <Text style={styles.statLabel}>Trusted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.inRecovery}</Text>
          <Text style={styles.statLabel}>In Recovery</Text>
        </View>
      </View>

      <View style={styles.filtersCard}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, !filterTier && styles.filterButtonActive]}
            onPress={() => setFilterTier(null)}
          >
            <Text style={[styles.filterButtonText, !filterTier && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {['Trusted Vendor', 'Verified & Reliable', 'New or Improving', 'Under Review'].map(
            (tier) => (
              <TouchableOpacity
                key={tier}
                style={[styles.filterButton, filterTier === tier && styles.filterButtonActive]}
                onPress={() => setFilterTier(tier)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterTier === tier && styles.filterButtonTextActive,
                  ]}
                >
                  {tier}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.recoveryToggle}
          onPress={() => setShowRecoveryOnly(!showRecoveryOnly)}
        >
          <View
            style={[
              styles.recoveryToggleBox,
              showRecoveryOnly && styles.recoveryToggleBoxActive,
            ]}
          >
            {showRecoveryOnly && <CheckCircle size={16} color="#4C7D7C" />}
          </View>
          <Text style={styles.recoveryToggleText}>Show Recovery Vendors Only</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vendorsContainer}>
        {filteredVendors.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No vendors found</Text>
          </View>
        ) : (
          filteredVendors.map((vendor) => (
            <View key={vendor.id} style={styles.vendorCard}>
              <View style={styles.vendorHeader}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{vendor.shopName}</Text>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: getTierColor(vendor.trustTier) },
                    ]}
                  >
                    <Text style={styles.tierBadgeText}>{vendor.trustTier}</Text>
                  </View>
                </View>
                <View style={styles.scoreDisplay}>
                  <Text style={styles.scoreValue}>{vendor.trustScore}</Text>
                  <Text style={styles.scoreLabel}>/ 100</Text>
                </View>
              </View>

              <View style={styles.vendorStats}>
                <View style={styles.vendorStat}>
                  <Text style={styles.vendorStatLabel}>Orders</Text>
                  <Text style={styles.vendorStatValue}>{vendor.ordersFulfilled}</Text>
                </View>
                <View style={styles.vendorStat}>
                  <Text style={styles.vendorStatLabel}>Disputes</Text>
                  <Text style={styles.vendorStatValue}>{vendor.disputesCount}</Text>
                </View>
                <View style={styles.vendorStat}>
                  <Text style={styles.vendorStatLabel}>Warnings</Text>
                  <Text style={styles.vendorStatValue}>{vendor.warningsCount}</Text>
                </View>
              </View>

              {vendor.verifiedVendor && (
                <View style={styles.verifiedBanner}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified Vendor</Text>
                </View>
              )}

              {vendor.trustRecoveryActive && (
                <View style={styles.recoveryBanner}>
                  <TrendingUp size={16} color="#F59E0B" />
                  <Text style={styles.recoveryText}>In Recovery Program</Text>
                </View>
              )}

              <View style={styles.vendorActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => recalculateScore(vendor.id)}
                >
                  <Text style={styles.actionButtonText}>Recalculate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    vendor.verifiedVendor && styles.actionButtonSecondary,
                  ]}
                  onPress={() => toggleVerification(vendor.id, vendor.verifiedVendor)}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      vendor.verifiedVendor && styles.actionButtonTextSecondary,
                    ]}
                  >
                    {vendor.verifiedVendor ? 'Unverify' : 'Verify'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => addWarning(vendor.id)}
                >
                  <Text style={styles.actionButtonText}>Add Warning</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#2B3440',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  filtersCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2B3440',
  },
  filterButtons: {
    marginTop: 12,
    flexDirection: 'row' as const,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#4C7D7C',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  recoveryToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 12,
    gap: 8,
  },
  recoveryToggleBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  recoveryToggleBoxActive: {
    borderColor: '#4C7D7C',
    backgroundColor: '#F0FDFA',
  },
  recoveryToggleText: {
    fontSize: 14,
    color: '#2B3440',
  },
  vendorsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center' as const,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  vendorCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  vendorHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2B3440',
    marginBottom: 6,
  },
  tierBadge: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  scoreDisplay: {
    alignItems: 'flex-end' as const,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#2B3440',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  vendorStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  vendorStat: {
    alignItems: 'center' as const,
  },
  vendorStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  vendorStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2B3440',
  },
  verifiedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    gap: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  recoveryBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 6,
  },
  recoveryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  vendorActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#4C7D7C',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  actionButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonDanger: {
    backgroundColor: '#EE6E56',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  actionButtonTextSecondary: {
    color: '#6B7280',
  },
});
