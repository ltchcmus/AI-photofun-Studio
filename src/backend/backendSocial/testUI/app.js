// Global Variables
let accessToken = localStorage.getItem("accessToken") || "";
let refreshToken = localStorage.getItem("refreshToken") || "";
let userId = localStorage.getItem("userId") || "";
let commentsSocket = null;
let communicationSocket = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateAuthStatus();
  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// Tab Management
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

// Helper Functions
function getApiGateway() {
  return document.getElementById("apiGatewayUrl").value;
}

function getCommentsUrl() {
  return document.getElementById("commentsUrl").value;
}

function getCommunicationSocketUrl() {
  return document.getElementById("communicationSocketUrl").value;
}

function updateAuthStatus() {
  const statusEl = document.getElementById("authStatus");
  const logoutBtn = document.getElementById("logoutBtn");

  if (accessToken) {
    statusEl.textContent = `✅ Authenticated (User: ${userId || "Unknown"})`;
    statusEl.style.color = "#28a745";
    logoutBtn.style.display = "block";
  } else {
    statusEl.textContent = "❌ Not Authenticated";
    statusEl.style.color = "#dc3545";
    logoutBtn.style.display = "none";
  }
}

function displayResponse(elementId, data) {
  const el = document.getElementById(elementId);
  el.textContent = JSON.stringify(data, null, 2);
  el.scrollTop = 0;
}

function addSocketLog(message, type = "info") {
  const logContent = document.getElementById("socketLogContent");
  const time = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${type}`;
  logEntry.innerHTML = `<span class="log-time">[${time}]</span>${message}`;
  logContent.appendChild(logEntry);
  logContent.scrollTop = logContent.scrollHeight;
}

async function makeRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

async function uploadFile(url, fileInputId, additionalData = {}) {
  const fileInput = document.getElementById(fileInputId);
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  Object.keys(additionalData).forEach((key) => {
    formData.append(key, additionalData[key]);
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== AUTHENTICATION ====================

async function register() {
  const data = {
    username: document.getElementById("regUsername").value,
    email: document.getElementById("regEmail").value,
    password: document.getElementById("regPassword").value,
    confirmPass: document.getElementById("regConfirmPass").value,
    fullName: document.getElementById("regFullName").value,
    roles: ["USER"],
  };

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/register`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  displayResponse("authResponse", result);
}

async function login() {
  const data = {
    usernameOrEmail: document.getElementById("loginUsername").value,
    password: document.getElementById("loginPassword").value,
  };

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/auth/login`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (result.code === 1000) {
    accessToken = result.result.accessToken;
    refreshToken = result.result.refreshToken;
    userId = result.result.userId;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("userId", userId);

    updateAuthStatus();
  }

  displayResponse("authResponse", result);
}

async function logout() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/auth/logout`,
    { method: "GET" }
  );

  accessToken = "";
  refreshToken = "";
  userId = "";

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");

  updateAuthStatus();
  displayResponse("authResponse", { message: "Logged out successfully" });
}

async function introspectToken() {
  const token = document.getElementById("introspectToken").value || accessToken;

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/auth/introspect/${token}`,
    { method: "GET" }
  );

  displayResponse("authResponse", result);
}

async function refreshToken() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/auth/refresh/${refreshToken}`,
    { method: "GET" }
  );

  if (result.code === 1000 && result.result) {
    accessToken = result.result;
    localStorage.setItem("accessToken", accessToken);
    updateAuthStatus();
  }

  displayResponse("authResponse", result);
}

// ==================== USER MANAGEMENT ====================

async function getMyInfo() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/me`,
    { method: "GET" }
  );
  displayResponse("userResponse", result);
}

async function getAllUsers() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/get-all`,
    { method: "GET" }
  );
  displayResponse("userResponse", result);
}

async function getUserById() {
  const userId = document.getElementById("getUserId").value;
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/get/${userId}`,
    { method: "GET" }
  );
  displayResponse("userResponse", result);
}

async function changePassword() {
  const data = {
    oldPassword: document.getElementById("oldPassword").value,
    newPassword: document.getElementById("newPassword").value,
    confirmPassword: document.getElementById("confirmNewPassword").value,
  };

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/change-password`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  displayResponse("userResponse", result);
}

async function uploadAvatar() {
  const result = await uploadFile(
    `${getApiGateway()}/api/v1/identity/users/upload-avatar`,
    "avatarFile"
  );
  displayResponse("userResponse", result);
}

async function checkLoginByGoogle() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/check-login-by-google`,
    { method: "GET" }
  );
  displayResponse("userResponse", result);
}

// Toggle like/unlike post (Identity Service API)
async function toggleLikePost() {
  const postId = document.getElementById("likePostId").value;
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/click-like/${postId}`,
    { method: "PATCH" }
  );
  displayResponse("userResponse", result);
}

// ==================== GROUP MANAGEMENT ====================

async function getAllGroups() {
  const result = await makeRequest(
    `${getApiGateway()}/communications/groups/all?page=1&size=20`,
    { method: "GET" }
  );
  displayResponse("groupResponse", result);
}

async function getMyGroups() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/get-group-joined?page=1&size=20`,
    { method: "GET" }
  );
  displayResponse("groupResponse", result);
}

async function getGroupDetail() {
  const groupId = document.getElementById("viewGroupId").value;
  const result = await makeRequest(
    `${getApiGateway()}/communications/groups/${groupId}`,
    { method: "GET" }
  );
  displayResponse("groupResponse", result);
}

async function createGroup() {
  const name = document.getElementById("createGroupName").value;
  const image = document.getElementById("createGroupImage").value;

  const url = `${getApiGateway()}/communications/groups/create?groupName=${encodeURIComponent(
    name
  )}${image ? "&imageUrl=" + encodeURIComponent(image) : ""}`;

  const result = await makeRequest(url, { method: "POST" });
  displayResponse("groupResponse", result);
}

async function updateGroup() {
  const groupId = document.getElementById("updateGroupId").value;
  const data = {
    name: document.getElementById("updateGroupName").value,
    description: document.getElementById("updateGroupDesc").value,
  };

  const result = await makeRequest(
    `${getApiGateway()}/communications/groups/${groupId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  displayResponse("groupResponse", result);
}

async function uploadGroupAvatar() {
  const groupId = document.getElementById("uploadAvatarGroupId").value;
  const result = await uploadFile(
    `${getApiGateway()}/communications/groups/${groupId}/avatar`,
    "groupAvatarFile"
  );
  displayResponse("groupResponse", result);
}

async function requestJoinGroup() {
  const groupId = document.getElementById("joinGroupId").value;
  const result = await makeRequest(
    `${getApiGateway()}/communications/groups/request-join-group?groupId=${groupId}`,
    { method: "POST" }
  );
  displayResponse("groupResponse", result);
}

async function getMemberRequests() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/get-request-join-group?page=1&size=20`,
    { method: "PATCH" }
  );
  displayResponse("groupResponse", result);
}

async function modifyRequestStatus() {
  const requestId = document.getElementById("acceptRequestId").value;
  const groupId = document.getElementById("acceptGroupId").value;
  const status = document.getElementById("acceptStatus").value;

  const url = `${getApiGateway()}/communications/groups/modify-request-status?requestId=${requestId}&groupId=${groupId}&accept=${status}`;

  const result = await makeRequest(url, { method: "PATCH" });
  displayResponse("groupResponse", result);
}

// ==================== PROFILE ====================

async function getMyProfile() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/profiles/my-profile`,
    { method: "GET" }
  );
  displayResponse("profileResponse", result);
}

async function updateProfile() {
  const data = {
    fullName: document.getElementById("updateFullName").value,
    phone: document.getElementById("updatePhone").value,
    email: document.getElementById("updateEmail").value,
    avatarUrl: document.getElementById("updateAvatarUrl").value,
    verified: false,
  };

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/profiles/update`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  displayResponse("profileResponse", result);
}

async function checkVerify() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/profiles/check-verify`,
    { method: "GET" }
  );
  displayResponse("profileResponse", result);
}

async function verifyProfile() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/profiles/verify-profile`,
    { method: "GET" }
  );
  displayResponse("profileResponse", result);
}

async function activateProfile() {
  const code = document.getElementById("verifyCode").value;
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/profiles/activate-profile/${code}`,
    { method: "PATCH" }
  );
  displayResponse("profileResponse", result);
}

// ==================== POSTS ====================

async function getAllPosts() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/posts/get-all?page=1&size=20`,
    { method: "GET" }
  );
  displayResponse("postResponse", result);
}

async function getMyPosts() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/posts/my-posts?page=1&size=20`,
    { method: "GET" }
  );
  displayResponse("postResponse", result);
}

async function viewPost() {
  const postId = document.getElementById("viewPostId").value;
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/posts/view/${postId}`,
    { method: "GET" }
  );
  displayResponse("postResponse", result);
}

async function createPost() {
  const caption = document.getElementById("postCaption").value;
  const prompt = document.getElementById("postPrompt").value;
  const fileInput = document.getElementById("postImage");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an image");
    return;
  }

  const formData = new FormData();
  formData.append("caption", caption);
  formData.append("prompt", prompt);
  formData.append("image", file);

  try {
    const response = await fetch(`${getApiGateway()}/api/v1/posts/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    const result = await response.json();
    displayResponse("postResponse", result);
  } catch (error) {
    displayResponse("postResponse", { error: error.message });
  }
}

// Like/Unlike post with explicit action (Post Service API)
async function likePostAction() {
  const postId = document.getElementById("postLikeId").value;
  const action = document.getElementById("postLikeAction").value;

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/posts/like?postId=${postId}&like=${action}`,
    { method: "PATCH" }
  );
  displayResponse("postResponse", result);
}

async function downloadPost() {
  const postId = document.getElementById("downloadPostId").value;
  window.open(`${getApiGateway()}/api/v1/posts/download/${postId}`, "_blank");
}

// ==================== COMMENTS ====================

async function getCommentsByPost() {
  const postId = document.getElementById("commentsPostId").value;
  const result = await makeRequest(
    `${getCommentsUrl()}/comments/post/${postId}`,
    { method: "GET" }
  );
  displayResponse("commentResponse", result);
}

async function getCommentById() {
  const commentId = document.getElementById("commentId").value;
  const result = await makeRequest(
    `${getCommentsUrl()}/comments/${commentId}`,
    { method: "GET" }
  );
  displayResponse("commentResponse", result);
}

async function createComment() {
  const data = {
    postId: document.getElementById("createCommentPostId").value,
    userId: document.getElementById("createCommentUserId").value,
    content: document.getElementById("createCommentContent").value,
    parentId: document.getElementById("createCommentParentId").value || "",
  };

  const result = await makeRequest(`${getCommentsUrl()}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  displayResponse("commentResponse", result);
}

async function updateComment() {
  const commentId = document.getElementById("updateCommentId").value;
  const data = {
    content: document.getElementById("updateCommentContent").value,
  };

  const result = await makeRequest(
    `${getCommentsUrl()}/comments/${commentId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  displayResponse("commentResponse", result);
}

async function deleteComment() {
  const commentId = document.getElementById("deleteCommentId").value;
  const result = await makeRequest(
    `${getCommentsUrl()}/comments/${commentId}`,
    { method: "DELETE" }
  );
  displayResponse("commentResponse", result);
}

// ==================== CHAT ====================

async function getChatMessages() {
  const receiverId = document.getElementById("chatReceiverId").value;
  const result = await makeRequest(
    `${getApiGateway()}/communications/communications/get-messages?receiverId=${receiverId}&page=1&size=50`,
    { method: "GET" }
  );
  displayResponse("chatResponse", result);
}

async function getGroupMessages() {
  const groupId = document.getElementById("groupChatId").value;
  const result = await makeRequest(
    `${getApiGateway()}/communications/groups/${groupId}/messages?page=1&size=50`,
    { method: "GET" }
  );
  displayResponse("chatResponse", result);
}

// ==================== SOCKETS ====================

// Comments Socket
function connectCommentsSocket() {
  if (commentsSocket && commentsSocket.connected) {
    addSocketLog("Already connected to comments socket", "error");
    return;
  }

  commentsSocket = io(getCommentsUrl());

  commentsSocket.on("connect", () => {
    addSocketLog("✅ Connected to Comments Socket", "info");
    document.getElementById("commentsSocketStatus").textContent = "Connected";
    document.getElementById("commentsSocketStatus").classList.add("connected");
  });

  commentsSocket.on("disconnect", (reason) => {
    addSocketLog(`❌ Disconnected from Comments Socket: ${reason}`, "error");
    document.getElementById("commentsSocketStatus").textContent =
      "Disconnected";
    document
      .getElementById("commentsSocketStatus")
      .classList.remove("connected");
  });

  commentsSocket.on("error", (error) => {
    addSocketLog(`⚠️ Socket Error: ${error}`, "error");
  });
}

function disconnectCommentsSocket() {
  if (commentsSocket) {
    commentsSocket.disconnect();
    commentsSocket = null;
    addSocketLog("Disconnected from Comments Socket", "info");
  }
}

function joinCommentsRoom() {
  const postId = document.getElementById("commentsSocketPostId").value;
  if (!commentsSocket || !commentsSocket.connected) {
    alert("Please connect to socket first");
    return;
  }

  commentsSocket.emit("join", postId);
  addSocketLog(`📥 Joined room: ${postId}`, "sent");
}

function leaveCommentsRoom() {
  const postId = document.getElementById("commentsSocketPostId").value;
  if (!commentsSocket || !commentsSocket.connected) {
    alert("Please connect to socket first");
    return;
  }

  commentsSocket.emit("leave", postId);
  addSocketLog(`📤 Left room: ${postId}`, "sent");
}

// Communication Socket
function connectCommunicationSocket() {
  const userIdInput =
    document.getElementById("communicationUserId").value || userId;

  if (!userIdInput) {
    alert("Please enter your User ID");
    return;
  }

  if (communicationSocket && communicationSocket.connected) {
    addSocketLog("Already connected to communication socket", "error");
    return;
  }

  communicationSocket = io(
    `${getCommunicationSocketUrl()}?userId=${userIdInput}`
  );

  communicationSocket.on("connect", () => {
    addSocketLog("✅ Connected to Communication Socket", "info");
    addSocketLog("Auto-joined all your group rooms", "info");
    document.getElementById("communicationSocketStatus").textContent =
      "Connected";
    document
      .getElementById("communicationSocketStatus")
      .classList.add("connected");
  });

  communicationSocket.on("disconnect", (reason) => {
    addSocketLog(
      `❌ Disconnected from Communication Socket: ${reason}`,
      "error"
    );
    document.getElementById("communicationSocketStatus").textContent =
      "Disconnected";
    document
      .getElementById("communicationSocketStatus")
      .classList.remove("connected");
  });

  communicationSocket.on("receiveMessage", (data) => {
    addSocketLog(
      `📨 Received 1-1 Message: ${JSON.stringify(data)}`,
      "received"
    );
  });

  communicationSocket.on("receiveGroupMessage", (data) => {
    addSocketLog(
      `📨 Received Group Message: ${JSON.stringify(data)}`,
      "received"
    );
  });

  communicationSocket.on("error", (error) => {
    addSocketLog(`⚠️ Socket Error: ${error}`, "error");
  });
}

function disconnectCommunicationSocket() {
  if (communicationSocket) {
    communicationSocket.disconnect();
    communicationSocket = null;
    addSocketLog("Disconnected from Communication Socket", "info");
  }
}

function sendSocketMessage() {
  if (!communicationSocket || !communicationSocket.connected) {
    alert("Please connect to socket first");
    return;
  }

  const data = {
    senderId: userId || document.getElementById("communicationUserId").value,
    receiverId: document.getElementById("socketReceiverId").value,
    message: document.getElementById("socketMessage").value,
    isImage: document.getElementById("socketIsImage").checked,
  };

  communicationSocket.emit("sendMessage", data);
  addSocketLog(`📤 Sent 1-1 Message: ${JSON.stringify(data)}`, "sent");
}

function sendGroupMessage() {
  if (!communicationSocket || !communicationSocket.connected) {
    alert("Please connect to socket first");
    return;
  }

  const data = {
    senderId: userId || document.getElementById("communicationUserId").value,
    groupId: document.getElementById("socketGroupId").value,
    message: document.getElementById("socketGroupMessage").value,
    isImage: document.getElementById("socketGroupIsImage").checked,
  };

  communicationSocket.emit("sendMessageToGroup", data);
  addSocketLog(`📤 Sent Group Message: ${JSON.stringify(data)}`, "sent");
}

function joinCommunicationRoom() {
  const roomId = document.getElementById("socketRoomId").value;
  if (!communicationSocket || !communicationSocket.connected) {
    alert("Please connect to socket first");
    return;
  }

  communicationSocket.emit("joinRoom", roomId);
  addSocketLog(`📥 Manually joined room: ${roomId}`, "sent");
}

function leaveCommunicationRoom() {
  const roomId = document.getElementById("socketRoomId").value;
  if (!communicationSocket || !communicationSocket.connected) {
    alert("Please connect to socket first");
    return;
  }

  communicationSocket.emit("leaveRoom", roomId);
  addSocketLog(`📤 Left room: ${roomId}`, "sent");
}

// ==================== ADMIN ====================

async function getAllRoles() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/roles/get-all`,
    { method: "GET" }
  );
  displayResponse("adminResponse", result);
}

async function getAllAuthorities() {
  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/authorities/get-all`,
    { method: "GET" }
  );
  displayResponse("adminResponse", result);
}

async function createAuthority() {
  const data = {
    authorityName: document.getElementById("authorityName").value,
    description: document.getElementById("authorityDesc").value,
  };

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/authorities/create`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  displayResponse("adminResponse", result);
}

async function createRole() {
  const authorities = document
    .getElementById("roleAuthorities")
    .value.split(",")
    .map((a) => a.trim());
  const data = {
    roleName: document.getElementById("roleName").value,
    description: document.getElementById("roleDesc").value,
    authorities: authorities,
  };

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/roles/create`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  displayResponse("adminResponse", result);
}

async function deleteUser() {
  const userId = document.getElementById("deleteUserId").value;

  if (!confirm("Are you sure you want to delete this user?")) {
    return;
  }

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/identity/users/delete/${userId}`,
    { method: "DELETE" }
  );
  displayResponse("adminResponse", result);
}

async function deleteAllPosts() {
  if (
    !confirm(
      "Are you ABSOLUTELY sure you want to delete ALL posts? This cannot be undone!"
    )
  ) {
    return;
  }

  const result = await makeRequest(
    `${getApiGateway()}/api/v1/posts/delete-all`,
    { method: "DELETE" }
  );
  displayResponse("adminResponse", result);
}
