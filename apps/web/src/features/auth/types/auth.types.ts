export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
}

export interface SignInResponse {
  token: string;
  user: AuthUser;
}

// Re-export shared schema type for convenience
export type { SignInFormData } from "shared-schemas/auth";
