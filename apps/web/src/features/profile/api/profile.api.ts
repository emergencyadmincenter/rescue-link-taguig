import apiClient from "@/lib/api-client";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  address?: string;
  avatar_url?: string;
  status: string;
  created_at: string;
  user_roles: Array<{ role: { name: string } }>;
}

export interface UpdateProfileData {
  name?: string;
  phone_number?: string;
  address?: string;
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>("/profile");
    if (!response.data.success || !response.data.data) {
       throw new Error(response.data.error?.message || "Failed to get profile");
    }
    return response.data.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.patch<ApiResponse<UserProfile>>("/profile", data);
    if (!response.data.success || !response.data.data) {
       throw new Error(response.data.error?.message || "Failed to update profile");
    }
    return response.data.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<{ avatar_url: string }>>(
      "/profile/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    if (!response.data.success || !response.data.data) {
       throw new Error(response.data.error?.message || "Failed to upload avatar");
    }
    return response.data.data;
  },
};
