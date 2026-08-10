import { User, InternalConversation, InternalMessage } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin Alice', role: 'admin', isOnline: true },
  { id: 'u2', name: 'Coordinator Bob', role: 'coordinator', isOnline: true },
  { id: 'u3', name: 'Coordinator Charlie', role: 'coordinator', isOnline: false },
];

export const MOCK_CONVERSATIONS: InternalConversation[] = [
  {
    id: 'c1',
    type: 'direct',
    participants: [MOCK_USERS[0], MOCK_USERS[1]],
    lastMessage: {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u2',
      text: 'Hey Alice, checking on the recent incident.',
      createdAt: new Date().toISOString(),
    },
    unreadCount: 1,
  },
  {
    id: 'c2',
    type: 'group',
    name: 'General Coordination',
    participants: MOCK_USERS,
    lastMessage: {
      id: 'm2',
      conversationId: 'c2',
      senderId: 'u1',
      text: 'Please review the updated protocols.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    unreadCount: 0,
  }
];

export const MOCK_MESSAGES: InternalMessage[] = [
  {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u2',
    text: 'Hey Alice, checking on the recent incident.',
    createdAt: new Date().toISOString(),
  }
];
