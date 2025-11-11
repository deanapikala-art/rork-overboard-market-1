import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  Truck,
  Star,
  Calendar,
  BarChart3,
  RefreshCw,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAdminStats } from '@/app/contexts/AdminStatsContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function AdminAnalyticsDashboard() {
  const { stats, isLoading, refreshStats, getSalesGrowth, getTopVendorsByRevenue } = useAdminStats();

  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.nautical.teal} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <BarChart3 size={64} color={Colors.nautical.sand} />
        <Text style={styles.emptyText}>No analytics data available</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshStats}>
          <RefreshCw size={20} color={Colors.white} />
          <Text style={styles.refreshButtonText}>Load Stats</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const salesGrowth = getSalesGrowth();
  const topVendors = getTopVendorsByRevenue(5);
  const isGrowthPositive = salesGrowth.growth >= 0;

  const renderRopeDivider = () => (
    <View style={styles.ropeDivider}>
      <View style={styles.ropeSegment} />
      <View style={styles.ropeSegment} />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform Analytics</Text>
        <TouchableOpacity 
          style={styles.refreshIconButton} 
          onPress={refreshStats}
          activeOpacity={0.7}
        >
          <RefreshCw size={20} color={Colors.nautical.teal} />
        </TouchableOpacity>
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {new Date(stats.updated_at).toLocaleString()}
      </Text>

      <Text style={styles.sectionTitle}>Revenue Overview</Text>
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.nautical.teal }]}>
          <DollarSign size={28} color={Colors.white} />
          <Text style={styles.summaryValue}>${stats.total_revenue.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: Colors.nautical.oceanDeep }]}>
          <Package size={28} color={Colors.white} />
          <Text style={styles.summaryValue}>{stats.total_orders.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Orders</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: Colors.nautical.driftwood }]}>
          <ShoppingBag size={28} color={Colors.white} />
          <Text style={styles.summaryValue}>${stats.avg_order_value.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Avg Order Value</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: Colors.light.terracotta }]}>
          {isGrowthPositive ? (
            <TrendingUp size={28} color={Colors.white} />
          ) : (
            <TrendingDown size={28} color={Colors.white} />
          )}
          <Text style={styles.summaryValue}>
            {isGrowthPositive ? '+' : ''}{salesGrowth.growth.toFixed(1)}%
          </Text>
          <Text style={styles.summaryLabel}>7-Day Growth</Text>
        </View>
      </View>

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Platform Activity</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconCircle}>
            <Users size={24} color={Colors.nautical.teal} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.active_vendors}</Text>
            <Text style={styles.statLabel}>Active Vendors</Text>
            <Text style={styles.statSubtext}>Last 30 days</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconCircle}>
            <ShoppingBag size={24} color={Colors.nautical.teal} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.active_shoppers}</Text>
            <Text style={styles.statLabel}>Active Shoppers</Text>
            <Text style={styles.statSubtext}>Last 30 days</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconCircle}>
            <Truck size={24} color={Colors.nautical.teal} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.fulfillment_rate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Fulfillment Rate</Text>
            <Text style={styles.statSubtext}>Delivered orders</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconCircle}>
            <Calendar size={24} color={Colors.nautical.teal} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stats.avg_delivery_time.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Delivery</Text>
            <Text style={styles.statSubtext}>Days</Text>
          </View>
        </View>
      </View>

      {renderRopeDivider()}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Vendors by Revenue</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {topVendors.length > 0 ? (
        topVendors.map((vendor, index) => (
          <View key={vendor.vendorId} style={styles.vendorCard}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{vendor.vendorName}</Text>
              <Text style={styles.vendorStats}>
                {vendor.orderCount} orders • ${vendor.revenue.toLocaleString()} revenue
              </Text>
            </View>
            <View style={styles.vendorBadge}>
              <Star size={16} color={Colors.nautical.mustard} fill={Colors.nautical.mustard} />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyVendors}>
          <Text style={styles.emptyVendorsText}>No vendor data available</Text>
        </View>
      )}

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Sales by Category</Text>
      {stats.sales_by_category && stats.sales_by_category.length > 0 ? (
        stats.sales_by_category.slice(0, 5).map((category) => (
          <View key={category.category} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <Text style={styles.categoryValue}>${category.revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(category.percentage, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.categoryPercentage}>
              {category.percentage.toFixed(1)}% of total sales
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCategories}>
          <Text style={styles.emptyCategoriesText}>No category data available</Text>
        </View>
      )}

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Customer Satisfaction</Text>
      <View style={styles.satisfactionCard}>
        <View style={styles.satisfactionIconContainer}>
          <Star size={40} color={Colors.nautical.mustard} fill={Colors.nautical.mustard} />
        </View>
        <View style={styles.satisfactionContent}>
          <Text style={styles.satisfactionRating}>
            {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.satisfactionLabel}>Average Rating</Text>
          <Text style={styles.satisfactionReviews}>
            Based on {stats.total_reviews || 0} reviews
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.nautical.driftwood,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  refreshIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.nautical.sandLight,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 8,
  },
  summaryCard: {
    width: cardWidth,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
    opacity: 0.9,
  },
  ropeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  ropeSegment: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.nautical.driftwood,
    opacity: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    gap: 12,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.nautical.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.nautical.sand,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  vendorStats: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
  },
  vendorBadge: {
    padding: 8,
  },
  emptyVendors: {
    padding: 24,
    alignItems: 'center',
  },
  emptyVendorsText: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.nautical.teal,
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
  },
  emptyCategories: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
  },
  satisfactionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    gap: 20,
  },
  satisfactionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.nautical.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satisfactionContent: {
    flex: 1,
  },
  satisfactionRating: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  satisfactionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    marginBottom: 4,
  },
  satisfactionReviews: {
    fontSize: 13,
    color: Colors.nautical.sand,
  },
});
