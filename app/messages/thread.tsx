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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Send, Image as ImageIcon, AlertCircle, Bot } from 'lucide-react-native';
import { useMessagingCenter, Message } from '../contexts/MessagingCenterContext';

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeConversation,
    messages,
    typingUsers,
    isLoading,
    isSending,
    error,
    openConversation,
    sendMessage,
    sendTypingIndicator,
    getCurrentUserID,
    pickImage
  } = useMessagingCenter();

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserID = getCurrentUserID();

  useEffect(() => {
    if (id) {
      openConversation(id);
    }
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleTextChange = (text: string) => {
    setMessageText(text);

    if (activeConversation && text.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeConversation.conversationID, true);
    } else if (text.length === 0 && isTyping && activeConversation) {
      setIsTyping(false);
      sendTypingIndicator(activeConversation.conversationID, false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (activeConversation && isTyping) {
        setIsTyping(false);
        sendTypingIndicator(activeConversation.conversationID, false);
      }
    }, 3000);
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation || isSending) return;

    const textToSend = messageText.trim();
    setMessageText('');

    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeConversation.conversationID, false);
    }

    try {
      await sendMessage(activeConversation.conversationID, textToSend);
    } catch (err) {
      console.error('[MessageThread] Error sending message:', err);
    }
  };

  const handleAttachImage = async () => {
    const attachment = await pickImage();
    if (attachment && activeConversation) {
      await sendMessage(activeConversation.conversationID, '📎 Image', [attachment]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderID === currentUserID;
    const isAutoReply = item.systemType === 'status' && item.body.includes('Auto-reply') === false && item.senderRole === 'vendor';
    const isSystemNote = item.systemType === 'note';
    const isSystemStatus = item.systemType === 'status' && !isAutoReply;

    if (isSystemNote && item.senderRole !== 'admin') {
      return null;
    }

    if (isSystemStatus) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.body}</Text>
          </View>
        </View>
      );
    }

    if (isAutoReply) {
      return (
        <View style={styles.autoReplyContainer}>
          <View style={styles.autoReplyBubble}>
            <View style={styles.autoReplyHeader}>
              <Bot size={14} color="#8E8E93" />
              <Text style={styles.autoReplyLabel}>Auto-Reply</Text>
            </View>
            <Text style={styles.autoReplyText}>{item.body}</Text>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
        <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
          {!isOwn && item.senderName && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.body}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isOwn && item.readBy && item.readBy.length > 1 && (
              <Text style={styles.readReceipt}>✓✓</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.map((u: { name: string }) => u.name).join(', ');

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>{names} typing...</Text>
        </View>
      </View>
    );
  };

  if (isLoading && !activeConversation) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !activeConversation) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Failed to Load Conversation</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => id && openConversation(id)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const otherParticipants = activeConversation?.participants.filter(
    (p: { userID: string }) => p.userID !== currentUserID
  );
  const conversationTitle = otherParticipants?.map((p: { name?: string }) => p.name || 'User').join(', ') || 'Conversation';

  return (
    <>
      <Stack.Screen
        options={{
          title: conversationTitle,
          headerStyle: { backgroundColor: '#F2F2F7' },
          headerTitleStyle: { fontWeight: '600', fontSize: 17 }
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.messageID}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderTypingIndicator}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleAttachImage}
            >
              <ImageIcon size={24} color="#007AFF" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!messageText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send
                  size={20}
                  color="#FFFFFF"
                  fill={messageText.trim() ? '#007AFF' : 'transparent'}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  keyboardView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8
  },
  errorText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 12
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  ownMessageContainer: {
    alignItems: 'flex-end'
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#E5E5EA'
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF'
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22
  },
  ownMessageText: {
    color: '#FFFFFF'
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93'
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  readReceipt: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)'
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8
  },
  systemMessage: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12
  },
  systemMessageText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center'
  },
  autoReplyContainer: {
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  autoReplyBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F9F9FB',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed'
  },
  autoReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  autoReplyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  autoReplyText: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 21,
    fontStyle: 'italic'
  },
  typingContainer: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#E5E5EA'
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E93'
  },
  typingDot1: {
    opacity: 0.4
  },
  typingDot2: {
    opacity: 0.6
  },
  typingDot3: {
    opacity: 0.8
  },
  typingText: {
    fontSize: 13,
    color: '#8E8E93'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA'
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    marginBottom: 4
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    lineHeight: 20
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#007AFF',
    marginBottom: 4
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC'
  }
});
