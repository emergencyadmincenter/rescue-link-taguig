"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { InternalConversation, InternalMessage } from '../features/internal-messaging/types';
import apiClient from '../lib/api-client';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';

interface InternalMessagingContextType {
  conversations: InternalConversation[];
  activeConversationId: string | null;
  messages: Record<string, InternalMessage[]>;
  socket: Socket | null;
  isConnected: boolean;
  isPanelOpen: boolean;
  
  setActiveConversationId: (id: string | null) => void;
  setPanelOpen: (isOpen: boolean) => void;
  
  floatingPanels: string[];
  minimizedPanels: Record<string, boolean>;
  addFloatingPanel: (conversationId: string) => void;
  removeFloatingPanel: (conversationId: string) => void;
  minimizeFloatingPanel: (conversationId: string, minimized: boolean) => void;
  
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text?: string, imageKeys?: string[]) => Promise<void>;
  createGroup: (title: string, participantIds: string[]) => Promise<void>;
  toggleMute: (conversationId: string) => Promise<void>;
  
  initializeSocket: () => void;
  disconnectSocket: () => void;
}

const InternalMessagingContext = createContext<InternalMessagingContextType | undefined>(undefined);

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '') + '/internal-messaging';

export const InternalMessagingProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<InternalConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, InternalMessage[]>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPanelOpen, setPanelOpen] = useState(false);
  
  const [floatingPanels, setFloatingPanels] = useState<string[]>([]);
  const [minimizedPanels, setMinimizedPanels] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  
  const socketRef = useRef<Socket | null>(null);
  const fetchConversationsRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const fetchedHistoryRef = useRef<Record<string, boolean>>({});
  
  const conversationsRef = useRef<InternalConversation[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const addFloatingPanel = useCallback((conversationId: string) => {
    setFloatingPanels(prev => {
      if (prev.includes(conversationId)) return prev;
      const newPanels = [conversationId, ...prev];
      if (newPanels.length > 3) {
        return newPanels.slice(0, 3);
      }
      return newPanels;
    });
    setMinimizedPanels(prev => ({ ...prev, [conversationId]: false }));
  }, []);

  const removeFloatingPanel = useCallback((conversationId: string) => {
    setFloatingPanels(prev => prev.filter(id => id !== conversationId));
  }, []);

  const minimizeFloatingPanel = useCallback((conversationId: string, minimized: boolean) => {
    setMinimizedPanels(prev => ({ ...prev, [conversationId]: minimized }));
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiClient.get('/internal-messaging/conversations');
      const convs = res.data.map((c: any) => ({
        id: c.id,
        type: c.is_group ? 'group' : 'direct',
        name: c.title,
        participants: c.participants.map((p: any) => ({
          id: p.user.id,
          name: p.user.name,
          avatarUrl: p.user.avatar_url,
          role: p.user.user_roles?.[0]?.role?.name || 'user'
        })),
        lastMessage: c.messages?.[0] ? {
           id: c.messages[0].id,
           conversationId: c.messages[0].conversation_id,
           senderId: c.messages[0].sender_id,
           text: c.messages[0].text,
           createdAt: c.messages[0].created_at,
           image_keys: c.messages[0].image_keys
        } : undefined,
        unreadCount: 0,
        is_muted: c.is_muted
      }));

      const personnelRes = await apiClient.get('/personnel');
      const groups = personnelRes.data.groups || [];
      const allPersonnel = groups.flatMap((g: any) => g.personnel.map((p: any) => ({ ...p, role: g.role })));
      
      const currentUserId = user?.id;

      allPersonnel.forEach((person: any) => {
        if (person.id === currentUserId) return;
        const existingDirect = convs.find((c: any) => c.type === 'direct' && c.participants.some((p: any) => p.id === person.id));
        if (!existingDirect) {
          convs.push({
            id: `temp-${person.id}`,
            type: 'direct',
            participants: [{
              id: person.id,
              name: person.name,
              avatarUrl: person.avatar_url,
              role: person.roles?.[0]?.name || 'user'
            }],
            unreadCount: 0
          });
        }
      });

      convs.sort((a: any, b: any) => {
        const aTime = new Date(a.lastMessage?.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessage?.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setConversations(convs);
      
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_internal', { conversationIds: convs.map((c: any) => c.id) });
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await apiClient.get(`/internal-messaging/conversations/${conversationId}/messages`);
      const msgs = res.data.map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        text: m.text,
        createdAt: m.created_at,
        image_keys: m.image_keys
      }));
      setMessages((prev) => ({ ...prev, [conversationId]: msgs }));
      fetchedHistoryRef.current[conversationId] = true;
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId && !activeConversationId.startsWith('temp-') && !fetchedHistoryRef.current[activeConversationId]) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    floatingPanels.forEach(id => {
      if (!id.startsWith('temp-') && !fetchedHistoryRef.current[id]) {
        fetchMessages(id);
      }
    });
  }, [floatingPanels, fetchMessages]);

  const sendMessage = useCallback(async (conversationId: string, text?: string, imageKeys?: string[]) => {
    let actualConvId = conversationId;
    if (conversationId.startsWith('temp-')) {
      const targetUserId = conversationId.replace('temp-', '');
      try {
        const res = await apiClient.post('/internal-messaging/conversations/direct', { userId: targetUserId });
        actualConvId = res.data.id;
        await fetchConversations();
        setActiveConversationId(actualConvId);
      } catch (e) {
        console.error(e);
        return;
      }
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_internal_message', { conversationId: actualConvId, text, imageKeys });
    }
  }, [fetchConversations]);

  const createGroup = useCallback(async (title: string, participantIds: string[]) => {
    try {
      await apiClient.post('/internal-messaging/conversations/group', { title, participantIds });
      await fetchConversations();
    } catch (e) {
      console.error(e);
    }
  }, [fetchConversations]);

  const toggleMute = useCallback(async (conversationId: string) => {
    try {
      const res = await apiClient.patch(`/internal-messaging/conversations/${conversationId}/mute`);
      const { isMuted } = res.data;
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, is_muted: isMuted } : c
      ));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    if (socketRef.current) return;
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    
    newSocket.on('new_internal_message', (rawMsg: any) => {
      const msg: InternalMessage = {
        id: rawMsg.id,
        conversationId: rawMsg.conversation_id,
        senderId: rawMsg.sender_id,
        text: rawMsg.text,
        createdAt: rawMsg.created_at,
        image_keys: rawMsg.image_keys
      };
      
      setMessages((prev) => {
        const currentMsgs = prev[msg.conversationId] || [];
        return { ...prev, [msg.conversationId]: [...currentMsgs, msg] };
      });
      
      setConversations((prevConvs) => {
        const exists = prevConvs.some(c => c.id === msg.conversationId);
        if (!exists) {
          setTimeout(() => fetchConversationsRef.current?.(), 0);
          return prevConvs;
        }

        const updatedConvs = prevConvs.map(c => 
          c.id === msg.conversationId ? { ...c, lastMessage: msg } : c
        ).sort((a, b) => {
          const aTime = new Date(a.lastMessage?.createdAt || 0).getTime();
          const bTime = new Date(b.lastMessage?.createdAt || 0).getTime();
          return bTime - aTime;
        });
        return updatedConvs;
      });

      const conv = conversationsRef.current.find(c => c.id === msg.conversationId);
      const isMuted = conv?.is_muted || false;

      if (!isMuted && !window.location.pathname.includes('/internal-messaging')) {
        // We use functional update here because addFloatingPanel from context might be stale
        setFloatingPanels(prev => {
          if (prev.includes(msg.conversationId)) return prev;
          const newPanels = [msg.conversationId, ...prev];
          return newPanels.length > 3 ? newPanels.slice(0, 3) : newPanels;
        });
        setMinimizedPanels(prev => ({ ...prev, [msg.conversationId]: false }));
      }
    });
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  return (
    <InternalMessagingContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        socket,
        isConnected,
        isPanelOpen,
        setPanelOpen,
        floatingPanels,
        minimizedPanels,
        addFloatingPanel,
        removeFloatingPanel,
        minimizeFloatingPanel,
        fetchConversations,
        fetchMessages,
        sendMessage,
        createGroup,
        toggleMute,
        initializeSocket,
        disconnectSocket
      }}
    >
      {children}
    </InternalMessagingContext.Provider>
  );
};

export const useInternalMessaging = () => {
  const context = useContext(InternalMessagingContext);
  if (context === undefined) {
    throw new Error('useInternalMessaging must be used within an InternalMessagingProvider');
  }
  return context;
};
