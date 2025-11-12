import { Stack } from 'expo-router';
import { BookOpen, ExternalLink, Info } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';
import { vendorResources, resourceCategories, VendorResource } from '@/mocks/vendorResources';
import HamburgerMenu from '@/app/components/HamburgerMenu';

type CategoryFilter = typeof resourceCategories[number];

export default function VendorResources() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  const filteredResources = selectedCategory === 'All' 
    ? vendorResources 
    : vendorResources.filter(r => r.category === selectedCategory);

  const getCategoryIcon = (category: VendorResource['category']) => {
    switch (category) {
      case 'Getting Started':
        return '🚀';
      case 'Marketing':
        return '📢';
      case 'Affiliate Tools':
        return '🛠️';
      case 'Education':
        return '📚';
      case 'Community':
        return '🤝';
      default:
        return '📄';
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <HamburgerMenu />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerContent}>
            <BookOpen size={28} color={Colors.nautical.teal} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Vendor Resources</Text>
              <Text style={styles.headerBadge}>Beta</Text>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <Info size={16} color={Colors.nautical.teal} />
            <Text style={styles.infoText}>
              More resources coming soon as we build out the Vendor Tools library.
            </Text>
          </View>

          <View style={styles.affiliateNotice}>
            <Text style={styles.affiliateNoticeText}>
              Some resources may include affiliate links in the future. These help support the platform at no extra cost to you.
            </Text>
          </View>
        </View>

        <View style={styles.categoryBar}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {resourceCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredResources.map((resource) => (
            <View key={resource.resourceID} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <Text style={styles.categoryEmoji}>
                  {getCategoryIcon(resource.category)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceCategory}>{resource.category}</Text>
                </View>
                {resource.isAffiliate && (
                  <View style={styles.affiliateBadge}>
                    <Text style={styles.affiliateBadgeText}>Affiliate</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.resourceDescription}>{resource.description}</Text>
              
              <TouchableOpacity 
                style={styles.resourceButton}
                disabled
              >
                <ExternalLink size={16} color={Colors.light.muted} />
                <Text style={styles.resourceButtonText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
          ))}

          {filteredResources.length === 0 && (
            <View style={styles.emptyState}>
              <BookOpen size={48} color={Colors.light.muted} />
              <Text style={styles.emptyStateText}>No resources in this category yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Check back soon for new content!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    backgroundColor: Colors.nautical.sandLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.nautical.sandLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  affiliateNotice: {
    backgroundColor: Colors.light.cream,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  affiliateNoticeText: {
    fontSize: 12,
    color: Colors.light.muted,
    lineHeight: 16,
    fontStyle: 'italic' as const,
  },
  categoryBar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resourceCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 32,
    lineHeight: 32,
  },
  resourceTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  resourceCategory: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.nautical.teal,
  },
  affiliateBadge: {
    backgroundColor: Colors.light.sage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  affiliateBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  resourceDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.cream,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resourceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: 'center' as const,
  },
});
