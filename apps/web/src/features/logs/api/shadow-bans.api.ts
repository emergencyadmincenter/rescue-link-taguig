import apiClient from "@/lib/api-client";

export type ShadowBanViolationCategory =
  | "fake_rescue_call"
  | "spam"
  | "fraudulent_activity"
  | "abusive_malicious_use"
  | "impersonation_identity_misuse"
  | "coordinated_system_abuse"
  | "other";

export type ShadowBanSeverity = "low" | "high" | "critical";

export interface ShadowBanRecord {
  id: string;
  reason: string;
  violation_category: ShadowBanViolationCategory;
  severity: ShadowBanSeverity;
  details: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  unbanned_at: string | null;
  unban_reason: string | null;
  created_by: { id: string; name: string } | null;
  unbanned_by: { id: string; name: string } | null;
}

export interface ShadowBanStatus {
  isBanned: boolean;
  current: ShadowBanRecord | null;
  history: ShadowBanRecord[];
}

export const shadowBansApi = {
  getStatus: (callId: string): Promise<ShadowBanStatus> =>
    apiClient
      .get(`/shadow-bans/call/${callId}/status`)
      .then((res) => res.data.data),

  toggleBan: (
    callId: string,
    action: "ban" | "unban",
    reason: string,
    violationCategory?: ShadowBanViolationCategory,
    severity?: ShadowBanSeverity,
    details?: string,
  ): Promise<void> =>
    apiClient
      .post(`/shadow-bans/call/${callId}/toggle`, {
        action,
        reason,
        violationCategory,
        severity,
        details,
      })
      .then((res) => res.data),
};
