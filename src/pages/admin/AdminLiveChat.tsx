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
import { useAdminTheme } from '../../contexts/AdminThemeContext';

export const AdminLiveChat: React.FC = () => {
  const { conversations, sendSellerReply, clearChat, deleteConversation, deleteAllChatMessages } = useChat();
  const { user } = useAuth();
  const { isLight } = useAdminTheme();
  
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
        if (saved) {
          const parsed: ChatMessage[] = JSON.parse(saved);
          setAllMasterMessages(parsed.filter((m) => m && m.id !== 'msg-welcome'));
        } else {
          setAllMasterMessages([]);
        }
      } catch {}
    };
    loadMaster();
    const interval = setInterval(loadMaster, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleClearAllMessages = async () => {
    if (window.confirm('Are you sure you want to delete ALL live chat messages and inquiries?')) {
      await deleteAllChatMessages();
      setSelectedConversationId('');
      setAllMasterMessages([]);
    }
  };

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
      className={`${isLight ? 'bg-slate-50' : 'bg-gray-900'} w-full flex flex-col md:flex-row overflow-hidden select-none transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen'
          : 'h-full flex-1 min-h-0'
      }`}
    >
      
      {/* LEFT: Customer List Sidebar (Simple & Minimal) */}
      <div className={`w-full md:w-80 lg:w-96 ${isLight ? 'bg-white border-r border-slate-200 shadow-2xs' : 'bg-gray-950 border-r border-gray-800/80'} flex flex-col shrink-0 h-full min-h-0`}>
        
        {/* Search Header */}
        <div className={`p-4 border-b ${isLight ? 'border-slate-200 bg-white' : 'border-gray-800/80'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <MessageCircle className="w-4 h-4 text-rose-500" />
              <span>Live Inquiries</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {conversations.length} Active
              </span>
              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllMessages}
                  className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition shadow-2xs cursor-pointer"
                  title="Delete All Messages & Inquiries"
                  aria-label="Delete All Messages & Inquiries"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className={`p-1.5 rounded-xl border transition ${
                  isLight
                    ? 'text-black hover:bg-slate-100 bg-white border-slate-300 shadow-2xs'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 border-transparent'
                }`}
                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize Full Screen'}
                aria-label={isFullScreen ? 'Exit Full Screen' : 'Maximize Full Screen'}
              >
                {isFullScreen ? (
                  <Minimize2 className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-rose-500'}`} />
                ) : (
                  <Maximize2 className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-rose-500'}`} />
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-black' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs transition focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 ${
                isLight
                  ? 'bg-white border-2 border-slate-300 text-black placeholder:text-slate-600 font-bold focus:border-rose-500'
                  : 'bg-gray-900 border border-gray-800 text-white placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <p className={`text-center py-10 text-xs font-bold ${isLight ? 'text-black' : 'text-slate-400'}`}>No chats yet</p>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = (selectedConversationId || activeThread?.conversationId) === conv.conversationId;

              return (
                <div
                  key={conv.conversationId}
                  onClick={() => setSelectedConversationId(conv.conversationId)}
                  className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : isLight
                      ? 'hover:bg-slate-100 text-black font-semibold'
                      : 'hover:bg-gray-900 text-gray-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={conv.customerName}
                      avatarUrl={conv.customerAvatar}
                      size="md"
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 rounded-full ${
                      isLight ? 'border-white' : 'border-gray-950'
                    }`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-black text-xs truncate ${
                        isSelected
                          ? 'text-white'
                          : isLight
                          ? 'text-black'
                          : 'text-gray-200'
                      }`}>
                        {conv.customerName}
                      </p>
                      <span className={`text-[10px] font-bold ${
                        isSelected
                          ? 'text-rose-100'
                          : isLight
                          ? 'text-black'
                          : 'text-gray-500'
                      }`}>
                        {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[11px] font-semibold truncate mt-0.5 ${
                      isSelected
                        ? 'text-rose-100'
                        : isLight
                        ? 'text-slate-800'
                        : 'text-gray-400'
                    }`}>
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
      <div className={`flex-1 flex flex-col min-w-0 ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
        
        {/* Chat Header */}
        {activeThread ? (
          <div className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'bg-white border-slate-300 shadow-2xs' : 'bg-gray-900/90 border-gray-800'
          }`}>
            <div className="flex items-center gap-3">
              <UserAvatar
                name={activeThread.customerName}
                avatarUrl={activeThread.customerAvatar}
                size="md"
                className="border-rose-500/30 shadow-sm"
              />
              <div>
                <h3 className={`font-black text-base leading-tight ${isLight ? 'text-black' : 'text-white'}`}>
                  {activeThread.customerName}
                </h3>
                <p className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>{activeThread.customerEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-black border shadow-xs cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-black border-slate-300'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700/60'
                }`}
                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize to Full Screen'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-rose-500'}`} />
                    <span className="text-[11px] font-black text-black">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-rose-500'}`} />
                    <span className="text-[11px] font-black text-black">Full Screen</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete conversation with ${activeThread.customerName}?`)) {
                    deleteConversation(activeThread.conversationId);
                  }
                }}
                className={`p-2 rounded-xl transition border cursor-pointer ${
                  isLight
                    ? 'text-black hover:text-rose-600 hover:bg-rose-50 bg-white border-slate-300 shadow-2xs'
                    : 'text-gray-500 hover:text-rose-400 hover:bg-gray-800 border-transparent'
                }`}
                title="Delete conversation"
              >
                <Trash2 className={`w-4 h-4 ${isLight ? 'text-black' : ''}`} />
              </button>
            </div>
          </div>
        ) : (
          <div className={`p-4 border-b flex items-center justify-between text-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-gray-900/90 border-gray-800 text-gray-500'
          }`}>
            <span>Select a chat to begin</span>
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className={`p-1.5 rounded-lg transition ${
                isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Maximize Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-rose-500" /> : <Maximize2 className="w-4 h-4 text-rose-500" />}
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className={`flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 ${
          isLight ? 'bg-slate-100/70' : 'bg-gray-950/40'
        }`}>
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
                      ? 'bg-rose-600 text-white rounded-br-none shadow-rose-600/20'
                      : isLight
                      ? 'bg-white text-black font-semibold rounded-bl-none border-2 border-slate-300 shadow-xs'
                      : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                  }`}
                >
                  {/* Minimal Product Reference */}
                  {msg.productContext && (
                    <div className={`p-2 rounded-xl flex items-center gap-2 text-[11px] mb-1 ${
                      isSeller
                        ? 'bg-black/20 border border-white/10 text-white'
                        : isLight
                        ? 'bg-slate-100 border border-slate-300 text-black'
                        : 'bg-black/20 border border-white/10'
                    }`}>
                      {msg.productContext.image && (
                        <img
                          src={msg.productContext.image}
                          alt={msg.productContext.title}
                          className="w-8 h-8 rounded-lg object-cover bg-white"
                        />
                      )}
                      <div className="truncate">
                        <p className={`font-black truncate ${isLight && !isSeller ? 'text-black' : ''}`}>{msg.productContext.title}</p>
                        {msg.productContext.price && (
                          <p className={`font-black ${isSeller ? 'text-rose-200' : 'text-rose-600'}`}>
                            {formatPrice(msg.productContext.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Minimal Order Reference */}
                  {msg.orderContext && (
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-mono mb-1 ${
                      isSeller
                        ? 'bg-black/20 border border-white/10 text-white'
                        : isLight
                        ? 'bg-slate-100 border border-slate-300 text-black font-bold'
                        : 'bg-black/20 border border-white/10'
                    }`}>
                      Order #{msg.orderContext.orderNumber}
                    </div>
                  )}

                  <p className={`whitespace-pre-line text-sm ${isSeller ? 'text-white' : isLight ? 'text-black font-bold' : 'text-gray-100'}`}>
                    {msg.text}
                  </p>
                  
                  <span className={`text-[10px] font-bold block text-right font-mono ${
                    isSeller
                      ? 'text-rose-100'
                      : isLight
                      ? 'text-black'
                      : 'text-gray-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isSeller && (
                  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-rose-600 border border-rose-400 text-white flex items-center justify-center font-black text-xs shadow-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input Bar */}
        <form onSubmit={handleSendReply} className={`p-3 border-t flex items-center gap-2 ${
          isLight ? 'bg-white border-slate-300' : 'bg-gray-950 border-gray-800'
        }`}>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Message ${activeThread?.customerName || 'customer'}...`}
            className={`flex-1 px-4 py-2.5 rounded-2xl text-xs transition focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 ${
              isLight
                ? 'bg-white border-2 border-slate-300 text-black font-bold placeholder:text-slate-600 focus:bg-white'
                : 'bg-gray-900 border border-gray-800 text-white placeholder-gray-500'
            }`}
          />

          <button
            type="submit"
            disabled={!replyText.trim() || !activeThread}
            className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white rounded-2xl transition shadow-md shadow-rose-600/25 cursor-pointer active:scale-95"
            title="Send"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>

      </div>
    </div>
  );
};
