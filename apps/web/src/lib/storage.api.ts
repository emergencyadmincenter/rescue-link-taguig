import apiClient from "./api-client";

export const storageApi = {
  uploadPrivateFile: async (file: File): Promise<{ key: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/storage/private/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  getPrivateAccessUrl: async (key: string): Promise<{ url: string }> => {
    const response = await apiClient.get("/storage/private/access", {
      params: { key },
    });
    return response.data.data;
  },
};
