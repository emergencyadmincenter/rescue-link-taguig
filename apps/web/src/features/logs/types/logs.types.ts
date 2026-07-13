export type LogStatus = 'active' | 'dispatched' | 'resolved' | 'cancelled';
export type LogSource = 'manual' | 'voice_call' | 'chat';
export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
export type MessageSenderType = 'resident' | 'coordinator' | 'system';
export type MessageType = 'text' | 'image' | 'file';
export type ResourceCategory = 'responder' | 'medical' | 'relief' | 'utility';
export type CommunicationMethod = 'voice' | 'chat';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string | null;
}

export interface LogResourceAssignment {
  log_id: string;
  resource_id: string;
  resource: Resource;
}

export interface Call {
  id: string;
  log_id: string;
  coordinator_id: string | null;
  coordinator?: User;
  communication_method: CommunicationMethod;
  status: CallStatus;
  rejection_reason: string | null;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
}

export interface Message {
  id: string;
  log_id: string;
  sender_type: MessageSenderType;
  type: MessageType;
  text: string | null;
  attachment_url: string | null;
  created_at: string;
}

export interface Log {
  id: string;
  reference_no: string;
  status: LogStatus;
  source: LogSource;
  caller_name: string | null;
  caller_contact: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  cancellation_reason: string | null;
  last_activity_at: string | null;
  channels: string[];
  created_at: string;
  updated_at: string;
  resident_visible_until: string | null;
  resolved_at: string | null;
  assigned_coordinator_id: string | null;
  assigned_coordinator: User | null;
  created_by_coordinator_id: string | null;
  created_by_coordinator: User | null;
  calls: Call[];
  messages: Message[];
  resource_assignments: LogResourceAssignment[];
  _count?: { messages: number };
}

export interface LogsQueryParams {
  search?: string;
  status?: LogStatus;
  source?: LogSource;
  assigned_coordinator_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StatusCounts {
  total: number;
  active: number;
  dispatched: number;
  resolved: number;
  cancelled: number;
}

export interface CreateLogPayload {
  caller_name: string;
  caller_contact: string;
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  resource_ids?: string[];
  channels?: string[];
}

export interface UpdateLogPayload {
  caller_name?: string;
  caller_contact?: string;
  address?: string;
  description?: string;
  status?: LogStatus;
  latitude?: number;
  longitude?: number;
  cancellation_reason?: string;
  resource_ids?: string[];
  channels?: string[];
  assigned_coordinator_id?: string;
}
