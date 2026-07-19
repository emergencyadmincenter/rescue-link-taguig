export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePermissionPayload {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}
