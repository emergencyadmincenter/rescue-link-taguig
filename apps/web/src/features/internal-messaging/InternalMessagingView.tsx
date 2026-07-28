import { useState, useEffect } from 'react';
import { ChatList } from './components/ChatList';
import { ChatArea } from './components/ChatArea';
import { CreateGroupDialog } from './components/CreateGroupDialog';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '@/providers/AuthProvider';
import { useInternalMessaging } from '@/providers/InternalMessagingProvider';
import { User } from './types';

export function InternalMessagingView() {
  const { user: authUser } = useAuth();
  
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    createGroup,
    fetchConversations,
    initializeSocket,
    disconnectSocket,
    toggleMute
  } = useInternalMessaging();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    initializeSocket();
  }, [fetchConversations, initializeSocket]);

  // Auto-select the first conversation if none is selected
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  const currentUser: User = authUser 
    ? { id: authUser.id, name: authUser.name, role: authUser.roles?.[0] || 'user', avatarUrl: authUser.avatar_url } 
    : { id: '', name: 'Unknown', role: 'user' };

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const activeMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

  const handleSendMessage = (text: string, imageKeys?: string[]) => {
    if (!activeConversationId) return;
    sendMessage(activeConversationId, text, imageKeys);
  };

  const handleCreateGroup = (name: string, selectedUserIds: string[]) => {
    createGroup(name, selectedUserIds);
    setIsDialogOpen(false);
  };

  const isAdmin = currentUser.role === 'admin';

  // Get all users from the direct conversations (which now includes all personnel)
  const allAvailableUsers: User[] = conversations
    .filter(c => c.type === 'direct')
    .flatMap(c => c.participants)
    .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
    .filter(u => u.id !== currentUser.id);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar / Chat List */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-100">
        <div className="flex-1 overflow-hidden relative">
          <ChatList
            conversations={conversations}
            activeChatId={activeConversationId}
            onSelectChat={setActiveConversationId}
            currentUser={currentUser}
          />
          {isAdmin && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={() => setIsDialogOpen(true)}
                className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-dark transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                title="Create Group"
              >
                <FiPlus className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <ChatArea
          conversation={activeConversation}
          currentUser={currentUser}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          onToggleMute={toggleMute}
        />
      </div>

      <CreateGroupDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        users={allAvailableUsers}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}

