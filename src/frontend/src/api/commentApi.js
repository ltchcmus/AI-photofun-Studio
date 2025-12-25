import axios from "axios";

// Comment API URL: production dùng VITE_COMMENT_API_URL, local dùng proxy qua vite
const COMMENT_API_BASE = import.meta.env.VITE_COMMENT_API_URL || "";
const COMMENTS_BASE_URL = `${COMMENT_API_BASE}/api/v1/comments`;

const commentAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

commentAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const commentApi = {
  getCommentsByPost: (postId) => {
    if (!postId) {
      return Promise.reject(new Error("postId is required"));
    }

    return commentAxios.get(`${COMMENTS_BASE_URL}/post/${postId}`);
  },

  createComment: (payload) => commentAxios.post(COMMENTS_BASE_URL, payload),
};

export default commentApi;
