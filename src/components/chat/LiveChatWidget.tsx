import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { formatPrice } from '../../lib/utils';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import { getProductsFromDB } from '../../lib/dbService';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Trash2,
  ShieldCheck,
  Package,
  ShoppingBag,
  Sparkles,
  CheckCheck,
  HelpCircle,
} from 'lucide-react';

const getQuickQuestions = (lang: string) => [
  lang === 'bn' ? 'এই প্রোডাক্টটি বর্তমানে স্টকে আছে?' : 'Is this product currently in stock?',
  lang === 'bn' ? 'ডেলিভারি চার্জ কত এবং কতদিনে পাবো?' : 'How many days for delivery to my district?',
  lang === 'bn' ? 'ক্যাশ অন ডেলিভারি দেওয়া যাবে?' : 'Is Cash on Delivery available?',
  lang === 'bn' ? 'সাইজ পরিবর্তন বা রিটার্ন পলিসি কি?' : 'What is your size exchange & return policy?',
];

export const LiveChatWidget: React.FC = () => {
  const {
    messages,
    isOpen,
    unreadCount,
    activeProductContext,
    activeOrderContext,
    setActiveProductContext,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    clearChat,
  } = useChat();

  const { user, openAuthModal } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/product/');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resolve and attach product context whenever navigating to /product/:slug
  useEffect(() => {
    if (!isProductPage) return;
    const slug = location.pathname.replace('/product/', '').split('/')[0]?.trim();
    if (!slug) return;

    if (!activeProductContext || activeProductContext.id !== slug) {
      // Find from initial products or db
      const localMatch = INITIAL_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
      if (localMatch) {
        setActiveProductContext({
          id: localMatch.id,
          title: localMatch.title,
          price: localMatch.discount_price || localMatch.price,
          image: localMatch.images?.[0] || '/logo.webp',
          sku: localMatch.sku,
        });
      } else {
        getProductsFromDB().then((prods) => {
          const found = prods.find((p) => p.slug === slug || p.id === slug);
          if (found) {
            setActiveProductContext({
              id: found.id,
              title: found.title,
              price: found.discount_price || found.price,
              image: found.images?.[0] || '/logo.webp',
              sku: found.sku,
            });
          }
        }).catch(() => {});
      }
    }
  }, [isProductPage, location.pathname, activeProductContext?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Requirement: Chat option should not be on Home page or other pages, only when entering a product page!
  if (!isProductPage) {
    return null;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleQuickQuestion = (q: string) => {
    sendMessage(q);
  };

  return (
    <>
      {/* Floating Chat Trigger Button - Elevated on Mobile to not collide with bottom dock */}
      {!isOpen && (
        <button
          onClick={() => {
            openChat(activeProductContext ? { product: activeProductContext } : undefined);
          }}
          className="fixed bottom-28 right-4 sm:bottom-6 sm:right-6 z-40 p-3 sm:p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group ring-4 ring-rose-600/20"
          aria-label="Open Live Chat with Seller"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-xs font-bold font-sans">
            Chat with Seller
          </span>
        </button>
      )}

      {/* Live Chat Modal / Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 w-[92vw] sm:w-96 max-w-lg h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-rose-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-rose-950 p-4 text-white flex items-center justify-between shadow-md border-b border-rose-950/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xs border border-rose-100/40">
                  <img src="/logo.webp" alt="Kintesi" className="w-full h-full object-contain" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 border-2 border-gray-900 rounded-full" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Kintesi Seller & Support</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                </h3>
                <p className="text-[10px] text-rose-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
                  <span>Online • Immediate Assistance</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => clearChat()}
                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context Banner (Product or Order) */}
          {activeProductContext && (
            <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeProductContext.image && (
                  <img
                    src={activeProductContext.image}
                    alt={activeProductContext.title}
                    className="w-9 h-9 rounded-lg object-cover border border-emerald-200 shrink-0"
                  />
                )}
                <div className="truncate">
                  <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-200/60 px-1.5 py-0.5 rounded block w-fit">
                    Inquiring About
                  </span>
                  <p className="font-bold text-gray-900 truncate mt-0.5">{activeProductContext.title}</p>
                </div>
              </div>
              {activeProductContext.price && (
                <span className="font-black text-emerald-800 text-xs shrink-0">
                  {formatPrice(activeProductContext.price)}
                </span>
              )}
            </div>
          )}

          {activeOrderContext && (
            <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-200/60 px-1.5 py-0.5 rounded">
                    Order Inquiry
                  </span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">#{activeOrderContext.orderNumber}</p>
                </div>
              </div>
              {activeOrderContext.totalAmount && (
                <span className="font-black text-blue-900 text-xs">
                  {formatPrice(activeOrderContext.totalAmount)}
                </span>
              )}
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.map((msg) => {
              const isCustomer = msg.sender === 'customer';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                    {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed space-y-2 ${
                      isCustomer
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    {/* Embedded Product Card if sent with message */}
                    {msg.productContext && (
                      <div className="p-2 bg-black/10 rounded-xl flex items-center gap-2 text-[11px] border border-white/20 mb-1.5">
                        {msg.productContext.image && (
                          <img
                            src={msg.productContext.image}
                            alt={msg.productContext.title}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="truncate">
                          <p className="font-bold truncate">{msg.productContext.title}</p>
                          {msg.productContext.price && (
                            <p className="font-black">{formatPrice(msg.productContext.price)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Embedded Order Card */}
                    {msg.orderContext && (
                      <div className="p-2 bg-black/10 rounded-xl text-[11px] border border-white/20 mb-1.5 font-mono">
                        Order #{msg.orderContext.orderNumber}
                      </div>
                    )}

                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs py-1 px-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-rose-700 ml-1">Store agent typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Pills */}
          <div className="p-2 bg-white border-t border-rose-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {getQuickQuestions(language).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickQuestion(q)}
                className="px-2.5 py-1 bg-gray-50 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 border border-rose-100 rounded-full text-[10px] font-bold text-gray-600 whitespace-nowrap transition shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-rose-100 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message to seller..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-rose-100 rounded-2xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-2xl transition shadow-md flex items-center justify-center shrink-0 active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
