import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MessageCircle, Search, Archive, Package, AlertCircle, X } from 'lucide-react-native';
import { useMessagingCenter, Conversation } from '../contexts/MessagingCenterContext';

type FilterType = 'all' | 'unread' | 'orders' | 'support' | 'archived';

export default function MessagingInboxScreen() {
  const router = useRouter();
  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    searchConversations,
    getCurrentUserRole
  } = useMessagingCenter();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const userRole = getCurrentUserRole();

  useEffect(() => {
    loadConversations(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    const results = await searchConversations(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setSearchQuery('');
  };

  const handleOpenConversation = (conversationID: string) => {
    router.push(`/messages/thread?id=${conversationID}` as any);
  };

  const displayedConversations = searchQuery.trim() ? searchResults : conversations;

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipants = item.participants.filter(
      (p: any) => p.role !== userRole
    );
    const displayName = otherParticipants.map((p: any) => p.name || 'User').join(', ');
    const hasUnread = item.unreadCount && item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, hasUnread && styles.unreadItem]}
        onPress={() => handleOpenConversation(item.conversationID)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationAvatar}>
          <MessageCircle
            size={24}
            color={hasUnread ? '#007AFF' : '#8E8E93'}
            strokeWidth={hasUnread ? 2.5 : 2}
          />
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, hasUnread && styles.unreadText]}>
              {displayName || 'Conversation'}
            </Text>
            {item.lastMessageAt && (
              <Text style={styles.timestamp}>
                {formatTimestamp(item.lastMessageAt)}
              </Text>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <View style={styles.previewRow}>
              {item.type === 'Order' && item.orderID && (
                <View style={styles.orderBadge}>
                  <Package size={12} color="#007AFF" />
                  <Text style={styles.orderBadgeText}>{item.orderID}</Text>
                </View>
              )}
              <Text
                style={[styles.messagePreview, hasUnread && styles.unreadText]}
                numberOfLines={1}
              >
                {item.lastMessagePreview || 'No messages yet'}
              </Text>
            </View>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading || isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <AlertCircle size={48} color="#FF3B30" />
          <Text style={styles.emptyTitle}>Error Loading Messages</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadConversations(activeFilter)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    let emptyMessage = 'No messages yet';
    let emptyIcon = <MessageCircle size={48} color="#C7C7CC" />;

    switch (activeFilter) {
      case 'unread':
        emptyMessage = "You're all caught up!";
        break;
      case 'orders':
        emptyMessage = 'No order conversations';
        emptyIcon = <Package size={48} color="#C7C7CC" />;
        break;
      case 'support':
        emptyMessage = 'No support conversations';
        emptyIcon = <AlertCircle size={48} color="#C7C7CC" />;
        break;
      case 'archived':
        emptyMessage = 'No archived conversations';
        emptyIcon = <Archive size={48} color="#C7C7CC" />;
        break;
    }

    return (
      <View style={styles.emptyState}>
        <View>{emptyIcon}</View>
        <Text style={styles.emptyTitle}>{emptyMessage}</Text>
        {activeFilter !== 'all' && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={styles.viewAllButtonText}>View All Messages</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerStyle: { backgroundColor: '#F2F2F7' },
          headerTitleStyle: { fontWeight: '600', fontSize: 17 }
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages, vendors, orders..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'orders', label: 'Orders' },
              { key: 'support', label: 'Support' },
              { key: 'archived', label: 'Archived' }
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === item.key && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange(item.key as FilterType)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === item.key && styles.filterButtonTextActive
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        <FlatList
          data={displayedConversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.conversationID}
          contentContainerStyle={[
            styles.listContent,
            displayedConversations.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={isLoading}
          onRefresh={() => loadConversations(activeFilter)}
        />
      </SafeAreaView>
    </>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8
  },
  filterButtonActive: {
    backgroundColor: '#007AFF'
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43'
  },
  filterButtonTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    paddingVertical: 8
  },
  emptyListContent: {
    flex: 1
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 12
  },
  unreadItem: {
    backgroundColor: '#F9F9FB'
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 6
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    marginRight: 8
  },
  unreadText: {
    fontWeight: '600'
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93'
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  previewRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF'
  },
  messagePreview: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93'
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 76
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 21
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#007AFF'
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  viewAllButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7'
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF'
  }
});
