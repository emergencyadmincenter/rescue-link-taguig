import apiClient from '@/lib/api-client';
import {
  Log,
  LogsQueryParams,
  PaginatedResponse,
  StatusCounts,
  CreateLogPayload,
  UpdateLogPayload,
  Resource,
} from '../types/logs.types';

export const logsApi = {
  getLogs: (params?: LogsQueryParams): Promise<PaginatedResponse<Log>> =>
    apiClient.get('/logs', { params }).then((res) => res.data.data),

  getLog: (id: string): Promise<Log> =>
    apiClient.get(`/logs/${id}`).then((res) => res.data.data),

  createLog: (data: CreateLogPayload): Promise<Log> =>
    apiClient.post('/logs', data).then((res) => res.data.data),

  updateLog: (id: string, data: UpdateLogPayload): Promise<Log> =>
    apiClient.patch(`/logs/${id}`, data).then((res) => res.data.data),

  getStatusCounts: (): Promise<StatusCounts> =>
    apiClient.get('/logs/status-counts').then((res) => res.data.data),

  getResources: (): Promise<Resource[]> =>
    apiClient.get('/logs/resources').then((res) => res.data.data),

  createEmergency: async (data: { communicationMethod: 'voice' | 'chat'; latitude?: number; longitude?: number }): Promise<{ id: string }> => {
    const { getDeviceIdentifiers } = await import('@/lib/device-identification');
    const identifiers = getDeviceIdentifiers();
    const payload = { ...data, ...identifiers };
    return apiClient.post('/calls/emergency', payload).then((res) => res.data.data);
  },

  finalizeCall: (callId: string, data: CreateLogPayload): Promise<Log> =>
    apiClient.post(`/calls/${callId}/finalize`, data).then((res) => res.data.data),

  getCallDetails: (callId: string): Promise<any> =>
    apiClient.get(`/calls/${callId}`).then((res) => res.data.data),
};
