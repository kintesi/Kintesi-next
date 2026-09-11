import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';
import { getProductsFromDB } from '../lib/dbService';
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
  const { user, profile, isAdmin, openAuthModal } = useAuth();

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
    if (!user) {
      toast.error('লাইভ চ্যাট করতে দয়া করে প্রথমে সাইন ইন বা রেজিস্ট্রেশন করুন।');
      openAuthModal('login');
      return;
    }
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

    // Check if customer is asking about product stock, availability or general questions
    const lowerText = text.toLowerCase();
    const isStockQuery =
      lowerText.includes('stock') ||
      lowerText.includes('stok') ||
      lowerText.includes('available') ||
      lowerText.includes('avliable') ||
      lowerText.includes('avlicable') ||
      lowerText.includes('কয়টা') ||
      lowerText.includes('কয়টা') ||
      lowerText.includes('কত পিস') ||
      lowerText.includes('স্টক') ||
      lowerText.includes('এভেইলেবল') ||
      lowerText.includes('অ্যাভেইলেবল') ||
      lowerText.includes('পাওয়া যাবে') ||
      lowerText.includes('pawa jabe') ||
      lowerText.includes('ache') ||
      lowerText.includes('ase') ||
      lowerText.includes('আছে');

    const isDeliveryQuery =
      lowerText.includes('delivery') ||
      lowerText.includes('shipping') ||
      lowerText.includes('ডেলিভারি') ||
      lowerText.includes('পৌঁছাবে') ||
      lowerText.includes('কুরিয়ার');

    const isPaymentQuery =
      lowerText.includes('bkash') ||
      lowerText.includes('nagad') ||
      lowerText.includes('payment') ||
      lowerText.includes('cod') ||
      lowerText.includes('বিকাশ') ||
      lowerText.includes('নগদ') ||
      lowerText.includes('পেমেন্ট') ||
      lowerText.includes('ক্যাশ');

    const isReturnQuery =
      lowerText.includes('return') ||
      lowerText.includes('exchange') ||
      lowerText.includes('রিটার্ন') ||
      lowerText.includes('ফেরত');

    const hasPreviousCustomerMessages = allMessages.some(
      (m) => m.conversationId === activeConversationId && m.sender === 'customer'
    );

    // Fetch DB products asynchronously for real-time inventory verification
    let allProds: any[] = [];
    try {
      allProds = await getProductsFromDB();
    } catch {
      allProds = [];
    }

    // Determine product context from this message or previous context in the conversation
    const productCtx =
      newMessage.productContext ||
      allMessages
        .slice()
        .reverse()
        .find((m) => m.conversationId === activeConversationId && m.productContext)?.productContext;

    let matchedProd: any = null;
    if (productCtx?.id) {
      matchedProd = allProds.find((p) => p.id === productCtx.id);
    }
    if (!matchedProd && productCtx?.title) {
      matchedProd = allProds.find((p) => p.title?.toLowerCase() === productCtx.title.toLowerCase());
    }
    if (!matchedProd) {
      // Check SKU match (e.g. KT-B3B1A6)
      matchedProd = allProds.find(
        (p) => p.sku && p.sku.length >= 3 && lowerText.includes(p.sku.toLowerCase())
      );
    }
    if (!matchedProd) {
      // Check full title match
      matchedProd = allProds.find(
        (p) => p.title && lowerText.includes(p.title.toLowerCase())
      );
    }
    if (!matchedProd) {
      // Check keyword match in product title (words with >= 4 characters)
      matchedProd = allProds.find((p) => {
        if (!p.title) return false;
        const words = p.title.toLowerCase().split(/[\s,.-]+/).filter((w: string) => w.length >= 4);
        return words.length > 0 && words.some((w: string) => lowerText.includes(w));
      });
    }

    let shouldAutoReply = false;
    let replyText = '';

    if (
      matchedProd &&
      (isStockQuery ||
        lowerText.includes(matchedProd.title.toLowerCase()) ||
        (matchedProd.sku && lowerText.includes(matchedProd.sku.toLowerCase())))
    ) {
      shouldAutoReply = true;
      const livePrice = matchedProd.discount_price || matchedProd.price;
      if (matchedProd.stock > 0) {
        replyText = `📦 "${matchedProd.title}" আমাদের সেন্ট্রাল ইনভেন্টরিতে অ্যাভেইলেবল আছে!\n\n🔹 বর্তমান স্টক: ${matchedProd.stock} টি\n🔹 লাইভ প্রাইস: ৳${livePrice.toLocaleString()}\n${matchedProd.sku ? `🔹 SKU কোড: ${matchedProd.sku}\n` : ''}\nআপনি সরাসরি প্রোডাক্ট পেজ থেকে 'অর্ডার করুন' অথবা ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন।`;
      } else {
        replyText = `❌ দুঃখিত, "${matchedProd.title}" বর্তমানে সম্পূর্ণ স্টক আউট (০ টি অ্যাভেইলেবল)। সেন্ট্রাল ইনভেন্টরিতে নতুন স্টক আসা মাত্রই ওয়েবসাইটে আপডেট দেওয়া হবে।`;
      }
    } else if (isStockQuery) {
      shouldAutoReply = true;
      replyText =
        '📦 আমাদের স্টোরের সব প্রোডাক্টের রিয়েল-টাইম স্টক আপডেট রয়েছে। আপনি নির্দিষ্ট কোন প্রোডাক্টটির স্টক জানতে চাচ্ছেন? প্রোডাক্টটির নাম বা SKU কোড লিখে জানালে আমি সরাসরি ইনভেন্টরি চেক করে কয়টা অ্যাভেইলেবল আছে তা জানিয়ে দেব!';
    } else if (isDeliveryQuery) {
      shouldAutoReply = true;
      replyText =
        '🚚 ডেলিভারি সংক্রান্ত তথ্য:\n• ঢাকা সিটির ভেতরে: ৳৬০ (স্ট্যান্ডার্ড শিপিং)\n• ঢাকা সিটির বাইরে: ৳১২০ (কুরিয়ার ডেলিভারি)\n• ৳১,০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি!';
    } else if (isPaymentQuery) {
      shouldAutoReply = true;
      replyText =
        '💵 পেমেন্ট সুবিধা:\n• ক্যাশ অন ডেলিভারি (COD) সারাদেশে প্রযোজ্য\n• বিকাশ, নগদ, রকেট অথবা কার্ডের মাধ্যমে সরাসরি নিরাপদ পেমেন্ট করতে পারবেন।';
    } else if (isReturnQuery) {
      shouldAutoReply = true;
      replyText =
        '🔄 রিটার্ন ও এক্সচেঞ্জ পলিসি:\nপ্রোডাক্টে কোনো সমস্যা বা সাইজ এক্সচেঞ্জের প্রয়োজন হলে ডেলিভারির ৭ দিনের মধ্যে রিসিট ও আনবক্সিং ভিডিও সহ আমাদের সাথে যোগাযোগ করুন।';
    } else if (!hasPreviousCustomerMessages) {
      shouldAutoReply = true;
      replyText =
        'আসসালামু আলাইকুম / নমস্কার! Kintesi-তে আপনাকে স্বাগতম। আমি Kintesi AI অ্যাসিস্ট্যান্ট। যেকোনো প্রোডাক্টের স্টক, সাইজ, ডেলিভারি বা তথ্য জানতে আমাকে মেসেজ দিতে পারেন!';
    }

    if (shouldAutoReply && replyText) {
      setTimeout(async () => {
        const autoReplyId = generateUUID();
        const autoReply: ChatMessage = {
          id: autoReplyId,
          conversationId: activeConversationId,
          sender: 'seller',
          senderName: 'Kintesi AI Assistant',
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
            sender_name: 'Kintesi AI Assistant',
            sender_email: ADMIN_EMAIL,
            text: replyText,
            read: isOpen,
          });
        } catch {}
      }, 900);
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
