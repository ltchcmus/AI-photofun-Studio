import axiosClient from "./axiosClient";

const BASE_URL = "/api/v1/communications";

// File upload URL: production uses VITE_FILE_UPLOAD_URL, dev uses Vite proxy
const FILE_UPLOAD_BASE_URL = import.meta.env.VITE_FILE_UPLOAD_URL || "";

export const communicationApi = {
  // Conversations
  getMyConversations: () =>
    axiosClient.get(`${BASE_URL}/conversations/my-conversations`),

  addConversation: (receiverId) =>
    axiosClient.post(`${BASE_URL}/conversations/add?receiverId=${receiverId}`),

  deleteConversation: (receiverId) =>
    axiosClient.delete(
      `${BASE_URL}/conversations/delete?receiverId=${receiverId}`
    ),

  // 1-1 Messages
  getMessages: (receiverId, page = 1, size = 20) =>
    axiosClient.get(`${BASE_URL}/get-messages`, {
      params: { receiverId, page, size },
    }),

  // Groups - Management
  createGroup: (groupName, imageUrl = null) =>
    axiosClient.post(`${BASE_URL}/groups/create`, null, {
      params: { groupName, imageUrl },
    }),

  getAllGroups: (page = 1, size = 10) =>
    axiosClient.get(`${BASE_URL}/groups/all`, {
      params: { page, size },
    }),

  getGroupDetail: (groupId) => axiosClient.get(`${BASE_URL}/groups/${groupId}`),

  updateGroup: (groupId, data) =>
    axiosClient.patch(`${BASE_URL}/groups/${groupId}`, data),

  uploadGroupAvatar: (groupId, formData) =>
    axiosClient.post(`${BASE_URL}/groups/${groupId}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Groups - Messages
  getGroupMessages: (groupId, page = 1, size = 20) =>
    axiosClient.get(`${BASE_URL}/groups/${groupId}/messages`, {
      params: { page, size },
    }),

  // Groups - Membership
  requestJoinGroup: (groupId) =>
    axiosClient.post(`${BASE_URL}/groups/request-join-group`, null, {
      params: { groupId },
    }),

  modifyRequestStatus: (requestId, groupId, accept) =>
    axiosClient.patch(`${BASE_URL}/groups/modify-request-status`, null, {
      params: { requestId, groupId, accept },
    }),

  leaveGroup: (groupId) =>
    axiosClient.delete(`${BASE_URL}/groups/${groupId}/leave`),

  removeMember: (groupId, memberId) =>
    axiosClient.delete(`${BASE_URL}/groups/${groupId}/members/${memberId}`),

  getGroupMembers: (groupId) =>
    axiosClient.get(`${BASE_URL}/groups/${groupId}/members`),

  // File Upload - Production uses VITE_FILE_UPLOAD_URL, dev uses Vite proxy
  uploadChatImage: async (file) => {
    const formData = new FormData();
    formData.append(
      "id",
      `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    formData.append("image", file);

    // Production: VITE_FILE_UPLOAD_URL/api/v1/file/uploads
    // Dev: /api/file-upload (Vite proxy rewrites to file-service-cdal.onrender.com/api/v1/file/uploads)
    const uploadUrl = FILE_UPLOAD_BASE_URL
      ? `${FILE_UPLOAD_BASE_URL}/api/v1/file/uploads`
      : "/api/file-upload";

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json();
  },

  // Video Upload - Production uses VITE_FILE_UPLOAD_URL, dev uses Vite proxy
  uploadChatVideo: async (file) => {
    const formData = new FormData();
    const videoId = `video_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    formData.append("id", videoId);
    formData.append("video", file);

    console.log("📤 Uploading video to file service...");
    console.log("📤 Uploading video:", {
      id: videoId,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });

    // Production: VITE_FILE_UPLOAD_URL/api/v1/file/uploads-video-file
    // Dev: /api/file-service/api/v1/file/uploads-video-file (Vite proxy)
    const uploadUrl = FILE_UPLOAD_BASE_URL
      ? `${FILE_UPLOAD_BASE_URL}/api/v1/file/uploads-video-file`
      : "/api/file-service/api/v1/file/uploads-video-file";

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const responseData = await response.json();
    console.log("📥 Upload response:", response.status, responseData);

    if (!response.ok) {
      console.error("❌ Upload failed:", responseData);
      throw new Error(responseData.message || "Failed to upload video");
    }

    return responseData;
  },
};
