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
import { Logger } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class CommunicationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommunicationsGateway.name);

  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSockets Gateway initialized');
    this.communicationsService.setServer(server);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Socket connecting: ${client.id}. Headers: ${JSON.stringify(client.handshake.headers)}`);
    let token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
    
    // Parse from cookie if available
    const cookieHeader = client.handshake.headers.cookie;
    this.logger.log(`Cookie header: ${cookieHeader}`);
    if (!token && cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['Authentication'] || cookies['access_token'] || cookies['token']; // depends on backend cookie name
    }
    
    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        if (decoded && decoded.sub) {
          // Verify user actually exists in the database to prevent ghost connections
          // after a database wipe or environment reset.
          const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
          
          if (user) {
            // This is a coordinator
            client.data.userId = decoded.sub;
            client.data.role = 'coordinator';
            await this.communicationsService.handleCoordinatorConnect(client, decoded.sub);
            return;
          } else {
            this.logger.warn(`User ${decoded.sub} from token does not exist in database (ghost session). Socket: ${client.id}`);
          }
        }
      } catch (e) {
        this.logger.warn(`Invalid token for socket ${client.id}`);
      }
    }
    
    // Resident or unauthenticated client
    client.data.role = 'resident';
    this.logger.log(`Resident/Anonymous client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    if (client.data.role === 'coordinator' && client.data.userId) {
      this.communicationsService.handleCoordinatorDisconnect(client);
    } else {
      this.logger.log(`Resident client disconnected: ${client.id}`);
      if (client.data.callId) {
        this.communicationsService.handleResidentDisconnect(client.data.callId);
      }
    }
  }

  @SubscribeMessage('join_call_room')
  async handleJoinCallRoom(@ConnectedSocket() client: Socket, @MessageBody() callId: string) {
    const call = await this.communicationsService.getCallDetails(callId);
    if (!call) return { success: false, error: 'Call not found' };

    if (client.data.role === 'coordinator') {
      if ((call.status === 'active' || call.status === 'ringing') && call.coordinator_id !== client.data.userId) {
        return { success: false, error: 'Unauthorized: Call is assigned to another coordinator' };
      }
    } else {
      // Resident is authorized by possessing the UUID
      this.logger.log(`Resident accessing call room with UUID: ${callId}`);
    }

    client.join(`call_${callId}`);
    client.data.callId = callId;
    this.logger.log(`Client ${client.id} joined room call_${callId}`);

    // Rehydrate state if they are reconnecting
    if (call) {
      if (call.status === 'active') {
        client.emit('call_accepted', { 
          callId, 
          coordinatorId: call.coordinator_id,
          logId: call.log_id,
          communicationMethod: call.communication_method
        });
      } else if (call.status === 'ended' || call.status === 'missed') {
        client.emit(call.status === 'missed' ? 'routing_timeout' : 'call_ended', { 
          callId, message: call.status === 'missed' ? 'No coordinators available at the moment.' : undefined 
        });
      } else if (call.status === 'ringing') {
        client.emit('routing_status', { status: 'ringing', message: 'Connecting to a coordinator...' });
      }
    }

    return { success: true };
  }

  @SubscribeMessage('coordinator_response')
  async handleCoordinatorResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; accept: boolean; rejectReason?: string }
  ) {
    if (client.data.role !== 'coordinator') return { success: false, error: 'Unauthorized' };

    return await this.communicationsService.handleCoordinatorResponse(
      data.callId,
      client.data.userId,
      data.accept,
      data.rejectReason
    );
  }

  @SubscribeMessage('end_call')
  async handleEndCall(@ConnectedSocket() client: Socket, @MessageBody() data: { callId?: string; logId?: string }) {
    const role = client.data.role === 'coordinator' ? 'coordinator' : 'resident';
    
    let callId = data.callId;
    if (!callId && data.logId) {
      const call = await this.communicationsService['prisma'].call.findFirst({
        where: { log_id: data.logId },
        orderBy: { started_at: 'desc' }
      });
      if (call) callId = call.id;
    }

    if (callId) {
      await this.communicationsService.endCall(callId, role);
    }
    return { success: true };
  }

  @SubscribeMessage('send_chat_message')
  async handleSendChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; type: 'text' | 'image' | 'file'; text?: string; attachmentUrl?: string }
  ) {
    const senderType = client.data.role === 'coordinator' ? 'coordinator' : 'resident';
    return await this.communicationsService.saveMessage(
      data.callId,
      senderType,
      data.type,
      data.text,
      data.attachmentUrl
    );
  }

  // WebRTC Signaling
  @SubscribeMessage('webrtc_offer')
  handleOffer(@ConnectedSocket() client: Socket, @MessageBody() data: { callId: string; offer: any }) {
    client.to(`call_${data.callId}`).emit('webrtc_offer', data.offer);
  }

  @SubscribeMessage('webrtc_answer')
  handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: { callId: string; answer: any }) {
    client.to(`call_${data.callId}`).emit('webrtc_answer', data.answer);
  }

  @SubscribeMessage('webrtc_ice_candidate')
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: { callId: string; candidate: any }) {
    client.to(`call_${data.callId}`).emit('webrtc_ice_candidate', data.candidate);
  }
}
