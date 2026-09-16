import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatPrice } from '../../lib/utils';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import { getProductsFromDB } from '../../lib/dbService';
import { CustomerFeedbackModal } from '../common/CustomerFeedbackModal';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  ShieldCheck,
  Package,
  Sparkles,
  Phone,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Headphones,
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

  const { user } = useAuth();
  const { language } = useLanguage();
  const { settings } = useSettings();
  const location = useLocation();

  const phone = settings?.helplinePhone?.trim() || '01902593390';
  const cleanPhoneForWhatsApp = phone.replace(/\D/g, '').replace(/^0/, '880');

  const isProductPage = location.pathname.startsWith('/product/');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isCheckoutPage = location.pathname === '/checkout';

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resolve and attach product context whenever navigating to /product/:slug
  useEffect(() => {
    if (!isProductPage) return;
    const slug = location.pathname.replace('/product/', '').split('/')[0]?.trim();
    if (!slug) return;

    if (!activeProductContext || activeProductContext.id !== slug) {
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
        getProductsFromDB()
          .then((prods) => {
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
          })
          .catch(() => {});
      }
    }
  }, [isProductPage, location.pathname, activeProductContext?.id]);

  // Listen to global open chat/feedback events
  useEffect(() => {
    const handleOpenChatEvent = (e: any) => {
      setIsHubOpen(false);
      openChat(e?.detail);
    };

    const handleOpenFeedbackEvent = () => {
      setIsHubOpen(false);
      setIsFeedbackModalOpen(true);
    };

    window.addEventListener('kintesi_open_chat', handleOpenChatEvent);
    window.addEventListener('kintesi_open_feedback', handleOpenFeedbackEvent);
    return () => {
      window.removeEventListener('kintesi_open_chat', handleOpenChatEvent);
      window.removeEventListener('kintesi_open_feedback', handleOpenFeedbackEvent);
    };
  }, [openChat]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Hide widget on admin routes or clean checkout to prevent distraction
  if (isAdminPage || isCheckoutPage) {
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

  const handleWhatsAppClick = (topic?: string) => {
    let msg = 'Hello Kintesi Customer Care, I need some assistance.';
    if (activeProductContext) {
      msg = `Hello Kintesi Support, I have a query about: "${activeProductContext.title}". Is it available in stock?`;
    } else if (activeOrderContext) {
      msg = `Hello Kintesi Support, I need help regarding Order #${activeOrderContext.orderNumber}.`;
    } else if (topic) {
      msg = `Hello Kintesi Support, I have an inquiry about: ${topic}.`;
    }

    window.open(`https://wa.me/${cleanPhoneForWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      {/* Floating Customer Support Launcher */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3.5 md:right-6 z-40 flex flex-col items-end gap-2">
          {/* Quick Hub Popover Menu */}
          {isHubOpen && (
            <div className="w-[310px] sm:w-[340px] bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
              {/* Hub Header */}
              <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-rose-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-white/10 p-1.5 flex items-center justify-center border border-white/20">
                      <Headphones className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs flex items-center gap-1.5">
                        <span>Kintesi Customer Care</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-rose-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Support Active • Fast Response</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsHubOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hub Channels */}
              <div className="p-3 space-y-2 bg-gray-50/50">
                {/* 1. WhatsApp Support */}
                <button
                  onClick={() => {
                    setIsHubOpen(false);
                    handleWhatsAppClick();
                  }}
                  className="w-full p-3 bg-white hover:bg-emerald-50/80 border border-gray-100 hover:border-emerald-200 rounded-2xl flex items-center justify-between text-left transition group shadow-xs active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition">
                      💬
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-emerald-800 flex items-center gap-1">
                        <span>WhatsApp Instant Support</span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded">
                          FAST
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Chat directly with support agent
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition group-hover:translate-x-0.5" />
                </button>

                {/* 2. Direct Phone Call */}
                <a
                  href={`tel:${phone}`}
                  onClick={() => setIsHubOpen(false)}
                  className="w-full p-3 bg-white hover:bg-rose-50/80 border border-gray-100 hover:border-rose-200 rounded-2xl flex items-center justify-between text-left transition group shadow-xs active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-rose-700">
                        Direct Helpline Call
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-mono font-medium">
                        {phone} (9 AM - 11 PM)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600 transition group-hover:translate-x-0.5" />
                </a>

                {/* 3. Live On-Site Chat */}
                <button
                  onClick={() => {
                    setIsHubOpen(false);
                    openChat(activeProductContext ? { product: activeProductContext } : undefined);
                  }}
                  className="w-full p-3 bg-white hover:bg-gray-100/80 border border-gray-100 rounded-2xl flex items-center justify-between text-left transition group shadow-xs active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900">Live Web Chat</div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Chat right here on this page
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition group-hover:translate-x-0.5" />
                </button>

                {/* 4. Customer Feedback & Report an Issue */}
                <button
                  onClick={() => {
                    setIsHubOpen(false);
                    setIsFeedbackModalOpen(true);
                  }}
                  className="w-full p-3 bg-white hover:bg-amber-50/80 border border-gray-100 hover:border-amber-200 rounded-2xl flex items-center justify-between text-left transition group shadow-xs active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition">
                      ⭐
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-amber-800">
                        Share Feedback / Report Issue
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Tell us any complaint or idea
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Footer reassurance */}
              <div className="p-2.5 bg-rose-50/60 border-t border-rose-100 text-center text-[10px] text-rose-800 font-medium">
                🛡️ 100% Satisfaction Guarantee & 7-Day Easy Return
              </div>
            </div>
          )}

          {/* Floating Action Button */}
          <button
            onClick={() => {
              if (isProductPage) {
                // On product page, directly open the full chat or hub
                openChat(activeProductContext ? { product: activeProductContext } : undefined);
              } else {
                setIsHubOpen(!isHubOpen);
              }
            }}
            className="p-3 sm:p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group ring-4 ring-rose-600/20"
            aria-label="Customer Support & Feedback"
          >
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-xs font-bold font-sans">
              Customer Support
            </span>
          </button>
        </div>
      )}

      {/* Live Chat Modal / Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3.5 md:right-6 z-50 w-[92vw] sm:w-96 max-w-lg h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-rose-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-rose-950 p-4 text-white flex items-center justify-between shadow-md border-b border-rose-950/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xs border border-rose-100/40">
                  <img src="/logo.webp" alt="Kintesi" className="w-full h-full object-contain" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-900 rounded-full" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Kintesi Customer Care</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                </h3>
                <p className="text-[10px] text-rose-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span>Online • Immediate Assistance</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* WhatsApp direct switch button */}
              <button
                onClick={() => handleWhatsAppClick()}
                className="p-1.5 text-emerald-400 hover:bg-white/10 rounded-xl transition"
                title="Switch to WhatsApp"
              >
                💬
              </button>
              {/* Phone call switch */}
              <a
                href={`tel:${phone}`}
                className="p-1.5 text-gray-300 hover:text-rose-300 hover:bg-white/10 rounded-xl transition"
                title={`Call ${phone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
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
                        ? 'bg-rose-600 text-white rounded-br-none'
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
              placeholder={language === 'bn' ? 'আপনার মেসেজ লিখুন...' : 'Type your message to support...'}
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

      {/* Global Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </>
  );
};
