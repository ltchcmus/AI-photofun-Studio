import axios from "axios";
import rateLimiter from "../utils/rateLimiter";

const axiosClient = axios.create({
  baseURL: "", // Use relative URL to leverage Vite proxy
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Rate limiting interceptor - 5 calls per 2 seconds
axiosClient.interceptors.request.use(
  async (config) => {
    // Wait for rate limit slot
    await rateLimiter.waitForSlot();

    const token = localStorage.getItem("token");
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
