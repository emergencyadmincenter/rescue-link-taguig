import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';

@WebSocketGateway({
  namespace: 'logs',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LogsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private extractTokenFromCookie(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader
      .split(';')
      .reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
    return (
      cookies['Authentication'] || cookies['access_token'] || cookies['token']
    );
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected to logs namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from logs namespace: ${client.id}`);
  }

  @SubscribeMessage('subscribe_log')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      logId?: string;
      shareToken?: string;
      agencyToken?: string;
      authToken?: string;
    },
  ) {
    let authorizedLogId: string | null = null;

    // Internal user auth via cookie/header
    const token =
      payload.authToken ||
      this.extractTokenFromCookie(client) ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (payload.logId && token) {
      try {
        const decoded = this.jwtService.verify(token);
        if (decoded && decoded.sub) {
          authorizedLogId = payload.logId;
        }
      } catch (err: any) {
        this.logger.warn(`Internal subscribe failed: ${err.message}`);
      }
    } else if (payload.shareToken && payload.agencyToken) {
      // External Agency Auth
      const log = await this.prisma.log.findUnique({
        where: { public_token: payload.shareToken },
        select: { id: true, public_token_expires_at: true },
      });

      if (
        log &&
        log.public_token_expires_at &&
        log.public_token_expires_at > new Date()
      ) {
        const coord = await this.prisma.logAgencyCoordination.findFirst({
          where: {
            log_id: log.id,
            access_token: payload.agencyToken,
          },
        });
        if (coord) {
          authorizedLogId = log.id;
        }
      }
    }

    if (authorizedLogId) {
      client.join(`log_${authorizedLogId}`);
      this.logger.log(`Client ${client.id} joined room log_${authorizedLogId}`);
      return { status: 'subscribed', logId: authorizedLogId };
    }

    return { status: 'error', message: 'Unauthorized' };
  }

  broadcastCoordinationUpdate(logId: string, update: any) {
    this.server.to(`log_${logId}`).emit('coordination_update', update);
  }
}
