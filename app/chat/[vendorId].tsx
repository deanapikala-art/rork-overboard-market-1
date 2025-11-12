import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMessaging, Message } from '@/app/contexts/MessagingContext';
import { useCustomerAuth } from '@/app/contexts/CustomerAuthContext';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';
import { useSafetyFilters } from '@/app/contexts/SafetyFiltersContext';
import SafetyWarningModal from '@/app/components/SafetyWarningModal';
import Colors from '@/app/constants/colors';
import { vendors } from '@/mocks/vendors';

export default function ChatScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const [messageText, setMessageText] = useState('');
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([]);
  const [warningAction, setWarningAction] = useState<(() => void) | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const { getOrCreateConversation, sendMessage, getConversationMessages, markConversationAsRead } =
    useMessaging();
  const { profile: customerProfile } = useCustomerAuth();
  const { profile: vendorProfile } = useVendorAuth();
  const { checkMessage, flagMessage } = useSafetyFilters();

  const vendor = vendors.find(v => v.id === vendorId);
  
  const isVendorView = vendorProfile && vendorProfile.id === vendorId;
  const currentUserId = isVendorView ? vendorProfile.id : customerProfile?.id || 'guest';
  const currentUserName = isVendorView ? vendorProfile.business_name : customerProfile?.name || 'Guest';
  const currentUserType = isVendorView ? 'vendor' : 'customer';

  const [conversation, setConversation] = useState<ReturnType<typeof getOrCreateConversation> | null>(null);
  const messages = conversation ? getConversationMessages(conversation.id) : [];

  useEffect(() => {
    const conv = getOrCreateConversation(
      vendorId || '',
      vendor?.name || 'Vendor',
      customerProfile?.id || 'guest',
      customerProfile?.name || 'Guest'
    );
    setConversation(conv);
  }, [vendorId, vendor?.name, customerProfile?.id, customerProfile?.name, getOrCreateConversation]);

  useEffect(() => {
    if (conversation?.id) {
      markConversationAsRead(conversation.id);
    }
  }, [conversation?.id, markConversationAsRead]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSendMessage = () => {
    if (messageText.trim() && conversation?.id) {
      const safetyCheck = checkMessage(messageText.trim());
      
      if (safetyCheck.shouldBlock) {
        setSafetyWarnings([
          '🚫 This message contains content that violates our safety policies and cannot be sent.',
          ...safetyCheck.warnings,
        ]);
        setShowSafetyWarning(true);
        setWarningAction(null);
        return;
      }
      
      if (safetyCheck.shouldWarn) {
        setSafetyWarnings(safetyCheck.warnings);
        setWarningAction(() => () => {
          sendMessageInternal(messageText.trim());
          setShowSafetyWarning(false);
        });
        setShowSafetyWarning(true);
        return;
      }
      
      if (safetyCheck.shouldFlag) {
        flagMessage(
          `msg_${Date.now()}`,
          conversation.id,
          currentUserId,
          safetyCheck
        );
      }
      
      sendMessageInternal(messageText.trim());
    }
  };
  
  const sendMessageInternal = (text: string) => {
    if (conversation?.id) {
      sendMessage(
        conversation.id,
        text,
        currentUserId,
        currentUserName,
        currentUserType
      );
      setMessageText('');
      
      setTimeout(() => {
        if (currentUserType === 'customer' && conversation?.id) {
          sendMessage(
            conversation.id,
            'Thanks for your message! I\'ll get back to you soon.',
            vendorId || '',
            vendor?.name || 'Vendor',
            'vendor'
          );
        }
      }, 1000);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && vendor && (
          <Image
            source={{ uri: vendor.avatar }}
            style={styles.messageAvatar}
            contentFit="cover"
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isOwnMessage && customerProfile && (
          <View style={styles.ownAvatarPlaceholder}>
            <Text style={styles.ownAvatarText}>
              {customerProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!vendor) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Vendor not found</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafetyWarningModal
        visible={showSafetyWarning}
        warnings={safetyWarnings}
        severity="high"
        onDismiss={() => {
          setShowSafetyWarning(false);
          if (!warningAction) {
            setMessageText('');
          }
        }}
        onProceed={warningAction || undefined}
        showProceedButton={!!warningAction}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Image
              source={{ uri: vendor.avatar }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{vendor.name}</Text>
              <Text style={styles.headerSubtitle}>{vendor.specialty}</Text>
            </View>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>Start a conversation</Text>
              <Text style={styles.emptyStateText}>
                Send a message to {vendor.name} about their products
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          )}

          <SafeAreaView edges={['bottom']} style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.light.muted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send
                size={20}
                color={messageText.trim() ? '#FFF' : Colors.light.muted}
              />
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  headerPlaceholder: {
    width: 44,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  ownAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownAvatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: Colors.nautical.teal,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: Colors.light.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.light.muted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.light.softGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.softGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: Colors.light.terracotta,
    fontWeight: '600' as const,
  },
});
