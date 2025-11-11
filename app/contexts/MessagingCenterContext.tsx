import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';


export type ConversationType = 'Order' | 'Support' | 'General';
export type UserRole = 'customer' | 'vendor' | 'admin';
export type SystemType = 'status' | 'note' | null;

export type Participant = {
  userID: string;
  role: UserRole;
  name?: string;
  avatar?: string;
};

export type Attachment = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type Conversation = {
  conversationID: string;
  type: ConversationType;
  orderID?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  isArchivedBy: string[];
  unreadCount?: number;
};

export type Message = {
  messageID: string;
  conversationID: string;
  senderID: string;
  senderRole: UserRole;
  body: string;
  attachments: Attachment[];
  createdAt: string;
  editedAt?: string;
  systemType?: SystemType;
  readBy?: string[];
  senderName?: string;
  senderAvatar?: string;
};

export type CannedReply = {
  id: string;
  vendorID: string;
  title: string;
  body: string;
  category: 'shipping' | 'policies' | 'thanks' | 'custom';
};

export type TypingUser = {
  userID: string;
  name: string;
};

type MessagingCenterContextValue = {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingUser[];
  cannedReplies: CannedReply[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  loadConversations: (filter?: 'all' | 'unread' | 'orders' | 'support' | 'archived') => Promise<void>;
  searchConversations: (query: string) => Promise<Conversation[]>;
  openConversation: (conversationID: string) => Promise<void>;
  createOrOpenConversation: (params: {
    type: ConversationType;
    orderID?: string;
    participants: Participant[];
  }) => Promise<string>;
  sendMessage: (conversationID: string, body: string, attachments?: Attachment[], systemType?: SystemType) => Promise<void>;
  sendTypingIndicator: (conversationID: string, isTyping: boolean) => Promise<void>;
  markAsRead: (messageID: string) => Promise<void>;
  archiveConversation: (conversationID: string) => Promise<void>;
  unarchiveConversation: (conversationID: string) => Promise<void>;
  pickImage: () => Promise<Attachment | null>;
  pickDocument: () => Promise<Attachment | null>;
  loadCannedReplies: (vendorID: string) => Promise<void>;
  useCannedReply: (reply: CannedReply) => string;
  reportConversation: (conversationID: string, reason: string) => Promise<void>;
  getCurrentUserID: () => string | null;
  getCurrentUserRole: () => UserRole | null;
};

export const [MessagingCenterProvider, useMessagingCenter] = createContextHook<MessagingCenterContextValue>(() => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserID(session.user.id);
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setCurrentUserRole(profile.role as UserRole);
        }
      }
    } catch (err) {
      console.error('[MessagingCenter] Error initializing user:', err);
    }
  };

  const getCurrentUserID = useCallback(() => currentUserID, [currentUserID]);
  const getCurrentUserRole = useCallback(() => currentUserRole, [currentUserRole]);

  useEffect(() => {
    if (activeConversation) {
      const unsubMessages = subscribeToMessages(activeConversation.conversationID);
      const unsubTyping = subscribeToTypingIndicators(activeConversation.conversationID);
      return () => {
        unsubMessages();
        unsubTyping();
      };
    }
  }, [activeConversation?.conversationID]);

  const subscribeToMessages = (conversationID: string) => {
    console.log('[MessagingCenter] Subscribing to messages for:', conversationID);
    
    const subscription = supabase
      .channel(`messages:${conversationID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationID}`
        },
        (payload) => {
          console.log('[MessagingCenter] New message received:', payload.new);
          const newMessage = mapDBMessageToMessage(payload.new);
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToTypingIndicators = (conversationID: string) => {
    const subscription = supabase
      .channel(`typing:${conversationID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationID}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const indicator = payload.new as any;
            if (indicator.is_typing && indicator.user_id !== currentUserID) {
              const userName = await getUserName(indicator.user_id);
              setTypingUsers(prev => {
                const exists = prev.find(u => u.userID === indicator.user_id);
                if (exists) return prev;
                return [...prev, { userID: indicator.user_id, name: userName }];
              });
            } else {
              setTypingUsers(prev => prev.filter(u => u.userID !== indicator.user_id));
            }
          } else if (payload.eventType === 'DELETE') {
            const indicator = payload.old as any;
            setTypingUsers(prev => prev.filter(u => u.userID !== indicator.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getUserName = async (userID: string): Promise<string> => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', userID)
        .single();
      
      if (customer) return customer.name;

      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('business_name')
        .eq('id', userID)
        .single();
      
      if (vendor) return vendor.business_name;

      return 'User';
    } catch {
      return 'User';
    }
  };

  const loadConversations = useCallback(async (filter: 'all' | 'unread' | 'orders' | 'support' | 'archived' = 'all') => {
    if (!currentUserID) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('[MessagingCenter] Loading conversations with filter:', filter);
      
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (filter === 'archived') {
        query = query.contains('is_archived_by', [currentUserID]);
      } else {
        query = query.not('is_archived_by', 'cs', `{${currentUserID}}`);
      }

      if (filter === 'orders') {
        query = query.eq('type', 'Order');
      } else if (filter === 'support') {
        query = query.eq('type', 'Support');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const conversationsData: Conversation[] = data.map(mapDBConversationToConversation);

      if (filter === 'unread') {
        const unreadConversations = await Promise.all(
          conversationsData.map(async (conv) => {
            const unreadCount = await getUnreadCount(conv.conversationID);
            return { ...conv, unreadCount };
          })
        );
        setConversations(unreadConversations.filter(c => c.unreadCount && c.unreadCount > 0));
      } else {
        const withUnread = await Promise.all(
          conversationsData.map(async (conv) => {
            const unreadCount = await getUnreadCount(conv.conversationID);
            return { ...conv, unreadCount };
          })
        );
        setConversations(withUnread);
      }
    } catch (err: any) {
      console.error('[MessagingCenter] Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserID]);

  const getUnreadCount = async (conversationID: string): Promise<number> => {
    if (!currentUserID) return 0;

    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('message_id')
        .eq('conversation_id', conversationID)
        .neq('sender_id', currentUserID);

      if (!messagesData) return 0;

      const messageIDs = messagesData.map(m => m.message_id);
      
      const { data: receipts } = await supabase
        .from('read_receipts')
        .select('message_id')
        .eq('user_id', currentUserID)
        .in('message_id', messageIDs);

      const readMessageIDs = new Set(receipts?.map(r => r.message_id) || []);
      return messageIDs.filter(id => !readMessageIDs.has(id)).length;
    } catch {
      return 0;
    }
  };

  const searchConversations = useCallback(async (query: string): Promise<Conversation[]> => {
    if (!currentUserID || !query.trim()) return conversations;

    try {
      const lowerQuery = query.toLowerCase();
      
      const filtered = conversations.filter(conv => {
        const participantNames = conv.participants
          .map(p => p.name?.toLowerCase() || '')
          .join(' ');
        
        const preview = conv.lastMessagePreview?.toLowerCase() || '';
        const orderMatch = conv.orderID?.toLowerCase().includes(lowerQuery);
        
        return participantNames.includes(lowerQuery) || preview.includes(lowerQuery) || orderMatch;
      });

      return filtered;
    } catch (err) {
      console.error('[MessagingCenter] Error searching:', err);
      return conversations;
    }
  }, [conversations, currentUserID]);

  const openConversation = useCallback(async (conversationID: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[MessagingCenter] Opening conversation:', conversationID);
      
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('conversation_id', conversationID)
        .single();

      if (convError) throw convError;

      const conversation = mapDBConversationToConversation(convData);
      setActiveConversation(conversation);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationID)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const loadedMessages = await Promise.all(
        messagesData.map(async (msg) => {
          const readBy = await getReadByUsers(msg.message_id);
          const senderInfo = await getUserInfo(msg.sender_id);
          return {
            ...mapDBMessageToMessage(msg),
            readBy,
            senderName: senderInfo.name,
            senderAvatar: senderInfo.avatar
          };
        })
      );

      setMessages(loadedMessages);

      loadedMessages.forEach(msg => {
        if (msg.senderID !== currentUserID) {
          markAsRead(msg.messageID);
        }
      });
    } catch (err: any) {
      console.error('[MessagingCenter] Error opening conversation:', err);
      setError(err.message || 'Failed to open conversation');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserID]);

  const createOrOpenConversation = useCallback(async (params: {
    type: ConversationType;
    orderID?: string;
    participants: Participant[];
  }): Promise<string> => {
    try {
      console.log('[MessagingCenter] Creating or opening conversation:', params);

      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', params.type)
        .eq('order_id', params.orderID || null)
        .single();

      if (existing && !searchError) {
        console.log('[MessagingCenter] Found existing conversation:', existing.conversation_id);
        return existing.conversation_id;
      }

      const conversationID = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error: insertError } = await supabase
        .from('conversations')
        .insert({
          conversation_id: conversationID,
          type: params.type,
          order_id: params.orderID || null,
          participants: params.participants,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      console.log('[MessagingCenter] Created new conversation:', conversationID);
      return conversationID;
    } catch (err: any) {
      console.error('[MessagingCenter] Error creating conversation:', err);
      throw new Error(err.message || 'Failed to create conversation');
    }
  }, []);

  const sendMessage = useCallback(async (
    conversationID: string,
    body: string,
    attachments: Attachment[] = [],
    systemType?: SystemType
  ) => {
    if (!currentUserID || !currentUserRole) {
      setError('User not authenticated');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const messageID = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          message_id: messageID,
          conversation_id: conversationID,
          sender_id: currentUserID,
          sender_role: currentUserRole,
          body,
          attachments: attachments || [],
          system_type: systemType || null,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      console.log('[MessagingCenter] Message sent:', messageID);
    } catch (err: any) {
      console.error('[MessagingCenter] Error sending message:', err);
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [currentUserID, currentUserRole]);

  const sendTypingIndicator = useCallback(async (conversationID: string, isTyping: boolean) => {
    if (!currentUserID) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationID,
          user_id: currentUserID,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'conversation_id,user_id'
        });
    } catch (err) {
      console.error('[MessagingCenter] Error updating typing indicator:', err);
    }
  }, [currentUserID]);

  const markAsRead = useCallback(async (messageID: string) => {
    if (!currentUserID) return;

    try {
      await supabase
        .from('read_receipts')
        .upsert({
          message_id: messageID,
          user_id: currentUserID,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'message_id,user_id'
        });
    } catch (err) {
      console.error('[MessagingCenter] Error marking as read:', err);
    }
  }, [currentUserID]);

  const archiveConversation = useCallback(async (conversationID: string) => {
    if (!currentUserID) return;

    try {
      const conversation = conversations.find(c => c.conversationID === conversationID);
      if (!conversation) return;

      const updatedArchived = [...conversation.isArchivedBy, currentUserID];

      await supabase
        .from('conversations')
        .update({ is_archived_by: updatedArchived })
        .eq('conversation_id', conversationID);

      setConversations(prev => prev.filter(c => c.conversationID !== conversationID));
    } catch (err) {
      console.error('[MessagingCenter] Error archiving conversation:', err);
    }
  }, [currentUserID, conversations]);

  const unarchiveConversation = useCallback(async (conversationID: string) => {
    if (!currentUserID) return;

    try {
      const { data } = await supabase
        .from('conversations')
        .select('is_archived_by')
        .eq('conversation_id', conversationID)
        .single();

      if (data) {
        const updatedArchived = (data.is_archived_by as string[]).filter(id => id !== currentUserID);

        await supabase
          .from('conversations')
          .update({ is_archived_by: updatedArchived })
          .eq('conversation_id', conversationID);

        loadConversations();
      }
    } catch (err) {
      console.error('[MessagingCenter] Error unarchiving conversation:', err);
    }
  }, [currentUserID, loadConversations]);

  const pickImage = useCallback(async (): Promise<Attachment | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          url: asset.uri,
          filename: asset.fileName || `image-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize || 0
        };
      }

      return null;
    } catch (err) {
      console.error('[MessagingCenter] Error picking image:', err);
      setError('Failed to pick image');
      return null;
    }
  }, []);

  const pickDocument = useCallback(async (): Promise<Attachment | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          url: asset.uri,
          filename: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0
        };
      }

      return null;
    } catch (err) {
      console.error('[MessagingCenter] Error picking document:', err);
      setError('Failed to pick document');
      return null;
    }
  }, []);

  const loadCannedReplies = useCallback(async (vendorID: string) => {
    try {
      const { data, error } = await supabase
        .from('canned_replies')
        .select('*')
        .or(`vendor_id.eq.${vendorID},vendor_id.eq.DEFAULT`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCannedReplies(data.map(r => ({
        id: r.id,
        vendorID: r.vendor_id,
        title: r.title,
        body: r.body,
        category: r.category
      })));
    } catch (err) {
      console.error('[MessagingCenter] Error loading canned replies:', err);
    }
  }, []);

  const useCannedReply = useCallback((reply: CannedReply): string => {
    return reply.body;
  }, []);

  const reportConversation = useCallback(async (conversationID: string, reason: string) => {
    if (!currentUserID) return;

    try {
      await supabase
        .from('blocks_reports')
        .insert({
          conversation_id: conversationID,
          reporter_id: currentUserID,
          reason,
          created_at: new Date().toISOString(),
          action_taken: 'none'
        });

      console.log('[MessagingCenter] Conversation reported');
    } catch (err) {
      console.error('[MessagingCenter] Error reporting conversation:', err);
      setError('Failed to report conversation');
    }
  }, [currentUserID]);

  const getReadByUsers = async (messageID: string): Promise<string[]> => {
    try {
      const { data } = await supabase
        .from('read_receipts')
        .select('user_id')
        .eq('message_id', messageID);

      return data?.map(r => r.user_id) || [];
    } catch {
      return [];
    }
  };

  const getUserInfo = async (userID: string): Promise<{ name: string; avatar?: string }> => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', userID)
        .single();
      
      if (customer) return { name: customer.name };

      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('business_name, logo_url')
        .eq('id', userID)
        .single();
      
      if (vendor) return { name: vendor.business_name, avatar: vendor.logo_url };

      return { name: 'User' };
    } catch {
      return { name: 'User' };
    }
  };

  const mapDBConversationToConversation = (data: any): Conversation => ({
    conversationID: data.conversation_id,
    type: data.type,
    orderID: data.order_id,
    participants: data.participants || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastMessagePreview: data.last_message_preview,
    lastMessageAt: data.last_message_at,
    isArchivedBy: data.is_archived_by || []
  });

  const mapDBMessageToMessage = (data: any): Message => ({
    messageID: data.message_id,
    conversationID: data.conversation_id,
    senderID: data.sender_id,
    senderRole: data.sender_role,
    body: data.body,
    attachments: data.attachments || [],
    createdAt: data.created_at,
    editedAt: data.edited_at,
    systemType: data.system_type
  });

  return {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    cannedReplies,
    isLoading,
    isSending,
    error,
    loadConversations,
    searchConversations,
    openConversation,
    createOrOpenConversation,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    archiveConversation,
    unarchiveConversation,
    pickImage,
    pickDocument,
    loadCannedReplies,
    useCannedReply,
    reportConversation,
    getCurrentUserID,
    getCurrentUserRole
  };
});
