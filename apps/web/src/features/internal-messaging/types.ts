export interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface InternalMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image_keys?: string[];
  createdAt: string;
}

export interface InternalConversation {
  id: string;
  type: 'direct' | 'group';
  name?: string; // For groups
  participants: User[];
  lastMessage?: InternalMessage;
  unreadCount?: number;
  is_muted?: boolean;
}
