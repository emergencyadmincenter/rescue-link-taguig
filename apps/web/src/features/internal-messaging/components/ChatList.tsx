import { useState } from 'react';
import { InternalConversation, User } from '../types';
import { FiUsers, FiMessageSquare, FiUser } from 'react-icons/fi';

interface ChatListProps {
  conversations: InternalConversation[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  currentUser: User;
}

export function ChatList({ conversations, activeChatId, onSelectChat, currentUser }: ChatListProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      <div className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <FiMessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No conversations</p>
            <p className="text-xs text-gray-500">Your personnel list is empty or there are no active chats.</p>
          </div>
        ) : (
          conversations.map((chat) => {
            const isGroup = chat.type === 'group';
            const otherUser = chat.participants.find(p => p.id !== currentUser.id);
            const title = isGroup ? chat.name : otherUser?.name || 'Unknown';
            const isActive = chat.id === activeChatId;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full flex items-start gap-3 p-4 transition-all duration-200 border-b border-gray-50 hover:bg-gray-50 focus:outline-none ${
                  isActive ? 'bg-primary-subtle/50' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0">
                    {isGroup ? (
                      <FiUsers />
                    ) : otherUser?.avatarUrl ? (
                      <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiUser />
                    )}
                  </div>
                  {!isGroup && otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`font-medium truncate ${isActive ? 'text-primary' : 'text-gray-900'}`}>
                      {title}
                    </span>
                    {chat.lastMessage && (
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMessage?.text || (chat.lastMessage?.image_keys?.length ? '📷 Image' : 'No messages yet')}
                    </p>
                    {chat.unreadCount ? (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-bold min-w-[16px]">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
