import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../lib/utils';
import {
  MessageCircle,
  Send,
  Trash2,
  Search,
  ShoppingBag,
  Package,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';

export const AdminLiveChat: React.FC = () => {
  const { conversations, sendSellerReply, clearChat, deleteConversation } = useChat();
  const { user } = useAuth();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Set default selected conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].conversationId);
    }
  }, [conversations, selectedConversationId]);

  // Real-time messages sync
  const [allMasterMessages, setAllMasterMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const loadMaster = () => {
      try {
        const saved = localStorage.getItem('kintesi_live_chat_master_threads');
        if (saved) setAllMasterMessages(JSON.parse(saved));
      } catch {}
    };
    loadMaster();
    const interval = setInterval(loadMaster, 1200);
    return () => clearInterval(interval);
  }, []);

  const activeThread = conversations.find((c) => c.conversationId === selectedConversationId) || conversations[0];
  
  const activeThreadMessages = allMasterMessages.filter(
    (m) => m.conversationId === (selectedConversationId || activeThread?.conversationId)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadMessages.length, selectedConversationId]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    await sendSellerReply(activeThread.conversationId, replyText);
    setReplyText('');
    
    try {
      const saved = localStorage.getItem('kintesi_live_chat_master_threads');
      if (saved) setAllMasterMessages(JSON.parse(saved));
    } catch {}
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.customerName.toLowerCase().includes(q) ||
      conv.customerEmail.toLowerCase().includes(q) ||
      conv.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`bg-gray-900 w-full flex flex-col md:flex-row overflow-hidden select-none transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen'
          : 'h-full flex-1 min-h-0'
      }`}
    >
      
      {/* LEFT: Customer List Sidebar (Simple & Minimal) */}
      <div className="w-full md:w-80 lg:w-96 bg-gray-950 border-r border-gray-800/80 flex flex-col shrink-0 h-full min-h-0">
        
        {/* Search Header */}
        <div className="p-4 border-b border-gray-800/80">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Live Inquiries</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                {conversations.length} Active
              </span>
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize Full Screen'}
                aria-label={isFullScreen ? 'Exit Full Screen' : 'Maximize Full Screen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <p className="text-center py-10 text-xs text-gray-500">No chats yet</p>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = (selectedConversationId || activeThread?.conversationId) === conv.conversationId;

              return (
                <div
                  key={conv.conversationId}
                  onClick={() => setSelectedConversationId(conv.conversationId)}
                  className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'hover:bg-gray-900 text-gray-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={conv.customerName}
                      avatarUrl={conv.customerAvatar}
                      size="md"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-gray-950 rounded-full" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {conv.customerName}
                      </p>
                      <span className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-gray-500'}`}>
                        {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Clean Chat Canvas */}
      <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
        
        {/* Chat Header */}
        {activeThread ? (
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={activeThread.customerName}
                avatarUrl={activeThread.customerAvatar}
                size="md"
                className="border-emerald-500/40 shadow-sm"
              />
              <div>
                <h3 className="font-bold text-white text-sm leading-tight">
                  {activeThread.customerName}
                </h3>
                <p className="text-[11px] text-gray-400">{activeThread.customerEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition text-xs font-semibold border border-gray-700/60 shadow-xs cursor-pointer active:scale-95"
                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize to Full Screen'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold">Full Screen</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete conversation with ${activeThread.customerName}?`)) {
                    deleteConversation(activeThread.conversationId);
                  }
                }}
                className="p-2 text-gray-500 hover:text-rose-400 hover:bg-gray-800 rounded-xl transition"
                title="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/90 text-xs text-gray-500">
            <span>Select a chat to begin</span>
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-gray-950/40">
          {activeThreadMessages.map((msg) => {
            const isSeller = msg.sender === 'seller';

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isSeller ? 'justify-end' : 'justify-start'}`}
              >
                {!isSeller && (
                  <div className="mb-1">
                    <UserAvatar
                      name={msg.senderName}
                      avatarUrl={msg.senderAvatar}
                      size="sm"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm space-y-1.5 leading-relaxed ${
                    isSeller
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                  }`}
                >
                  {/* Minimal Product Reference */}
                  {msg.productContext && (
                    <div className="p-2 bg-black/20 rounded-xl flex items-center gap-2 text-[11px] border border-white/10 mb-1">
                      {msg.productContext.image && (
                        <img
                          src={msg.productContext.image}
                          alt={msg.productContext.title}
                          className="w-8 h-8 rounded-lg object-cover bg-white"
                        />
                      )}
                      <div className="truncate">
                        <p className="font-bold truncate">{msg.productContext.title}</p>
                        {msg.productContext.price && (
                          <p className="text-emerald-300 font-extrabold">{formatPrice(msg.productContext.price)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Minimal Order Reference */}
                  {msg.orderContext && (
                    <div className="px-2 py-1 bg-black/20 rounded-lg text-[10px] font-mono border border-white/10 mb-1">
                      Order #{msg.orderContext.orderNumber}
                    </div>
                  )}

                  <p className="whitespace-pre-line text-sm">{msg.text}</p>
                  
                  <span className={`text-[9px] block text-right font-mono ${isSeller ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isSeller && (
                  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-emerald-700 border border-emerald-500/80 text-white flex items-center justify-center font-black text-xs shadow-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input Bar */}
        <form onSubmit={handleSendReply} className="p-3 bg-gray-950 border-t border-gray-800 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Message ${activeThread?.customerName || 'customer'}...`}
            className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={!replyText.trim() || !activeThread}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white rounded-2xl transition shadow-md cursor-pointer active:scale-95"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
