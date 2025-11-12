import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';

export function TopNavigation() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative' as const,
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  tabTextActive: {
    color: Colors.nautical.oceanDeep,
    fontWeight: '700' as const,
  },
  activeIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.nautical.oceanDeep,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
