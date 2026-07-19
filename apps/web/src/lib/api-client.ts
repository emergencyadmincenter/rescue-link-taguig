import axios from "axios";


const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/api\/?$/, "") + "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Handle response errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      let message = "An unexpected error occurred. Please try again later.";

      // Check if it's our controlled custom ApiResponse format
      if (error.response.data && error.response.data.success === false && error.response.data.error?.message) {
        message = error.response.data.error.message;
      } else {
        // Map generic HTTP status codes to user-friendly messages
        switch (error.response.status) {
          case 400:
            message = "The request was invalid. Please check your input.";
            break;
          case 401:
            message = "Your session has expired or you are unauthorized. Please sign in again.";
            break;
          case 403:
            message = "You do not have permission to perform this action.";
            break;
          case 404:
            message = "The requested resource could not be found.";
            break;
          case 429:
            message = "Too many requests. Please try again in a moment.";
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            message = "We're unable to connect to the server. Please try again in a moment.";
            break;
        }
      }

      // Handle 401 Unauthorized globally by redirecting to sign-in
      if (error.response.status === 401 && typeof window !== "undefined") {
        if (!window.location.pathname.includes("/sign-in")) {
          window.location.href = "/sign-in";
        }
      }

      // Suppress the expected invalid-credential sign-in noise, but keep other API errors visible.
      const requestUrl = String(error.config?.url ?? "");
      const isExpectedSignInFailure =
        error.response.status === 401 && requestUrl.includes("/auth/sign-in");

      if (!isExpectedSignInFailure) {
        console.error("[API Error]", {
          status: error.response.status,
          url: error.config?.url,
          data: error.response.data,
        });
      }
    //until here 
      return Promise.reject(
        new Error(Array.isArray(message) ? message[0] : message),
      );
    }

    if (error.request) {
      // Request was made but no response received
      return Promise.reject(
        new Error("Unable to reach the server. Please check your connection."),
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
