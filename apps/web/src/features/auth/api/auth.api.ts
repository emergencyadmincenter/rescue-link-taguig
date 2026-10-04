import apiClient from "@/lib/api-client";
import type { SignInFormData } from "shared-schemas/auth";
import type { SignInResponse } from "@/features/auth/types/auth.types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Authenticate a user with email and password.
 * POST /api/auth/sign-in
 */
export async function signIn(data: SignInFormData): Promise<SignInResponse> {
  const response = await apiClient.post<ApiResponse<SignInResponse>>(
    "/auth/sign-in",
    data,
  );
  
  if (!response.data.success || !response.data.data) {
     throw new Error(response.data.error?.message || "Sign-in failed");
  }
  
  return response.data.data;
}

/**
 * Sign out the current user.
 * POST /api/auth/sign-out
 */
export async function signOut(): Promise<void> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    "/auth/sign-out"
  );
  
  if (!response.data.success) {
     throw new Error(response.data.error?.message || "Sign-out failed");
  }
}
