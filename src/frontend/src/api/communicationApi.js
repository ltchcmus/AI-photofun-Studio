import axiosClient from "./axiosClient";

const BASE_URL = "/api/v1/communications";

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
    axiosClient.get(`${BASE_URL}/communications/get-messages`, {
      params: { receiverId, page, size },
    }),

  // Groups
  createGroup: (groupName) =>
    axiosClient.post(`${BASE_URL}/groups/create`, null, {
      params: { groupName },
    }),

  getAllGroups: (page = 1, size = 10) =>
    axiosClient.get(`${BASE_URL}/groups/all`, {
      params: { page, size },
    }),

  getGroupMessages: (groupId, page = 1, size = 20) =>
    axiosClient.get(`${BASE_URL}/groups/${groupId}/messages`, {
      params: { page, size },
    }),

  getGroupMembers: (groupId) =>
    axiosClient.get(`${BASE_URL}/groups/${groupId}/members`),

  joinGroup: (groupId) =>
    axiosClient.post(`${BASE_URL}/groups/${groupId}/join`),

  leaveGroup: (groupId) =>
    axiosClient.post(`${BASE_URL}/groups/${groupId}/leave`),
};
