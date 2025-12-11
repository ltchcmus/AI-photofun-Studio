import axiosClient from "./axiosClient";

const CURRENT_USER_ENDPOINT = "/api/v1/identity/users/me";
const USER_BY_ID_ENDPOINT = "/api/v1/identity/users/get";
const UPLOAD_AVATAR_ENDPOINT = "/api/v1/identity/users/upload-avatar";
const PROFILE_ENDPOINT = "/api/v1/profiles/my-profile";
const UPDATE_PROFILE_ENDPOINT = "/api/v1/profiles/update";
const VERIFY_PROFILE_ENDPOINT = "/api/v1/profiles/verify-profile";
const RESEND_VERIFY_EMAIL_ENDPOINT = "/api/v1/profiles/resend-verify-email";
const ACTIVATE_PROFILE_ENDPOINT = "/api/v1/profiles/activate-profile";

const fetchMe = () => axiosClient.get(CURRENT_USER_ENDPOINT);

export const userApi = {
  getMe: fetchMe,
  // Temporary alias to avoid regressions in legacy code paths
  getCurrentUser: fetchMe,

  getUserById: (userId) => axiosClient.get(`${USER_BY_ID_ENDPOINT}/${userId}`),

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return axiosClient.post(UPLOAD_AVATAR_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getMyProfile: () => axiosClient.get(PROFILE_ENDPOINT),

  updateProfile: (profilePayload) =>
    axiosClient.put(UPDATE_PROFILE_ENDPOINT, profilePayload),

  sendVerification: () => axiosClient.get(VERIFY_PROFILE_ENDPOINT),

  resendVerification: () => axiosClient.get(RESEND_VERIFY_EMAIL_ENDPOINT),

  activateProfile: (code) =>
    axiosClient.patch(`${ACTIVATE_PROFILE_ENDPOINT}/${code}`),

  // Get pending join group requests (for group admins)
  getMemberRequests: (page = 1, size = 20) =>
    axiosClient.patch("/api/v1/identity/users/get-request-join-group", null, {
      params: { page, size },
    }),

  // Get groups that user has joined
  getMyGroups: (page = 1, size = 20) =>
    axiosClient.get("/api/v1/identity/users/get-group-joined", {
      params: { page, size },
    }),
};
