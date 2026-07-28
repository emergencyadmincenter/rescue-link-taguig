"use client";

import { useState, useEffect } from 'react';
import { FiMessageSquare, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { ChatList } from './components/ChatList';
import { ChatArea } from './components/ChatArea';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { useInternalMessaging } from '@/providers/InternalMessagingProvider';
import { User } from './types';

export function FloatingInternalChat() {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { user: authUser } = useAuth();
  const pathname = usePathname();
  
  const {
    conversations,
    messages,
    sendMessage,
    isPanelOpen,
    setPanelOpen,
    floatingPanels,
    minimizedPanels,
    addFloatingPanel,
    removeFloatingPanel,
    minimizeFloatingPanel,
    fetchConversations,
    initializeSocket,
    toggleMute
  } = useInternalMessaging();

  useEffect(() => {
    if (authUser && (authUser.roles?.includes('admin') || authUser.roles?.includes('coordinator'))) {
      fetchConversations();
      initializeSocket();
    }
  }, [authUser, fetchConversations, initializeSocket]);

  if (pathname === '/internal-messaging') return null;
  if (!authUser || (authUser.roles && !authUser.roles.includes('admin') && !authUser.roles.includes('coordinator'))) {
    return null;
  }

  const currentUser: User = { 
    id: authUser.id, 
    name: authUser.name, 
    role: authUser.roles?.[0] || 'user',
    avatarUrl: authUser.avatar_url
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const handleSelectChat = (id: string | null) => {
    if (id) {
      addFloatingPanel(id);
      // Optional: hide main panel when opening a chat
      // setPanelOpen(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-6 z-50 flex flex-row-reverse items-end gap-4 pointer-events-none" style={{ height: '500px' }}>
      
      {/* 1. Main ChatList Panel or Bubble */}
      <div className="pointer-events-auto mb-6 shrink-0">
        {!isPanelOpen ? (
          <button
            onClick={() => {
               setPanelOpen(true);
               setIsMinimized(false);
            }}
            className="relative w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:bg-primary-dark transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FiMessageSquare className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-danger text-white text-xs font-bold rounded-full border-2 border-white">
                {totalUnread}
              </span>
            )}
          </button>
        ) : (
          <div className={`flex flex-col bg-white rounded-t-xl rounded-b-lg shadow-2xl border border-gray-200 transition-all duration-300 ${isMinimized ? 'h-14 w-80' : 'h-[500px] w-[350px] sm:w-[400px]'}`}>
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white rounded-t-xl cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <div className="flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                <span className="font-semibold text-sm">Internal Messages</span>
                {totalUnread > 0 && isMinimized && (
                  <span className="ml-2 bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalUnread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:bg-white/20 rounded transition-colors">
                  {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setPanelOpen(false); }} className="p-1 hover:bg-white/20 rounded transition-colors">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <div className="flex-1 overflow-hidden w-full">
                <ChatList conversations={conversations} activeChatId={null} onSelectChat={handleSelectChat} currentUser={currentUser} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Floating Chat Panels */}
      {floatingPanels.map(id => {
        const conv = conversations.find(c => c.id === id) || null;
        const msgs = messages[id] || [];
        const panelMinimized = minimizedPanels[id] || false;
        
        return (
          <div key={id} className={`pointer-events-auto mb-6 shrink-0 flex flex-col bg-white rounded-t-xl rounded-b-lg shadow-2xl border border-gray-200 transition-all duration-300 ${panelMinimized ? 'h-14 w-72' : 'h-[500px] w-[350px]'}`}>
            <div className="flex items-center justify-between px-3 py-2 bg-primary text-white rounded-t-xl cursor-pointer" onClick={() => minimizeFloatingPanel(id, !panelMinimized)}>
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <span className="font-semibold text-sm truncate">
                  {conv?.type === 'group' ? conv.name : conv?.participants.find(p => p.id !== currentUser.id)?.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button onClick={(e) => { e.stopPropagation(); minimizeFloatingPanel(id, !panelMinimized); }} className="p-1 hover:bg-white/20 rounded transition-colors">
                  {panelMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeFloatingPanel(id); }} className="p-1 hover:bg-white/20 rounded transition-colors">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
            {!panelMinimized && (
              <div className="flex-1 overflow-hidden">
                <ChatArea 
                  conversation={conv} 
                  currentUser={currentUser} 
                  messages={msgs} 
                  onSendMessage={(text, keys) => sendMessage(id, text, keys)} 
                  onToggleMute={toggleMute} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
