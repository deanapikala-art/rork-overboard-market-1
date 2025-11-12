import { router, Stack } from 'expo-router';
import {
  ArrowLeft,
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';
import { useOrders } from '@/app/contexts/OrdersContext';
import { useResponsive } from '@/app/hooks/useResponsive';

type FilterType = 'all' | 'awaiting_vendor_confirmation' | 'completed' | 'cancelled';

export default function PastPurchasesScreen() {
  const { customerOrders, isLoading, refreshCustomerOrders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isTablet, isDesktop } = useResponsive();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomerOrders();
    setIsRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    let filtered = customerOrders;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.vendor_name.toLowerCase().includes(query) ||
        order.items.some(item => item.productName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [customerOrders, activeFilter, searchQuery]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'awaiting_vendor_confirmation':
        return {
          label: 'Pending',
          color: Colors.nautical.mustard,
          icon: Clock,
          bgColor: 'rgba(252, 211, 77, 0.15)',
        };
      case 'completed':
        return {
          label: 'Completed',
          color: '#22C55E',
          icon: CheckCircle2,
          bgColor: 'rgba(34, 197, 94, 0.15)',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: Colors.light.muted,
          icon: XCircle,
          bgColor: 'rgba(153, 153, 153, 0.15)',
        };
      default:
        return {
          label: status,
          color: Colors.light.muted,
          icon: Package,
          bgColor: 'rgba(153, 153, 153, 0.15)',
        };
    }
  };

  const getShippingStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Not Shipped', color: Colors.light.muted, icon: Clock };
      case 'shipped':
      case 'in_transit':
        return { label: 'In Transit', color: Colors.nautical.teal, icon: Truck };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', color: Colors.nautical.mustard, icon: Truck };
      case 'delivered':
        return { label: 'Delivered', color: '#22C55E', icon: CheckCircle2 };
      case 'pickup_ready':
        return { label: 'Ready for Pickup', color: Colors.nautical.mustard, icon: Package };
      case 'picked_up':
        return { label: 'Picked Up', color: '#22C55E', icon: CheckCircle2 };
      default:
        return { label: 'Pending', color: Colors.light.muted, icon: Clock };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const contentMaxWidth = isDesktop ? 1200 : '100%';
  const orderCardColumns = isDesktop ? 2 : isTablet ? 2 : 1;
  const orderCardWidth = isDesktop || isTablet 
    ? `${(100 / orderCardColumns) - 2}%` 
    : '100%';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Past Purchases',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -8 }}>
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors.nautical.oceanDeep,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 20,
          },
        }}
      />

      <View style={[styles.contentContainer, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color={Colors.light.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders, vendors, products..."
              placeholderTextColor={Colors.light.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={20} 
              color={Colors.nautical.teal} 
              style={[isRefreshing && styles.rotating]} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'awaiting_vendor_confirmation' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('awaiting_vendor_confirmation')}
          >
            <Clock size={16} color={activeFilter === 'awaiting_vendor_confirmation' ? Colors.white : Colors.light.charcoal} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'awaiting_vendor_confirmation' && styles.filterChipTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'completed' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('completed')}
          >
            <CheckCircle2 size={16} color={activeFilter === 'completed' ? Colors.white : Colors.light.charcoal} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'completed' && styles.filterChipTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'cancelled' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('cancelled')}
          >
            <XCircle size={16} color={activeFilter === 'cancelled' ? Colors.white : Colors.light.charcoal} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'cancelled' && styles.filterChipTextActive,
              ]}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.nautical.teal} />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <ShoppingBag size={64} color={Colors.light.muted} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery.trim() 
                ? "We couldn't find any orders matching your search."
                : activeFilter === 'all'
                  ? "You haven't placed any orders yet. Start shopping to see your order history here."
                  : `You don't have any ${activeFilter.replace('_', ' ')} orders.`
              }
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <ShoppingBag size={20} color={Colors.white} />
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.ordersScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.ordersContainer,
              (isDesktop || isTablet) && styles.ordersContainerGrid
            ]}
          >
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const shippingConfig = getShippingStatusConfig(order.shipping_status);
              const StatusIcon = statusConfig.icon;
              const ShippingIcon = shippingConfig.icon;

              return (
                <TouchableOpacity
                  key={order.id}
                  style={[
                    styles.orderCard,
                    { width: orderCardWidth }
                  ]}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <Text style={styles.orderNumber}>{order.order_number}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                      <StatusIcon size={14} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderVendor}>
                    <Package size={16} color={Colors.nautical.teal} />
                    <Text style={styles.vendorName} numberOfLines={1}>
                      {order.vendor_name}
                    </Text>
                  </View>

                  <View style={styles.orderItems}>
                    {order.items.slice(0, 2).map((item, index) => (
                      <View key={`${item.productId}-${index}`} style={styles.orderItemRow}>
                        <Image
                          source={{ uri: item.productImage }}
                          style={styles.itemImage}
                          contentFit="cover"
                        />
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.productName}
                          </Text>
                          <Text style={styles.itemDetails}>
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {order.items.length > 2 && (
                      <Text style={styles.moreItems}>
                        +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>

                  <View style={styles.orderFooter}>
                    <View style={styles.orderTotal}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                    </View>
                    
                    {order.status === 'completed' && order.shipping_status && (
                      <View style={styles.shippingBadge}>
                        <ShippingIcon size={14} color={shippingConfig.color} />
                        <Text style={[styles.shippingText, { color: shippingConfig.color }]}>
                          {shippingConfig.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <ChevronRight size={18} color={Colors.nautical.teal} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.oceanDeep,
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    height: '100%',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotating: {
    transform: [{ rotate: '180deg' }],
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.sunsetCoral,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  ordersScroll: {
    flex: 1,
  },
  ordersContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  ordersContainerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  orderVendor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    flex: 1,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  moreItems: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.nautical.teal,
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: 12,
  },
  orderTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.light.muted,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  shippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  shippingText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
});
