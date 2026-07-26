import apiClient from '@/lib/api-client';

export const shadowBansApi = {
  getStatus: (callId: string): Promise<boolean> =>
    apiClient.get(`/shadow-bans/call/${callId}/status`).then((res) => res.data.data.isBanned),

  toggleBan: (callId: string, action: 'ban' | 'unban', reason: string): Promise<void> =>
    apiClient.post(`/shadow-bans/call/${callId}/toggle`, { action, reason }).then((res) => res.data),
};
