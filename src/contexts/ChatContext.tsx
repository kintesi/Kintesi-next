import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';
import { toast } from 'sonner';

export interface ChatProductContext {
  id?: string;
  title: string;
  price?: number;
  image?: string;
  sku?: string;
}

export interface ChatOrderContext {
  orderNumber: string;
  totalAmount?: number;
  status?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'seller' | 'system';
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  productContext?: ChatProductContext;
  orderContext?: ChatOrderContext;
  read?: boolean;
}

export interface CustomerThread {
  conversationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAvatar?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  productContext?: ChatProductContext;
  orderContext?: ChatOrderContext;
}

interface ChatContextType {
  messages: ChatMessage[];
  conversations: CustomerThread[];
  currentConversationId: string;
  unreadCount: number;
  isOpen: boolean;
  activeProductContext: ChatProductContext | null;
  activeOrderContext: ChatOrderContext | null;
  openChat: (context?: { product?: ChatProductContext; order?: ChatOrderContext }) => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  sendSellerReply: (conversationId: string, text: string) => Promise<void>;
  clearChat: (conversationId?: string) => void;
  deleteConversation: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_STORAGE_KEY = 'kintesi_live_chat_master_threads';
const GUEST_ID_KEY = 'kintesi_guest_chat_client_id';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin } = useAuth();

  // Client conversation ID persistent per customer
  const [clientConversationId] = useState<string>(() => {
    if (user?.id) return user.id;
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  });

  const activeConversationId = user?.id || clientConversationId;

  // Master messages list across all conversations
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-welcome',
        conversationId: activeConversationId,
        sender: 'seller',
        senderName: 'Kintesi Support Agent',
        senderEmail: ADMIN_EMAIL,
        text: '👋 Assalamu Alaikum! Welcome to Kintesi. How can we help you today? Feel free to ask about any product, fitting, delivery or your order!',
        timestamp: new Date().toISOString(),
        read: true,
      },
    ];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeProductContext, setActiveProductContext] = useState<ChatProductContext | null>(null);
  const [activeOrderContext, setActiveOrderContext] = useState<ChatOrderContext | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Cloud Messages from Supabase Database
  const fetchCloudMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      // Fetch user profile avatars for enrichment
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, full_name');

      const profileAvatarMap = new Map<string, string>();
      if (profilesData) {
        profilesData.forEach((p: any) => {
          if (p.avatar_url) {
            if (p.id) profileAvatarMap.set(p.id, p.avatar_url);
            if (p.email) profileAvatarMap.set(p.email.toLowerCase(), p.avatar_url);
          }
        });
      }

      if (!error && data && data.length > 0) {
        const cloudMessages: ChatMessage[] = data.map((d: any) => {
          const matchedAvatar =
            d.sender_avatar ||
            (d.user_id ? profileAvatarMap.get(d.user_id) : '') ||
            (d.sender_email ? profileAvatarMap.get(d.sender_email.toLowerCase()) : '') ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(d.sender_name || 'Customer')}&background=059669&color=ffffff&bold=true`;

          return {
            id: d.id,
            conversationId: d.conversation_id || 'default_chat',
            sender: d.sender,
            senderName: d.sender_name || 'Customer',
            senderEmail: d.sender_email || '',
            senderPhone: d.sender_phone || '',
            senderAvatar: matchedAvatar,
            text: d.text,
            timestamp: d.created_at || new Date().toISOString(),
            productContext: d.product_context,
            orderContext: d.order_context,
            read: d.read ?? false,
          };
        });

        setAllMessages((prev) => {
          const combined = [...prev, ...cloudMessages];
          const map = new Map<string, ChatMessage>();
          combined.forEach((m) => {
            map.set(m.id, m);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.warn('Chat cloud sync note:', err);
    }
  }, []);

  // Supabase Real-time Cloud Subscriptions & Auto-polling
  useEffect(() => {
    fetchCloudMessages();

    // 1. WebSocket Realtime listener
    const channel = supabase
      .channel('realtime:chat_messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const d = payload.new as any;
            const newMsg: ChatMessage = {
              id: d.id,
              conversationId: d.conversation_id || 'default_chat',
              sender: d.sender,
              senderName: d.sender_name || 'Customer',
              senderEmail: d.sender_email || '',
              senderPhone: d.sender_phone || '',
              senderAvatar: d.sender_avatar || '',
              text: d.text,
              timestamp: d.created_at || new Date().toISOString(),
              productContext: d.product_context,
              orderContext: d.order_context,
              read: d.read ?? false,
            };

            setAllMessages((prev) => {
              if (prev.some((p) => p.id === newMsg.id)) return prev;
              const next = [...prev, newMsg];
              localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          } else {
            fetchCloudMessages();
          }
        }
      )
      .subscribe();

    // 2. Periodic sync fallback every 3.5 seconds
    const interval = setInterval(fetchCloudMessages, 3500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchCloudMessages]);

  // Sync unread status
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allMessages));
    } catch {}

    const myUnread = allMessages.filter(
      (m) => m.conversationId === activeConversationId && !m.read && m.sender === 'seller'
    ).length;
    setUnreadCount(isOpen ? 0 : myUnread);
  }, [allMessages, activeConversationId, isOpen]);

  // Filter messages for current customer session
  const currentCustomerMessages = allMessages.filter(
    (m) => m.conversationId === activeConversationId
  );

  // Group into distinct customer threads for Admin Inbox
  const conversations: CustomerThread[] = React.useMemo(() => {
    const threadMap = new Map<string, CustomerThread>();

    allMessages.forEach((msg) => {
      const convId = msg.conversationId || 'default';
      const existing = threadMap.get(convId);
      const isUnread = !msg.read && msg.sender === 'customer';

      if (!existing) {
        threadMap.set(convId, {
          conversationId: convId,
          customerName: msg.sender === 'customer' ? msg.senderName : (profile?.full_name || 'Customer (' + convId.slice(0, 5) + ')'),
          customerEmail: msg.sender === 'customer' ? (msg.senderEmail || 'customer@kintesi.com') : 'customer@kintesi.com',
          customerPhone: msg.senderPhone,
          customerAvatar: msg.senderAvatar,
          lastMessage: msg.text,
          lastTimestamp: msg.timestamp,
          unreadCount: isUnread ? 1 : 0,
          productContext: msg.productContext,
          orderContext: msg.orderContext,
        });
      } else {
        if (msg.sender === 'customer') {
          existing.customerName = msg.senderName || existing.customerName;
          existing.customerEmail = msg.senderEmail || existing.customerEmail;
          if (msg.senderPhone) existing.customerPhone = msg.senderPhone;
          if (msg.senderAvatar) existing.customerAvatar = msg.senderAvatar;
        }
        if (new Date(msg.timestamp) >= new Date(existing.lastTimestamp)) {
          existing.lastMessage = msg.text;
          existing.lastTimestamp = msg.timestamp;
          if (msg.productContext) existing.productContext = msg.productContext;
          if (msg.orderContext) existing.orderContext = msg.orderContext;
        }
        if (isUnread) {
          existing.unreadCount += 1;
        }
      }
    });

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [allMessages, profile]);

  const openChat = (context?: { product?: ChatProductContext; order?: ChatOrderContext }) => {
    if (context?.product) setActiveProductContext(context.product);
    if (context?.order) setActiveOrderContext(context.order);
    setIsOpen(true);
    setUnreadCount(0);
    setAllMessages((prev) =>
      prev.map((m) => (m.conversationId === activeConversationId ? { ...m, read: true } : m))
    );
  };

  const closeChat = () => setIsOpen(false);
  const toggleChat = () => {
    if (!isOpen) {
      openChat();
    } else {
      closeChat();
    }
  };

  // Customer sending message -> Saves to Cloud & Local
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const customerName = profile?.full_name || user?.user_metadata?.full_name || ('Customer ' + activeConversationId.slice(-4));
    const customerEmail = user?.email || (activeConversationId.startsWith('guest_') ? `${activeConversationId}@guest.kintesi.com` : 'customer@kintesi.com');
    const msgId = generateUUID();

    const customerAvatar =
      profile?.avatar_url ||
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName)}`;

    const newMessage: ChatMessage = {
      id: msgId,
      conversationId: activeConversationId,
      sender: 'customer',
      senderName: customerName,
      senderEmail: customerEmail,
      senderPhone: profile?.phone || user?.user_metadata?.phone,
      senderAvatar: customerAvatar,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      productContext: activeProductContext || undefined,
      orderContext: activeOrderContext || undefined,
      read: false,
    };

    // Update local state immediately
    const updated = [...allMessages, newMessage];
    setAllMessages(updated);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));

    // Clear active temporary contexts
    setActiveProductContext(null);
    setActiveOrderContext(null);

    // Save to Cloud Supabase Table
    try {
      await supabase.from('chat_messages').insert({
        id: msgId,
        conversation_id: activeConversationId,
        user_id: user?.id || null,
        sender: 'customer',
        sender_name: customerName,
        sender_email: customerEmail,
        text: text.trim(),
        product_context: newMessage.productContext || null,
        order_context: newMessage.orderContext || null,
        read: false,
      });
    } catch (err) {
      console.warn('Supabase chat message insert note:', err);
    }

    // Check if this is the customer's very first message in this conversation
    const hasPreviousCustomerMessages = allMessages.some(
      (m) => m.conversationId === activeConversationId && m.sender === 'customer'
    );

    // Automated smart assistant response ONLY on the 1st message of the conversation
    if (!hasPreviousCustomerMessages) {
      setTimeout(async () => {
        let replyText = 'Thank you for your message! Our store executive has received your inquiry and will reply shortly.';

        const lower = text.toLowerCase();
        if (lower.includes('stock') || lower.includes('available')) {
          replyText = '✅ Yes! Listed products are 100% in stock in our central warehouse ready for fast dispatch.';
        } else if (lower.includes('delivery') || lower.includes('time') || lower.includes('charge')) {
          replyText = '🚚 Delivery within Dhaka is ৳60 (24-48 hours), and Outside Dhaka is ৳120 (2-3 business days). Orders over ৳1,000 get FREE Delivery!';
        } else if (lower.includes('bkash') || lower.includes('nagad') || lower.includes('payment') || lower.includes('cod')) {
          replyText = '💵 Cash on Delivery (COD) is available all over Bangladesh! You can also pay securely via bKash, Nagad, Rocket or Card.';
        } else if (lower.includes('return') || lower.includes('exchange') || lower.includes('size')) {
          replyText = '🔄 We offer a 7-day hassle-free return and size exchange guarantee on all products.';
        }

        const autoReplyId = generateUUID();
        const autoReply: ChatMessage = {
          id: autoReplyId,
          conversationId: activeConversationId,
          sender: 'seller',
          senderName: 'Kintesi Store Executive',
          senderEmail: ADMIN_EMAIL,
          text: replyText,
          timestamp: new Date().toISOString(),
          read: isOpen,
        };

        setAllMessages((prev) => {
          const next = [...prev, autoReply];
          localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
          return next;
        });

        try {
          await supabase.from('chat_messages').insert({
            id: autoReplyId,
            conversation_id: activeConversationId,
            user_id: null,
            sender: 'seller',
            sender_name: 'Kintesi Store Executive',
            sender_email: ADMIN_EMAIL,
            text: replyText,
            read: isOpen,
          });
        } catch {}
      }, 1200);
    }
  };

  // Admin replying to specific customer thread -> Saves to Cloud & Local
  const sendSellerReply = async (targetConversationId: string, text: string) => {
    if (!text.trim()) return;

    const replyId = generateUUID();
    const sellerMessage: ChatMessage = {
      id: replyId,
      conversationId: targetConversationId,
      sender: 'seller',
      senderName: profile?.full_name || 'Store Admin',
      senderEmail: user?.email || ADMIN_EMAIL,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };

    setAllMessages((prev) => {
      const next = [...prev, sellerMessage];
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    // Save to Cloud Supabase Table
    try {
      await supabase.from('chat_messages').insert({
        id: replyId,
        conversation_id: targetConversationId,
        user_id: user?.id || null,
        sender: 'seller',
        sender_name: profile?.full_name || 'Store Admin',
        sender_email: user?.email || ADMIN_EMAIL,
        text: text.trim(),
        read: true,
      });
    } catch (err) {
      console.warn('Supabase seller reply insert note:', err);
    }

    toast.success('Reply sent to customer!');
  };

  const clearChat = async (targetConversationId?: string) => {
    const convId = targetConversationId || activeConversationId;
    setAllMessages((prev) => prev.filter((m) => m.conversationId !== convId));
    try {
      await supabase.from('chat_messages').delete().eq('conversation_id', convId);
    } catch {}
    toast.success('Chat history cleared');
  };

  const deleteConversation = async (targetConversationId: string) => {
    setAllMessages((prev) => prev.filter((m) => m.conversationId !== targetConversationId));
    try {
      await supabase.from('chat_messages').delete().eq('conversation_id', targetConversationId);
    } catch {}
    toast.success('Conversation thread deleted');
  };

  return (
    <ChatContext.Provider
      value={{
        messages: currentCustomerMessages,
        conversations,
        currentConversationId: activeConversationId,
        unreadCount,
        isOpen,
        activeProductContext,
        activeOrderContext,
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
        sendSellerReply,
        clearChat,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
