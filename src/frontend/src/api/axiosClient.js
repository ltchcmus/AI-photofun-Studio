import axios from "axios";
import rateLimiter from "../utils/rateLimiter";
import tokenManager from "./tokenManager";

// Use environment variable for production, fallback to relative URL for dev
const baseURL = import.meta.env.VITE_API_GATEWAY || "";

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Rate limiting + Auth token interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    // Wait for rate limit slot
    await rateLimiter.waitForSlot();

    // Get token from memory
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints to prevent infinite loop
    const isAuthEndpoint =
      originalRequest?.url?.includes("/login") ||
      originalRequest?.url?.includes("/register") ||
      originalRequest?.url?.includes("/refresh");

    // Handle 401 Unauthorized - try to refresh token
    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint - uses HttpOnly cookie
        const refreshResponse = await axios.get(
          `${baseURL}/api/v1/identity/auth/refresh-token`,
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data?.result?.accessToken ||
          (typeof refreshResponse.data?.result === "string"
            ? refreshResponse.data.result
            : null);

        if (newAccessToken) {
          tokenManager.setToken(newAccessToken);
          processQueue(null, newAccessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
      } catch (refreshError) {
        // Refresh failed - clear token and notify logout
        processQueue(refreshError, null);
        tokenManager.clearToken();
        console.warn("Token refresh failed, user needs to login again");
        // Dispatch logout event for AuthContext to handle
        window.dispatchEvent(new Event("auth-logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log other 401s
    if (error.response?.status === 401) {
      console.warn("Unauthorized request", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;


