import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';

@WebSocketGateway({
  namespace: 'internal-messaging',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class InternalMessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(InternalMessagingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Internal Messaging WebSockets Gateway initialized');
  }

  async handleConnection(client: Socket) {
    let token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    const cookieHeader = client.handshake.headers.cookie;
    if (!token && cookieHeader) {
      const cookies = cookieHeader
        .split(';')
        .reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
      token =
        cookies['Authentication'] ||
        cookies['access_token'] ||
        cookies['token'];
    }

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        if (decoded && decoded.sub) {
          const user = await this.prisma.user.findUnique({
            where: { id: decoded.sub },
            include: { user_roles: { include: { role: true } } },
          });

          if (user) {
            const roles = user.user_roles?.map((ur) => ur.role?.name) || [];
            if (
              !roles.includes('admin') &&
              !roles.includes('superadmin') &&
              !roles.includes('coordinator')
            ) {
              client.disconnect();
              return;
            }

            client.data.userId = decoded.sub;
            client.join(`user_${decoded.sub}`);
            this.logger.log(
              `User ${decoded.sub} connected to internal messaging`,
            );
            return;
          }
        }
      } catch (err) {
        this.logger.warn(`Invalid token for connection ${client.id}`);
      }
    }
    client.disconnect();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_internal')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationIds: string[] },
  ) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationIds || !Array.isArray(payload.conversationIds)) return;

    for (const conversationId of payload.conversationIds) {
      if (conversationId.startsWith('temp-')) continue;
      
      try {
        const participant = await this.prisma.internalConversationParticipant.findUnique({
          where: {
            conversation_id_user_id: {
              conversation_id: conversationId,
              user_id: userId,
            },
          },
        });

        if (participant) {
          client.join(conversationId);
          this.logger.log(`User ${userId} joined room ${conversationId}`);
        }
      } catch (err) {
        this.logger.error(`Error joining room ${conversationId}`, err);
      }
    }
  }

  @SubscribeMessage('leave_internal')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    if (payload?.conversationId) {
      client.leave(payload.conversationId);
    }
  }

  @SubscribeMessage('send_internal_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      text?: string;
      imageKeys?: string[];
      replyToId?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return;
    if (!payload.text && (!payload.imageKeys || payload.imageKeys.length === 0))
      return;

    // Verify membership
    const participant =
      await this.prisma.internalConversationParticipant.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: payload.conversationId,
            user_id: userId,
          },
        },
      });

    if (!participant) return;

    // Save message
    const message = await this.prisma.internalMessage.create({
      data: {
        conversation_id: payload.conversationId,
        sender_id: userId,
        text: payload.text,
        image_keys: payload.imageKeys || [],
        reply_to_id: payload.replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            email: true,
          },
        },
      },
    });

    await this.prisma.internalConversation.update({
      where: { id: payload.conversationId },
      data: { updated_at: new Date() }
    });

    const allParticipants = await this.prisma.internalConversationParticipant.findMany({
      where: { conversation_id: payload.conversationId },
      select: { user_id: true }
    });
    
    let broadcast = this.server.to(payload.conversationId);
    for (const p of allParticipants) {
      broadcast = broadcast.to(`user_${p.user_id}`);
    }
    
    broadcast.emit('new_internal_message', message);
  }
}
