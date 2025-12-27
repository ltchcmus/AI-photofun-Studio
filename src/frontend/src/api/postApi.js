import axiosClient from "./axiosClient";

const FEED_ENDPOINT = "/api/v1/posts/get-all";
const MY_POSTS_ENDPOINT = "/api/v1/posts/my-posts";
const CREATE_POST_ENDPOINT = "/api/v1/posts/create";
const CREATE_VIDEO_POST_ENDPOINT = "/api/v1/posts/create-video";
const LIKE_POST_ENDPOINT = "/api/v1/identity/users/click-like";
const CHECK_LIKED_POSTS_ENDPOINT = "/api/v1/identity/users/check-liked-posts";
const POSTS_BY_USER_ENDPOINT = "/api/v1/posts/user";

export const postApi = {
  getFeed: ({ page = 1, size = 20 } = {}) =>
    axiosClient.get(`${FEED_ENDPOINT}?page=${page}&size=${size}`),

  getMyPosts: ({ page = 1, size = 5 } = {}) =>
    axiosClient.get(`${MY_POSTS_ENDPOINT}?page=${page}&size=${size}`),

  getPostsByUserId: (userId, { page = 1, size = 20 } = {}) =>
    axiosClient.get(
      `${POSTS_BY_USER_ENDPOINT}/${userId}?page=${page}&size=${size}`
    ),

  createPost: (formData) =>
    axiosClient.post(CREATE_POST_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  createVideoPost: (formData) =>
    axiosClient.post(CREATE_VIDEO_POST_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  likePost: (postId) => axiosClient.post(`${LIKE_POST_ENDPOINT}/${postId}`),

  checkLikedPosts: (postIds = []) =>
    axiosClient.post(CHECK_LIKED_POSTS_ENDPOINT, postIds),
};

