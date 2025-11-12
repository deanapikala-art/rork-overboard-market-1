import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Store, ShoppingCart, Users, Calendar } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import Colors from '@/app/constants/colors';
import { useCart } from '@/app/contexts/CartContext';
import { useResponsive } from '@/app/hooks/useResponsive';

export default function TabLayout() {
  const cart = useCart();
  const { isTablet, isDesktop } = useResponsive();
  
  const cartItemCount = React.useMemo(() => {
    try {
      if (cart && cart.isLoaded && typeof cart.getCartItemCount === 'function') {
        const count = cart.getCartItemCount();
        return typeof count === 'number' && !isNaN(count) ? count : 0;
      }
      return 0;
    } catch (error) {
      console.warn('[TabLayout] Error getting cart item count:', error);
      return 0;
    }
  }, [cart]);

  const iconSizeValue = isTablet || isDesktop ? 26 : 24;
  const labelFontSize = isTablet || isDesktop ? 12 : 11;

  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.sunsetCoral,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.light.card,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
          tabBarLabelStyle: {
            fontSize: labelFontSize,
            fontWeight: '600' as const,
            marginBottom: Platform.OS === 'android' ? 4 : 0,
          },
          tabBarInactiveTintColor: Colors.light.driftwoodGray,
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'Overboard Market',
          tabBarIcon: ({ color }) => <Home size={iconSizeValue} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <ShoppingBag size={iconSizeValue} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          tabBarIcon: ({ color }) => <Store size={iconSizeValue} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View style={styles.cartIconContainer}>
              <ShoppingCart size={iconSizeValue} color={color} />
              {cartItemCount > 0 && (
                <View style={[styles.badge, isTablet && styles.badgeLarge]}>
                  <Text style={[styles.badgeText, isTablet && styles.badgeTextLarge]}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <Calendar size={iconSizeValue} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <Users size={iconSizeValue} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vendor-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  cartIconContainer: {
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -6,
    right: -10,
    backgroundColor: Colors.light.terracotta,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.light.card,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  badgeLarge: {
    minWidth: 22,
    height: 22,
    top: -8,
    right: -12,
    paddingHorizontal: 6,
  },
  badgeTextLarge: {
    fontSize: 11,
  },
});
