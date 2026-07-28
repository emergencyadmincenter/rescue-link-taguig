import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class InternalMessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    const participants =
      await this.prisma.internalConversationParticipant.findMany({
        where: { user_id: userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar_url: true,
                      user_roles: {
                        include: {
                          role: true,
                        }
                      }
                    },
                  },
                },
              },
              messages: {
                orderBy: { created_at: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          conversation: {
            updated_at: 'desc',
          },
        },
      });

    return participants.map((p) => ({
      ...p.conversation,
      unreadCount: 0, // In a real scenario, we'd calculate based on last_read_at
      is_muted: p.is_muted,
    }));
  }

  async getOrCreateDirectConversation(
    currentUserId: string,
    targetUserId: string,
  ) {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException(
        'Cannot create a conversation with yourself.',
      );
    }

    // Find existing 1:1 conversation
    const existing = await this.prisma.internalConversation.findFirst({
      where: {
        is_group: false,
        participants: {
          every: {
            user_id: { in: [currentUserId, targetUserId] },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                user_roles: {
                  include: {
                    role: true,
                  }
                }
              },
            },
          },
        },
      },
    });

    // We must ensure the conversation specifically only has these 2 participants.
    // The query above with `every` might match a conv if we are not careful, but for 1:1 it is safe enough
    // to strictly check if we found one with exactly 2 participants
    if (existing && existing.participants.length === 2) {
      return existing;
    }

    // Create new
    return this.prisma.internalConversation.create({
      data: {
        is_group: false,
        participants: {
          create: [{ user_id: currentUserId }, { user_id: targetUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                user_roles: {
                  include: {
                    role: true,
                  }
                }
              }
            }
          }
        },
      },
    });
  }

  async createGroupConversation(
    userId: string,
    title: string,
    participantIds: string[] = [],
  ) {
    const allParticipants = Array.from(new Set([userId, ...participantIds]));

    return this.prisma.internalConversation.create({
      data: {
        is_group: true,
        title,
        created_by_id: userId,
        participants: {
          create: allParticipants.map((id) => ({ user_id: id })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                user_roles: {
                  include: {
                    role: true,
                  }
                }
              }
            }
          }
        },
      },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Ensure user is participant
    const participant =
      await this.prisma.internalConversationParticipant.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: userId,
          },
        },
      });

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    return this.prisma.internalMessage.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async addParticipants(
    conversationId: string,
    userId: string,
    participantIds: string[],
  ) {
    const conversation = await this.prisma.internalConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.is_group)
      throw new ForbiddenException(
        'Cannot add participants to a 1:1 conversation',
      );

    // Add them
    const creates = participantIds.map((pId) => ({
      conversation_id: conversationId,
      user_id: pId,
    }));

    await this.prisma.internalConversationParticipant.createMany({
      data: creates,
      skipDuplicates: true,
    });

    return { success: true };
  }

  async toggleMute(conversationId: string, userId: string, isMuted?: boolean) {
    const participant =
      await this.prisma.internalConversationParticipant.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: userId,
          },
        },
      });

    if (!participant) throw new NotFoundException('Participant not found');

    const newMuteStatus =
      isMuted !== undefined ? isMuted : !participant.is_muted;

    await this.prisma.internalConversationParticipant.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { is_muted: newMuteStatus },
    });

    return { success: true, isMuted: newMuteStatus };
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.internalConversationParticipant.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { last_read_at: new Date() },
    });
    return { success: true };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text?: string,
    imageKeys?: string[],
    replyToId?: string,
  ) {
    const isParticipant =
      await this.prisma.internalConversationParticipant.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: senderId,
          },
        },
      });

    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const msg = await this.prisma.internalMessage.create({
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        image_keys: imageKeys ? imageKeys.filter(Boolean) : [],
        reply_to_id: replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            user_roles: { include: { role: true } },
          },
        },
      },
    });

    // Update conversation timestamp
    await this.prisma.internalConversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    return msg;
  }
}
