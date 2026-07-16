/**
 * Personnel API client
 *
 * All functions in this file communicate with the real NestJS backend.
 * The base URL is read from NEXT_PUBLIC_API_URL (defaults to http://localhost:3001/api).
 * Credentials (the HTTP-only access_token cookie) are included automatically
 * via `credentials: 'include'` so the backend JWT guard can authenticate requests.
 *
 * Endpoints consumed:
 *   GET  /api/personnel         — list personnel grouped by role
 *   POST /api/personnel         — create a new personnel account
 *   GET  /api/roles             — fetch available roles for the create-form dropdown
 */

// ---------------------------------------------------------------------------
// Base URL helper
// ---------------------------------------------------------------------------

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  // Strip trailing /api if already present to avoid double /api/api
  return raw.replace(/\/api\/?$/, "") + "/api";
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type PersonnelStatus = "active" | "pending_activation" | "inactive";

/** A single personnel member as returned by GET /api/personnel */
export interface PersonnelItem {
  id: string;
  name: string;
  email: string;
  status: PersonnelStatus;
  /** ISO-8601 timestamp of account creation */
  createdAt: string;
  // Optional fields that may be present in the future
  phone?: string;
  location?: string;
  lastActive?: string;
}

/** A role group returned by GET /api/personnel */
export interface PersonnelGroup {
  /** Display name, e.g. "Coordinator" */
  role: string;
  /** Lowercase key, e.g. "coordinator" — used as a React key */
  roleKey: string;
  count: number;
  personnel: PersonnelItem[];
}

export interface GetPersonnelResponse {
  groups: PersonnelGroup[];
}

/** Payload for POST /api/personnel */
export interface CreatePersonnelPayload {
  name: string;
  email: string;
  /** UUID of the role record in the DB */
  role_id: string;
}

/** Successful response body from POST /api/personnel */
export interface CreatedPersonnel {
  id: string;
  name: string;
  email: string;
  status: PersonnelStatus;
  role_id: string;
}

/** A role record from GET /api/roles */
export interface RoleOption {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// GET /api/personnel
// ---------------------------------------------------------------------------

/**
 * Fetch the personnel list grouped by role.
 *
 * @param search  Optional name/email substring filter (passed to the backend).
 * @param status  Optional status filter: "active" | "pending_activation" | "inactive".
 *
 * The backend performs the filtering server-side, so we pass query params rather
 * than filtering client-side, keeping the network payload small.
 */
export async function getPersonnel(
  search?: string,
  status?: string,
): Promise<GetPersonnelResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  const qs = params.toString();
  const url = `${apiBase()}/personnel${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    // Include the HTTP-only cookie so the JWT guard can authenticate this call
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `GET /personnel failed (${res.status})`);
  }

  const json = await res.json();

  // The backend wraps responses in ApiResponse.success({ groups })
  // Shape: { data: { groups: [...] }, ... }
  // Map each group to ensure `roleKey` is present (derive from `role` name if missing)
  const rawGroups: Omit<PersonnelGroup, "roleKey">[] =
    json?.data?.groups ?? json?.groups ?? [];

  const groups: PersonnelGroup[] = rawGroups.map((g) => ({
    ...g,
    roleKey:
      (g as PersonnelGroup).roleKey ?? g.role.toLowerCase().replace(/\s+/g, "_"),
  }));

  return { groups };
}

// ---------------------------------------------------------------------------
// POST /api/personnel
// ---------------------------------------------------------------------------

/**
 * Create a new personnel account.
 *
 * The backend will:
 *   1. Validate the payload (400 on missing/invalid fields)
 *   2. Check email uniqueness (409 on duplicate)
 *   3. Check role_id exists (404 on unknown role)
 *   4. Persist User + UserRole + UserToken in a single transaction
 *   5. Send an activation email to the new user
 *
 * Throws a descriptive Error on any non-2xx response.
 */
export async function createPersonnel(
  payload: CreatePersonnelPayload,
): Promise<CreatedPersonnel> {
  const res = await fetch(`${apiBase()}/personnel`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface the backend's validation message(s) to the UI
    const msg =
      Array.isArray(json?.message)
        ? json.message.join(", ")
        : (json?.message ?? `POST /personnel failed (${res.status})`);
    throw new Error(msg);
  }

  // Shape: { data: { id, name, email, status, role_id }, ... }
  return json?.data ?? json;
}

// ---------------------------------------------------------------------------
// GET /api/roles
// ---------------------------------------------------------------------------

/**
 * Fetch available roles for the "Add Personnel" form dropdown.
 *
 * This endpoint is RBAC-guarded (admin only) on the backend, so it will
 * return 401/403 for unauthenticated or non-admin requests.
 */
export async function getRoles(): Promise<RoleOption[]> {
  const res = await fetch(`${apiBase()}/roles`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `GET /roles failed (${res.status})`);
  }

  const json = await res.json();
  // Shape: { data: [{ id, name }, ...], ... }
  return json?.data ?? json ?? [];
}

// ---------------------------------------------------------------------------
// POST /api/personnel/activate
// ---------------------------------------------------------------------------

/**
 * Activate a personnel account by consuming a token and setting a password.
 */
export async function activateAccount(payload: { token: string; password: string }) {
  const res = await fetch(`${apiBase()}/personnel/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      Array.isArray(json?.message)
        ? json.message.join(", ")
        : (json?.message ?? `POST /personnel/activate failed (${res.status})`);
    throw new Error(msg);
  }

  return json?.data ?? json;
}
