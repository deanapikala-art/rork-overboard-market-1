import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, Plus, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useShoutouts } from '@/app/contexts/ShoutoutsContext';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import PostShoutoutModal from '@/app/components/PostShoutoutModal';

const { width } = Dimensions.get('window');

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export default function ShoutoutsWallScreen() {
  const insets = useSafeAreaInsets();
  const { shoutouts, isLoading, refreshShoutouts, likeShoutout } = useShoutouts();
  const { isAuthenticated } = useCustomerAuth();
  const [showPostModal, setShowPostModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshShoutouts();
    setRefreshing(false);
  };

  const handleLike = async (shoutoutId: string) => {
    if (!isAuthenticated) {
      return;
    }
    await likeShoutout(shoutoutId);
  };

  const handleVendorPress = (vendorId: string) => {
    router.push(`/vendor/${vendorId}` as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.nautical.oceanFoam, Colors.nautical.sandLight]}
          style={styles.headerGradient}
        >
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.nautical.oceanDeep} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Customer Shoutouts</Text>
              <Text style={styles.headerSubtitle}>Share the love with our makers! 💙</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowPostModal(true)}
            >
              <Plus size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.shoutoutsGrid}>
            {shoutouts.map((shoutout) => (
              <View key={shoutout.id} style={styles.shoutoutCard}>
                <View style={styles.shoutoutHeader}>
                  <View style={styles.userInfo}>
                    {shoutout.customerAvatar ? (
                      <Image
                        source={{ uri: shoutout.customerAvatar }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <User size={20} color={Colors.nautical.teal} />
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{shoutout.customerName}</Text>
                      <Text style={styles.timestamp}>{formatTimeAgo(shoutout.createdAt)}</Text>
                    </View>
                  </View>
                </View>

                {shoutout.imageUrl && (
                  <TouchableOpacity activeOpacity={0.9}>
                    <Image
                      source={{ uri: shoutout.imageUrl }}
                      style={styles.shoutoutImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                )}

                <View style={styles.shoutoutBody}>
                  <Text style={styles.shoutoutMessage}>{shoutout.message}</Text>
                  
                  {shoutout.productName && (
                    <View style={styles.productBadge}>
                      <Text style={styles.productBadgeText}>{shoutout.productName}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.vendorTagBadge}
                    onPress={() => handleVendorPress(shoutout.vendorId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vendorTagText}>@{shoutout.vendorName}</Text>
                  </TouchableOpacity>

                  <View style={styles.shoutoutFooter}>
                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={() => handleLike(shoutout.id)}
                      activeOpacity={0.7}
                    >
                      <Heart
                        size={20}
                        color={Colors.light.terracotta}
                        fill={isAuthenticated ? Colors.light.terracotta : 'transparent'}
                      />
                      <Text style={styles.likeCount}>{shoutout.likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.commentButton} activeOpacity={0.7}>
                      <MessageCircle size={20} color={Colors.light.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footerSpace} />
        </ScrollView>

        <PostShoutoutModal
          visible={showPostModal}
          onClose={() => setShowPostModal(false)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  headerGradient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scroll: {
    flex: 1,
  },
  shoutoutsGrid: {
    padding: 16,
    gap: 16,
  },
  shoutoutCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  shoutoutHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.nautical.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.muted,
    marginTop: 2,
  },
  shoutoutImage: {
    width: width - 32,
    height: 240,
    backgroundColor: Colors.light.softGray,
  },
  shoutoutBody: {
    padding: 16,
  },
  shoutoutMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 12,
  },
  productBadge: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  productBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  vendorTagBadge: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
    shadowColor: Colors.nautical.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorTagText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  shoutoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  commentButton: {
    padding: 4,
  },
  footerSpace: {
    height: 40,
  },
});
