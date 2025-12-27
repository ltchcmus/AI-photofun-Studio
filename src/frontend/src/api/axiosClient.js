import axios from "axios";
import tokenManager from "./tokenManager";

// Use environment variable for production, fallback to relative URL for dev
const baseURL = import.meta.env.VITE_API_GATEWAY || "";

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Rate limiting interceptor - 5 calls per 2 seconds
axiosClient.interceptors.request.use(
  async (config) => {
    // Wait for rate limit slot

    // Get token from memory instead of localStorage
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Surface 401 so callers can redirect to login if needed
      console.warn("Unauthorized request", error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
