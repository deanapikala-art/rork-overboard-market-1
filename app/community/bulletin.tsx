import { router, Stack } from 'expo-router';
import { MessageSquare, Heart, Calendar, Tag, ChevronRight, ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';
import { bulletinPosts, BulletinPost, getPinnedPosts, getRecentPosts } from '@/mocks/communityBulletin';

const TYPE_COLORS = {
  sale: Colors.light.terracotta,
  giveaway: '#C25C8C',
  announcement: Colors.nautical.teal,
  update: '#81B29A',
  spotlight: '#F4B860',
  event: '#E07A5F',
};

const TYPE_LABELS = {
  sale: '🔥 Sale',
  giveaway: '🎁 Giveaway',
  announcement: '📢 Announcement',
  update: '🌟 Update',
  spotlight: '💡 Spotlight',
  event: '📅 Event',
};

export default function CommunityBulletinScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<BulletinPost['type'] | 'all'>('all');
  const pinnedPosts = getPinnedPosts();
  
  const filteredPosts = filter === 'all' 
    ? getRecentPosts() 
    : bulletinPosts.filter(post => post.type === filter);

  const handlePostPress = (post: BulletinPost) => {
    if (post.vendorId) {
      router.push(`/vendor/${post.vendorId}`);
    } else if (post.link) {
      console.log('Opening link:', post.link);
    }
  };

  const renderPost = (post: BulletinPost, isPinned: boolean = false) => (
    <TouchableOpacity
      key={post.id}
      style={[styles.postCard, isPinned && styles.pinnedCard]}
      onPress={() => handlePostPress(post)}
      activeOpacity={0.7}
    >
      {isPinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 PINNED</Text>
        </View>
      )}

      <View style={styles.postHeader}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[post.type] }]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[post.type]}</Text>
        </View>
        <Text style={styles.postDate}>{formatDate(post.date)}</Text>
      </View>

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      )}

      {post.authorAvatar && (
        <View style={styles.authorSection}>
          <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
          <Text style={styles.authorName}>{post.author}</Text>
        </View>
      )}

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      <View style={styles.postFooter}>
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Heart size={16} color={Colors.light.mediumGray} />
            <Text style={styles.statText}>{post.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <MessageSquare size={16} color={Colors.light.mediumGray} />
            <Text style={styles.statText}>{post.comments}</Text>
          </View>
        </View>

        {post.linkText && (
          <View style={styles.linkButton}>
            <Text style={styles.linkButtonText}>{post.linkText}</Text>
            <ChevronRight size={16} color={Colors.nautical.teal} />
          </View>
        )}
      </View>

      {post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Tag size={10} color={Colors.light.mediumGray} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {post.expiresDate && (
        <View style={styles.expiresContainer}>
          <Calendar size={14} color={Colors.light.terracotta} />
          <Text style={styles.expiresText}>
            Expires {formatDate(post.expiresDate)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />

      <LinearGradient
        colors={[Colors.nautical.teal, Colors.nautical.sandLight]}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.white} strokeWidth={3} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Community Bulletin Board</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with sales, giveaways, and community news
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All Posts
          </Text>
        </TouchableOpacity>

        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filter === type && styles.filterButtonActive,
              filter === type && { backgroundColor: TYPE_COLORS[type as BulletinPost['type']] },
            ]}
            onPress={() => setFilter(type as BulletinPost['type'])}
          >
            <Text style={[styles.filterButtonText, filter === type && styles.filterButtonTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filter === 'all' && pinnedPosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📌 Pinned Posts</Text>
            {pinnedPosts.map(post => renderPost(post, true))}
          </View>
        )}

        <View style={styles.section}>
          {filter !== 'all' && (
            <Text style={styles.sectionTitle}>
              {TYPE_LABELS[filter as BulletinPost['type']]}
            </Text>
          )}
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => renderPost(post, false))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No posts found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: 'relative' as const,
  },
  backButton: {
    position: 'absolute' as const,
    top: 10,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  filterScroll: {
    flexGrow: 0,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.softGray,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.nautical.teal,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.darkGray,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pinnedCard: {
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  pinnedBadge: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  postDate: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.darkGray,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 8,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.light.darkGray,
    lineHeight: 22,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.mediumGray,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.softGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.mediumGray,
  },
  expiresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  expiresText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.terracotta,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
  },
});
