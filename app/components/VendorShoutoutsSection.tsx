import { Image } from 'expo-image';
import { Heart, MessageCircle, User, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

import Colors from '@/app/constants/colors';
import { useShoutouts } from '@/app/contexts/ShoutoutsContext';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import PostShoutoutModal from './PostShoutoutModal';

const { width } = Dimensions.get('window');

interface VendorShoutoutsSectionProps {
  vendorId: string;
  vendorName: string;
}

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

export default function VendorShoutoutsSection({ 
  vendorId, 
  vendorName 
}: VendorShoutoutsSectionProps) {
  const { getShoutoutsByVendor, likeShoutout } = useShoutouts();
  const { isAuthenticated } = useCustomerAuth();
  const [showPostModal, setShowPostModal] = useState(false);

  const vendorShoutouts = getShoutoutsByVendor(vendorId);

  const handleLike = async (shoutoutId: string) => {
    if (!isAuthenticated) {
      return;
    }
    await likeShoutout(shoutoutId);
  };

  if (vendorShoutouts.length === 0) {
    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Shoutouts</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => setShowPostModal(true)}
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No shoutouts yet! Be the first to share your experience 🎉
            </Text>
            <TouchableOpacity
              style={styles.beFirstButton}
              onPress={() => setShowPostModal(true)}
            >
              <Text style={styles.beFirstButtonText}>Post First Shoutout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <PostShoutoutModal
          visible={showPostModal}
          onClose={() => setShowPostModal(false)}
          vendorId={vendorId}
          vendorName={vendorName}
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Shoutouts ({vendorShoutouts.length})</Text>
          <TouchableOpacity
            style={styles.addButtonSmall}
            onPress={() => setShowPostModal(true)}
          >
            <Plus size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shoutoutsScroll}
        >
          {vendorShoutouts.slice(0, 5).map((shoutout) => (
            <View key={shoutout.id} style={styles.shoutoutCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userRow}>
                  {shoutout.customerAvatar ? (
                    <Image
                      source={{ uri: shoutout.customerAvatar }}
                      style={styles.miniAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.miniAvatarPlaceholder}>
                      <User size={14} color={Colors.nautical.teal} />
                    </View>
                  )}
                  <View style={styles.userMeta}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {shoutout.customerName}
                    </Text>
                    <Text style={styles.timeAgo}>{formatTimeAgo(shoutout.createdAt)}</Text>
                  </View>
                </View>
              </View>

              {shoutout.imageUrl && (
                <Image
                  source={{ uri: shoutout.imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              )}

              <View style={styles.cardBody}>
                <Text style={styles.message} numberOfLines={3}>
                  {shoutout.message}
                </Text>

                {shoutout.productName && (
                  <View style={styles.productTag}>
                    <Text style={styles.productTagText} numberOfLines={1}>
                      {shoutout.productName}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.likeBtn}
                    onPress={() => handleLike(shoutout.id)}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={16}
                      color={Colors.light.terracotta}
                      fill={isAuthenticated ? Colors.light.terracotta : 'transparent'}
                    />
                    <Text style={styles.likeText}>{shoutout.likes}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.commentBtn} activeOpacity={0.7}>
                    <MessageCircle size={16} color={Colors.light.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <PostShoutoutModal
        visible={showPostModal}
        onClose={() => setShowPostModal(false)}
        vendorId={vendorId}
        vendorName={vendorName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  addButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  shoutoutsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  shoutoutCard: {
    width: width * 0.75,
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    padding: 12,
    paddingBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  miniAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.nautical.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.light.muted,
    marginTop: 1,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.light.softGray,
  },
  cardBody: {
    padding: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    marginBottom: 8,
  },
  productTag: {
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  productTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  commentBtn: {
    padding: 2,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  beFirstButton: {
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  beFirstButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});
