import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Store, ShoppingCart, Users, Calendar } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Colors from '@/app/constants/colors';
import { useCart } from '@/app/contexts/CartContext';

export default function TabLayout() {
  const cart = useCart();
  const cartItemCount = (cart && cart.isLoaded) ? cart.getCartItemCount() : 0;

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
            fontSize: 11,
            fontWeight: '600' as const,
          },
          tabBarInactiveTintColor: Colors.light.driftwoodGray,
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'Overboard Market',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          tabBarIcon: ({ color }) => <Store size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View style={styles.cartIconContainer}>
              <ShoppingCart size={24} color={color} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
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
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
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
});
