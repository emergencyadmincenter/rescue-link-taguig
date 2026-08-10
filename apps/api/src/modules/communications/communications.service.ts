import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { BarangayResolverService } from '../../common/services/barangay-resolver.service';

export interface CoordinatorPresence {
  userId: string;
  socketId: string;
  status: 'available' | 'busy' | 'offline';
  lastSeen: Date;
}

export interface RoutingState {
  callId: string;
  logId: string;
  communicationMethod: 'voice' | 'chat';
  assignedCoordinatorId?: string;
  timerId?: NodeJS.Timeout;
  attemptedCoordinators: string[];
  rejectedCoordinators: string[];
  startTime: number;
}

@Injectable()
export class CommunicationsService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(CommunicationsService.name);
  private server!: Server;

  private coordinators = new Map<string, CoordinatorPresence>();
  private activeRoutings = new Map<string, RoutingState>();
  private coordinatorAssignments = new Map<string, number>();
  private pendingTimeouts = new Set<NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly barangayResolverService: BarangayResolverService,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'Cleaning up any stale/ghost calls from previous server runs...',
    );
    try {
      const missedCalls = await this.prisma.call.updateMany({
        where: { status: 'ringing' },
        data: { status: 'missed', ended_at: new Date() },
      });
      if (missedCalls.count > 0)
        this.logger.log(`Cleaned up ${missedCalls.count} stuck ringing calls.`);

      const endedCalls = await this.prisma.call.updateMany({
        where: { status: 'active' },
        data: { status: 'ended', ended_at: new Date() },
      });
      if (endedCalls.count > 0)
        this.logger.log(`Cleaned up ${endedCalls.count} stuck active calls.`);
    } catch (e) {
      this.logger.error('Failed to run startup call cleanup', e);
    }
  }
  setServer(server: Server) {
    this.server = server;
  }

  broadcastNewIncident(logId: string) {
    if (this.server) {
      this.server.emit('new_incident', { logId, timestamp: new Date() });
    }
  }

  onApplicationShutdown() {
    this.logger.log('Graceful shutdown: clearing active routing timeouts');
    for (const state of this.activeRoutings.values()) {
      if (state.timerId) {
        clearTimeout(state.timerId);
      }
    }
    for (const timer of this.pendingTimeouts) {
      clearTimeout(timer);
    }
    this.pendingTimeouts.clear();
    this.activeRoutings.clear();
  }

  async handleCoordinatorConnect(socket: Socket, userId: string) {
    let initialStatus: 'available' | 'busy' = 'available';
    // Check if coordinator is active in any call
    const activeCall = await this.prisma.call.findFirst({
      where: { coordinator_id: userId, status: 'active' },
    });
    if (activeCall) {
      initialStatus = 'busy';
    }

    this.coordinators.set(socket.id, {
      userId,
      socketId: socket.id,
      status: initialStatus,
      lastSeen: new Date(),
    });
    this.logger.log(
      `Coordinator ${userId} connected (Socket: ${socket.id}) with status ${initialStatus}`,
    );
    void socket.join(`coordinator_${userId}`);
    this.server.emit('coordinator_status_change', {
      userId,
      status: initialStatus,
    });

    if (initialStatus === 'available') {
      this.triggerPendingRoutings();
    }
  }

  handleCoordinatorDisconnect(socket: Socket) {
    const presence = this.coordinators.get(socket.id);
    if (presence) {
      this.logger.log(`Coordinator ${presence.userId} disconnected`);
      this.coordinators.delete(socket.id);
      this.server.emit('coordinator_status_change', {
        userId: presence.userId,
        status: 'offline',
      });

      // Immediate reassignment if this coordinator was ringing
      for (const [callId, state] of this.activeRoutings.entries()) {
        if (state.assignedCoordinatorId === presence.userId) {
          if (state.timerId) {
            clearTimeout(state.timerId);
            state.timerId = undefined;
          }
          state.assignedCoordinatorId = undefined;

          this.prisma.call
            .update({
              where: { id: callId },
              data: { coordinator_id: null },
            })
            .catch((err) =>
              this.logger.error(
                'Failed to clear coordinator on disconnect:',
                err,
              ),
            );

          void this.routeNext(callId);
        }
      }

      // Clean up any ghost active calls. Wait a few seconds to allow for page navigation/reconnections.
      const timer = setTimeout(() => {
        this.pendingTimeouts.delete(timer);
        // If the coordinator has reconnected within the 5 seconds, do NOT end their active calls.
        // This prevents the return banner from disappearing when they are just viewing another page.
        let isReconnected = false;
        for (const p of this.coordinators.values()) {
          if (p.userId === presence.userId) {
            isReconnected = true;
            break;
          }
        }

        if (isReconnected) {
          return;
        }

        this.prisma.call
          .findMany({
            where: { coordinator_id: presence.userId, status: 'active' },
          })
          .then((activeCalls) => {
            for (const call of activeCalls) {
              this.logger.log(
                `Cleaning up abandoned active Call ${call.id} for Coordinator ${presence.userId}`,
              );
              this.server
                .to(`call_${call.id}`)
                .emit('call_ended', { callId: call.id, endedBy: 'system' });
              this.endCall(call.id, 'system').catch((err) =>
                this.logger.error(err),
              );
            }
          })
          .catch((err) =>
            this.logger.error('Failed to query ghost calls:', err),
          );
      }, 5000);
      this.pendingTimeouts.add(timer);
    }
  }

  setCoordinatorStatus(userId: string, status: 'available' | 'busy') {
    let emitted = false;
    for (const [socketId, presence] of this.coordinators.entries()) {
      if (presence.userId === userId) {
        this.coordinators.set(socketId, { ...presence, status });
        if (!emitted) {
          this.server.emit('coordinator_status_change', { userId, status });
          emitted = true;
        }
      }
    }

    if (status === 'available') {
      this.triggerPendingRoutings();
    }
  }

  handleResidentDisconnect(callId: string) {
    this.logger.log(`Handling resident disconnect for Call ${callId}`);

    const timer = setTimeout(() => {
      void (async () => {
        this.pendingTimeouts.delete(timer);
        // Give resident 5 seconds to reconnect
        const room = this.server.sockets.adapter.rooms.get(`call_${callId}`);
        // Find if there are any resident sockets left
        let hasResident = false;
        if (room) {
          for (const socketId of room) {
            const client = this.server.sockets.sockets.get(socketId);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (client && client.data?.role === 'resident') {
              hasResident = true;
              break;
            }
          }
        }

        if (!hasResident) {
          this.logger.log(`Resident abandoned Call ${callId}. Cleaning up.`);
          const state = this.activeRoutings.get(callId);

          if (state) {
            if (state.timerId) clearTimeout(state.timerId);
            this.activeRoutings.delete(callId);

            this.prisma.call
              .update({
                where: { id: callId },
                data: { status: 'missed', ended_at: new Date() },
              })
              .catch((err) =>
                this.logger.error('Failed to cleanup abandoned call:', err),
              );

            if (state.assignedCoordinatorId) {
              this.server
                .to(`coordinator_${state.assignedCoordinatorId}`)
                .emit('call_ended', { callId, endedBy: 'system' });
            }
          } else {
            // It might have been accepted already
            const call = await this.prisma.call.findUnique({
              where: { id: callId },
            });
            if (call && call.status === 'active') {
              void this.endCall(callId, 'resident');
              this.server
                .to(`call_${callId}`)
                .emit('call_ended', { callId, endedBy: 'resident' });
            }
          }
        }
      })();
    }, 5000);
    this.pendingTimeouts.add(timer);
  }

  private triggerPendingRoutings() {
    for (const [callId, state] of this.activeRoutings.entries()) {
      if (!state.assignedCoordinatorId) {
        if (state.timerId) {
          clearTimeout(state.timerId);
          state.timerId = undefined;
        }
        void this.routeNext(callId);
      }
    }
  }

  private getAvailableCoordinators(): string[] {
    const available = new Set<string>();

    // Find all currently ringing coordinators
    const ringingCoordinators = new Set<string>();
    for (const state of this.activeRoutings.values()) {
      if (state.assignedCoordinatorId) {
        ringingCoordinators.add(state.assignedCoordinatorId);
      }
    }

    for (const presence of this.coordinators.values()) {
      if (
        presence.status === 'available' &&
        !ringingCoordinators.has(presence.userId)
      ) {
        available.add(presence.userId);
      }
    }
    return Array.from(available);
  }

  startRouting(
    callId: string,
    communicationMethod: 'voice' | 'chat',
    logId: string,
  ) {
    this.logger.log(
      `Starting routing for Call ${callId}. Total connected coordinators in memory: ${this.coordinators.size}`,
    );

    this.activeRoutings.set(callId, {
      callId,
      communicationMethod,
      logId,
      attemptedCoordinators: [],
      rejectedCoordinators: [],
      startTime: Date.now(),
    });

    void this.routeNext(callId);
  }

  private async routeNext(callId: string) {
    const state = this.activeRoutings.get(callId);
    if (!state) return;

    const MAX_WAIT_MS = 2 * 60 * 1000;
    if (Date.now() - state.startTime >= MAX_WAIT_MS) {
      return this.handleGlobalTimeout(callId);
    }

    const available = this.getAvailableCoordinators();
    const eligibleCoordinators = available.filter(
      (id) => !state.rejectedCoordinators.includes(id),
    );

    // Sort eligible coordinators by last assigned time (ascending) for fair distribution
    eligibleCoordinators.sort((a, b) => {
      const timeA = this.coordinatorAssignments.get(a) || 0;
      const timeB = this.coordinatorAssignments.get(b) || 0;
      return timeA - timeB;
    });

    let candidate = eligibleCoordinators.find(
      (id) => !state.attemptedCoordinators.includes(id),
    );

    if (!candidate) {
      if (eligibleCoordinators.length > 0) {
        // All eligible coordinators were attempted (and missed, not rejected). Try them again!
        state.attemptedCoordinators = [...state.rejectedCoordinators];
        candidate = eligibleCoordinators[0];
      } else {
        this.logger.log(
          `No available coordinators for Call ${callId}, retrying in 5s...`,
        );
        state.timerId = setTimeout(() => {
          void this.routeNext(callId);
        }, 5000);
        return;
      }
    }

    this.logger.log(`Assigning Call ${callId} to Coordinator ${candidate}`);
    state.assignedCoordinatorId = candidate;
    state.attemptedCoordinators.push(candidate);
    this.coordinatorAssignments.set(candidate, Date.now());

    this.server.to(`coordinator_${candidate}`).emit('incoming_emergency', {
      callId,
      logId: state.logId,
      communicationMethod: state.communicationMethod,
      timeoutMs: 30000,
    });

    this.server.to(`call_${callId}`).emit('routing_status', {
      status: 'ringing',
      message: 'Connecting to a coordinator...',
    });

    // Fire-and-forget DB update to avoid blocking subsequent logic
    this.prisma.call
      .update({
        where: { id: callId },
        data: { coordinator_id: candidate },
      })
      .catch((err) =>
        this.logger.error('Failed to update call coordinator:', err),
      );

    state.timerId = setTimeout(() => {
      this.logger.log(`Coordinator ${candidate} missed Call ${callId}`);
      state.assignedCoordinatorId = undefined;

      this.prisma.call
        .update({
          where: { id: callId },
          data: { coordinator_id: null },
        })
        .catch((err) =>
          this.logger.error('Failed to clear coordinator on timeout:', err),
        );

      void this.routeNext(callId);
    }, 30000);
  }

  async handleCoordinatorResponse(
    callId: string,
    coordinatorId: string,
    accept: boolean,
    rejectReason?: string,
  ) {
    const state = this.activeRoutings.get(callId);
    if (!state || state.assignedCoordinatorId !== coordinatorId) {
      return { success: false, error: 'Invalid or expired routing state' };
    }

    if (state.timerId) clearTimeout(state.timerId);

    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call || call.status !== 'ringing') {
      return { success: false, error: 'Call is no longer ringing' };
    }

    if (accept) {
      this.logger.log(`Coordinator ${coordinatorId} accepted Call ${callId}`);
      if (state.timerId) clearTimeout(state.timerId);
      this.activeRoutings.delete(callId);
      this.setCoordinatorStatus(coordinatorId, 'busy');

      try {
        await Promise.all([
          this.prisma.call.update({
            where: { id: callId },
            data: {
              status: 'active',
              answered_at: new Date(),
              coordinator_id: coordinatorId,
            },
          }),
          call.log_id
            ? this.prisma.log.update({
                where: { id: call.log_id },
                data: {
                  assigned_coordinator_id: coordinatorId,
                  created_by_coordinator_id: coordinatorId,
                },
              })
            : Promise.resolve(),
        ]);
      } catch (err) {
        this.logger.error('Failed to update call/log on accept:', err);
        return {
          success: false,
          error: 'Internal server error during call accept',
        };
      }

      this.server.to(`call_${callId}`).emit('call_accepted', {
        callId,
        coordinatorId,
        logId: call.log_id,
        communicationMethod: call.communication_method,
      });

      return { success: true };
    } else {
      this.logger.log(
        `Coordinator ${coordinatorId} rejected Call ${callId} with reason: ${rejectReason}`,
      );

      if (state.timerId) clearTimeout(state.timerId);
      this.activeRoutings.delete(callId);

      this.server.to(`call_${callId}`).emit('call_rejected', {
        reason: rejectReason || 'Coordinator unavailable',
      });

      // Fire-and-forget database updates
      Promise.all([
        this.prisma.call.update({
          where: { id: callId },
          data: {
            coordinator_id: coordinatorId,
            status: 'rejected',
            rejection_reason: rejectReason,
            ended_at: new Date(),
          },
        }),
        call.log_id
          ? this.prisma.log.update({
              where: { id: call.log_id },
              data: {
                status: 'cancelled',
                description: `Rejected by coordinator. Reason: ${rejectReason || 'None given'}`,
              },
            })
          : Promise.resolve(),
      ]).catch((err) =>
        this.logger.error('Failed to update call/log on reject:', err),
      );

      return { success: true };
    }
  }

  private async handleGlobalTimeout(callId: string) {
    this.logger.log(`Global timeout reached for Call ${callId}`);
    const state = this.activeRoutings.get(callId);
    this.activeRoutings.delete(callId);

    if (state && state.assignedCoordinatorId) {
      this.server
        .to(`coordinator_${state.assignedCoordinatorId}`)
        .emit('call_ended', { callId, endedBy: 'system' });
    }

    this.server.to(`call_${callId}`).emit('routing_timeout', {
      callId,
      message: 'No coordinators available at the moment.',
    });

    const call = await this.prisma.call.findUnique({ where: { id: callId } });

    Promise.all([
      this.prisma.call.update({
        where: { id: callId },
        data: { status: 'missed', ended_at: new Date() },
      }),
      call && call.log_id
        ? this.prisma.log.update({
            where: { id: call.log_id },
            data: {
              status: 'cancelled',
              cancellation_reason: 'Missed emergency call. Timeout reached.',
              description: `Assignment attempts: ${state?.attemptedCoordinators.length || 0}. Rejections: ${state?.rejectedCoordinators.length || 0}.`,
            },
          })
        : Promise.resolve(),
    ]).catch((err) =>
      this.logger.error('Failed to update call/log on global timeout:', err),
    );
  }

  async endCall(
    callId: string,
    endedBy: 'resident' | 'coordinator' | 'system' = 'system',
  ) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) return;

    await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'ended', ended_at: new Date() },
    });

    if (call.coordinator_id) {
      this.setCoordinatorStatus(call.coordinator_id, 'available');
      this.server
        .to(`coordinator_${call.coordinator_id}`)
        .emit('call_ended', { callId, endedBy });
    }

    this.server.to(`call_${callId}`).emit('call_ended', { callId, endedBy });
  }

  getDebugState() {
    return {
      coordinators: Array.from(this.coordinators.values()),
      activeRoutings: Array.from(this.activeRoutings.values()),
    };
  }

  async getCallDetails(callId: string) {
    return this.prisma.call.findUnique({ where: { id: callId } });
  }

  async saveMessage(
    callId: string,
    logId: string | undefined,
    senderType: 'resident' | 'coordinator',
    type: 'text' | 'image' | 'file',
    text?: string,
    attachmentUrl?: string,
    imageKeys?: string[],
  ) {
    const message = await this.prisma.message.create({
      data: {
        call_id: callId,
        log_id: logId,
        sender_type: senderType,
        type,
        text,
        attachment_url: attachmentUrl,
        image_keys: imageKeys ? imageKeys.filter(Boolean) : undefined,
      },
    });

    this.server.to(`call_${callId}`).emit('chat_message', message);
    return message;
  }

  async updateCallLocation(
    callId: string,
    latitude: number,
    longitude: number,
  ) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) return;

    await this.prisma.call.update({
      where: { id: callId },
      data: { latitude, longitude },
    });

    if (call.log_id) {
      // Resolve barangay from GPS coordinates and persist alongside lat/lng.
      const barangay = this.barangayResolverService.resolveBarangay(latitude, longitude);
      await this.prisma.log.update({
        where: { id: call.log_id },
        data: {
          latitude,
          longitude,
          // Always overwrite barangay with latest resolved value so the
          // map polygon shading and barangay filter stay accurate.
          ...(barangay !== null && { barangay }),
        },
      });
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
    }
  }
}
