import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'vendor';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  vendorId: string;
  vendorName: string;
  customerId: string;
  customerName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

const STORAGE_KEY = '@messaging_data';

export const [MessagingContext, useMessaging] = createContextHook(() => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (isMounted) {
        await loadMessagingData();
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const loadMessagingData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          
          if (data && typeof data === 'object') {
            setConversations(Array.isArray(data.conversations) ? data.conversations : []);
            
            const validMessages: Record<string, Message[]> = {};
            if (typeof data.messages === 'object' && data.messages !== null) {
              Object.keys(data.messages).forEach(convId => {
                const msgs = data.messages[convId];
                if (Array.isArray(msgs)) {
                  validMessages[convId] = msgs.filter((msg: any) => 
                    msg && 
                    typeof msg === 'object' && 
                    msg.id && 
                    msg.text && 
                    typeof msg.text === 'string'
                  );
                }
              });
            }
            setMessages(validMessages);
          } else {
            console.warn('[Messaging] Invalid messaging data format, resetting');
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } catch (parseError) {
          console.error('[Messaging] Failed to parse messaging data:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEY);
          setConversations([]);
          setMessages({});
        }
      }
    } catch (error) {
      console.error('Failed to load messaging data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessagingData = async (
    newConversations: Conversation[],
    newMessages: Record<string, Message[]>
  ) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          conversations: newConversations,
          messages: newMessages,
        })
      );
    } catch (error) {
      console.error('Failed to save messaging data:', error);
    }
  };

  const getOrCreateConversation = useCallback(
    (vendorId: string, vendorName: string, customerId: string, customerName: string) => {
      const existingConv = conversations.find(
        c => c.vendorId === vendorId && c.customerId === customerId
      );

      if (existingConv) {
        return existingConv;
      }

      const newConv: Conversation = {
        id: `${customerId}_${vendorId}`,
        vendorId,
        vendorName,
        customerId,
        customerName,
        unreadCount: 0,
      };

      const updatedConversations = [...conversations, newConv];
      setConversations(updatedConversations);
      saveMessagingData(updatedConversations, messages);

      return newConv;
    },
    [conversations, messages]
  );

  const sendMessage = useCallback(
    (
      conversationId: string,
      text: string,
      senderId: string,
      senderName: string,
      senderType: 'customer' | 'vendor'
    ) => {
      if (!text || !conversationId || !senderId || !senderName) {
        console.warn('[Messaging] Missing required parameters for sendMessage');
        return;
      }
      
      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        conversationId,
        senderId,
        senderName,
        senderType,
        text,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const conversationMessages = messages[conversationId] || [];
      const updatedMessages = {
        ...messages,
        [conversationId]: [...conversationMessages, newMessage],
      };

      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: text || '',
            lastMessageTime: newMessage.timestamp,
            unreadCount: senderType === 'vendor' ? conv.unreadCount + 1 : conv.unreadCount,
          };
        }
        return conv;
      });

      setMessages(updatedMessages);
      setConversations(updatedConversations);
      saveMessagingData(updatedConversations, updatedMessages);

      console.log(`[Messaging] Message sent in conversation ${conversationId}:`, newMessage);
    },
    [messages, conversations]
  );

  const markConversationAsRead = useCallback(
    (conversationId: string) => {
      const conversationMessages = messages[conversationId] || [];
      const updatedMessages = {
        ...messages,
        [conversationId]: conversationMessages.map(msg => ({ ...msg, read: true })),
      };

      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });

      setMessages(updatedMessages);
      setConversations(updatedConversations);
      saveMessagingData(updatedConversations, updatedMessages);
    },
    [messages, conversations]
  );

  const getConversationMessages = useCallback(
    (conversationId: string) => {
      return messages[conversationId] || [];
    },
    [messages]
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      const updatedMessages = { ...messages };
      delete updatedMessages[conversationId];

      setConversations(updatedConversations);
      setMessages(updatedMessages);
      saveMessagingData(updatedConversations, updatedMessages);
    },
    [conversations, messages]
  );

  return {
    conversations,
    messages,
    isLoading,
    getOrCreateConversation,
    sendMessage,
    markConversationAsRead,
    getConversationMessages,
    deleteConversation,
  };
});
