# 📚 API DOCUMENTATION - COMPLETE SYSTEM

**Base URL (API Gateway):** `http://localhost:8888/api-gateway`

**Direct Service URLs:**

- Identity Service: `http://localhost:8080/identity`
- Profile Service: `http://localhost:8081/profiles`
- Post Service: `http://localhost:8082/posts`
- Comments Service: `http://localhost:8003/comments`
- Communication Service: `http://localhost:8085/communications`

**Socket.IO Servers:**

- Comments Socket: `http://localhost:8003` (namespace: `/`)
- Communication Socket: `http://localhost:8899` (namespace: `/`)

---

## 🔐 AUTHENTICATION SERVICE (Identity)

### 1. Register

**Endpoint:** `POST /api/v1/identity/users/register`

```json
Request Body:
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "confirmPass": "password123",
  "fullName": "Test User",
  "roles": ["USER"]
}

Response:
{
  "code": 1000,
  "message": "User registered successfully",
  "result": {
    "userId": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "tokens": 1000,
    "premiumOneMonth": false,
    "premiumSixMonth": false,
    "fullName": "Test User",
    "roles": [...]
  }
}
```

### 2. Login

**Endpoint:** `POST /api/v1/identity/auth/login`

```json
Request Body:
{
  "usernameOrEmail": "testuser",
  "password": "password123"
}

Response:
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "userId": "uuid",
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### 3. Logout

**Endpoint:** `GET /api/v1/identity/auth/logout`
**Headers:** `Authorization: Bearer {token}`

```json
Response:
{
  "code": 1000,
  "message": "Logout successful"
}
```

### 4. Refresh Token

**Endpoint:** `GET /api/v1/identity/auth/refresh/{refreshToken}`

```json
Response:
{
  "code": 1000,
  "message": null,
  "result": "new_access_token"
}
```

### 5. Introspect Token (Ignore Refresh)

**Endpoint:** `GET /api/v1/identity/auth/introspect/ignore/{token}`

```json
Response:
{
  "code": 1000,
  "message": "Introspect successful",
  "result": {
    "active": true
  }
}
```

### 6. Introspect Token (With Refresh)

**Endpoint:** `GET /api/v1/identity/auth/introspect/{token}`

```json
Response:
{
  "code": 1000,
  "message": "Introspect successful",
  "result": {
    "active": true
  }
}
```

### 7. Login with Google

**Endpoint:** `GET /api/v1/identity/auth/authentication?code={google_code}`
**Note:** Redirects to frontend after authentication

---

## 👤 USER MANAGEMENT (Identity)

### 8. Get User by ID

**Endpoint:** `GET /api/v1/identity/users/get/{userId}`
**Headers:** `Authorization: Bearer {token}`

```json
Response:
{
  "code": 1000,
  "message": "User fetched successfully",
  "result": {
    "userId": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "avatarUrl": "url",
    "tokens": 1000,
    "premiumOneMonth": false,
    "premiumSixMonth": false,
    "loginByGoogle": false,
    "roles": [...]
  }
}
```

### 9. Get All Users (Admin)

**Endpoint:** `GET /api/v1/identity/users/get-all`
**Headers:** `Authorization: Bearer {token}`
**Role:** ADMIN

### 10. Get My Info

**Endpoint:** `GET /api/v1/identity/users/me`
**Headers:** `Authorization: Bearer {token}`

### 11. Change Password

**Endpoint:** `POST /api/v1/identity/users/change-password`
**Headers:** `Authorization: Bearer {token}`

```json
Request Body:
{
  "oldPassword": "old_pass",
  "newPassword": "new_pass",
  "confirmPassword": "new_pass"
}
```

### 12. Set Password (for Google users)

**Endpoint:** `POST /api/v1/identity/users/set-password`
**Headers:** `Authorization: Bearer {token}`

```json
Request Body:
{
  "password": "new_password",
  "confirmPassword": "new_password"
}
```

### 13. Upload Avatar

**Endpoint:** `POST /api/v1/identity/users/upload-avatar`
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

```
Form Data:
file: [image file]
```

### 14. Check Login by Google

**Endpoint:** `GET /api/v1/identity/users/check-login-by-google`
**Headers:** `Authorization: Bearer {token}`

### 15. Like/Unlike Post

**Endpoint:** `PATCH /api/v1/identity/users/click-like/{postId}`
**Headers:** `Authorization: Bearer {token}`

### 16. Delete User (Admin)

**Endpoint:** `DELETE /api/v1/identity/users/delete/{userId}`
**Headers:** `Authorization: Bearer {token}`
**Role:** ADMIN

### 17. Get User Tokens (Internal - requires API keys)

**Endpoint:** `GET /api/v1/identity/users/tokens/{userId}`
**Headers:**

- `api-key-1: {key1}`
- `api-key-2: {key2}`

### 18. Modify User Tokens (Internal - requires API keys)

**Endpoint:** `PATCH /api/v1/identity/users/modify-tokens`
**Headers:**

- `api-key-1: {key1}`
- `api-key-2: {key2}`

```json
Request Body:
{
  "userId": "uuid",
  "tokens": 100
}
```

---

## 👥 GROUP MANAGEMENT (Identity - User side)

### 19. Request Join Group

**Endpoint:** `PATCH /api/v1/identity/users/request-join-group`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
userId: admin_user_id
requestId: requesting_user_id
groupId: group_id
```

### 20. Get Member Requests (Admin)

**Endpoint:** `PATCH /api/v1/identity/users/get-request-join-group`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
page: 1 (default)
size: 10 (default)
```

### 21. Delete Member Request

**Endpoint:** `DELETE /api/v1/identity/users/delete-request-join-group`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
userId: admin_user_id
requestId: requesting_user_id
groupId: group_id
```

### 22. Add User to Group (Internal)

**Endpoint:** `PATCH /api/v1/identity/users/add-group`

```
Query Params:
userId: user_id
groupId: group_id
```

### 23. Get Groups Joined

**Endpoint:** `GET /api/v1/identity/users/get-group-joined`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
page: 1 (default)
size: 10 (default)
```

### 24. Get Groups Joined (Internal)

**Endpoint:** `GET /api/v1/identity/users/get-group-joined-internal`

```
Query Params:
userId: user_id
```

### 25. Check Premium Status

**Endpoint:** `GET /api/v1/identity/users/check-premium`

```
Query Params:
userId: user_id
```

---

## 🔑 ROLES & AUTHORITIES (Identity)

### 26. Create Authority (Admin)

**Endpoint:** `POST /api/v1/identity/authorities/create`
**Headers:** `Authorization: Bearer {token}`
**Role:** ADMIN

```json
Request Body:
{
  "authorityName": "CREATE_POST",
  "description": "Permission to create posts"
}
```

### 27. Get All Authorities

**Endpoint:** `GET /api/v1/identity/authorities/get-all`
**Headers:** `Authorization: Bearer {token}`

### 28. Create Role (Admin)

**Endpoint:** `POST /api/v1/identity/roles/create`
**Headers:** `Authorization: Bearer {token}`
**Role:** ADMIN

```json
Request Body:
{
  "roleName": "MODERATOR",
  "description": "Moderator role",
  "authorities": ["CREATE_POST", "DELETE_POST"]
}
```

### 29. Get All Roles

**Endpoint:** `GET /api/v1/identity/roles/get-all`
**Headers:** `Authorization: Bearer {token}`

---

## 👤 PROFILE SERVICE

### 30. Create Profile (Internal)

**Endpoint:** `POST /api/v1/profiles/create`

```json
Request Body:
{
  "userId": "uuid",
  "fullName": "Test User",
  "phone": "1234567890",
  "email": "test@example.com"
}
```

### 31. Get My Profile

**Endpoint:** `GET /api/v1/profiles/my-profile`
**Headers:** `Authorization: Bearer {token}`

```json
Response:
{
  "code": 1000,
  "message": "Success",
  "result": {
    "fullName": "Test User",
    "phone": "1234567890",
    "email": "test@example.com",
    "verified": false,
    "avatarUrl": "url"
  }
}
```

### 32. Update Profile

**Endpoint:** `PUT /api/v1/profiles/update`
**Headers:** `Authorization: Bearer {token}`

```json
Request Body:
{
  "fullName": "Updated Name",
  "phone": "0987654321",
  "email": "newemail@example.com",
  "avatarUrl": "new_url",
  "verified": false
}
```

### 33. Delete Profile (Admin)

**Endpoint:** `DELETE /api/v1/profiles/delete/{profileId}`
**Headers:** `Authorization: Bearer {token}`
**Role:** ADMIN

### 34. Check Verify Status

**Endpoint:** `GET /api/v1/profiles/check-verify`
**Headers:** `Authorization: Bearer {token}`

### 35. Verify Profile (Send Code)

**Endpoint:** `GET /api/v1/profiles/verify-profile`
**Headers:** `Authorization: Bearer {token}`

### 36. Resend Verify Email

**Endpoint:** `GET /api/v1/profiles/resend-verify-email`
**Headers:** `Authorization: Bearer {token}`

### 37. Activate Profile

**Endpoint:** `PATCH /api/v1/profiles/activate-profile/{code}`
**Headers:** `Authorization: Bearer {token}`

```
Path Param:
code: verification_code (4 digits)
```

---

## 📝 POST SERVICE

### 38. Create Post

**Endpoint:** `POST /api/v1/posts/create`
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

```
Form Data:
caption: "Post caption"
prompt: "AI prompt used"
image: [image file]
```

### 39. Get All Posts

**Endpoint:** `GET /api/v1/posts/get-all`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
page: 1 (default)
size: 10 (default)
```

### 40. Get My Posts

**Endpoint:** `GET /api/v1/posts/my-posts`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
page: 1 (default)
size: 10 (default)
```

### 41. View Post

**Endpoint:** `GET /api/v1/posts/view/{postId}`
**Headers:** `Authorization: Bearer {token}`

### 42. Download Post Image

**Endpoint:** `GET /api/v1/posts/download/{postId}`
**Headers:** `Authorization: Bearer {token}`
**Returns:** Image file

### 43. Like Post

**Endpoint:** `PATCH /api/v1/posts/like`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
postId: post_id
like: 1 (like) or -1 (unlike)
```

### 44. Delete All Posts (Admin)

**Endpoint:** `DELETE /api/v1/posts/delete-all`
**Headers:** `Authorization: Bearer {token}`
**Role:** ADMIN

---

## 💬 COMMENTS SERVICE (Go)

**Base URL:** `http://localhost:8003/comments`

### 45. Create Comment

**Endpoint:** `POST /comments`

```json
Request Body:
{
  "postId": "post_id",
  "userId": "user_id",
  "content": "Comment content",
  "parentId": "" // optional, for replies
}

Response:
{
  "message": "Comment created successfully",
  "data": {
    "id": "comment_id",
    "postId": "post_id",
    "userId": "user_id",
    "content": "Comment content",
    "parentId": "",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 46. Get Comments by Post ID

**Endpoint:** `GET /comments/post/{postId}`

```json
Response:
{
  "code": 1000,
  "message": "Comments retrieved successfully",
  "result": [
    {
      "id": "comment_id",
      "postId": "post_id",
      "userId": "user_id",
      "content": "Comment content",
      "parentId": "",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

### 47. Get Comment by ID

**Endpoint:** `GET /comments/{id}`

```json
Response:
{
  "code": 1000,
  "message": "Comment retrieved successfully",
  "data": {
    "id": "comment_id",
    "postId": "post_id",
    "userId": "user_id",
    "content": "Comment content",
    "createdAt": "timestamp"
  }
}
```

### 48. Update Comment

**Endpoint:** `PUT /comments/{id}`

```json
Request Body:
{
  "content": "Updated comment content"
}

Response:
{
  "code": 1000,
  "message": "Comment updated successfully",
  "data": {...}
}
```

### 49. Delete Comment

**Endpoint:** `DELETE /comments/{id}`

```json
Response:
{
  "code": 1000,
  "message": "Comment deleted successfully"
}
```

---

## 🔌 COMMENTS SOCKET.IO (Go)

**Server:** `http://localhost:8003`
**Namespace:** `/`

### Events

#### Client → Server

**1. join**

```javascript
socket.emit("join", postId);
// Join a room for specific post
```

**2. leave**

```javascript
socket.emit("leave", postId);
// Leave a room
```

#### Server → Client

**1. connect**

```javascript
socket.on("connect", () => {
  console.log("Connected to comments socket");
});
```

**2. disconnect**

```javascript
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

**Note:** After creating a comment via REST API, the server broadcasts it to all clients in the post's room automatically.

---

## 💬 COMMUNICATION SERVICE (Chat)

### 50. Get All Groups

**Endpoint:** `GET /communications/groups/all`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
page: 1 (default)
size: 10 (default)

Response:
{
  "code": 1000,
  "message": "Get all groups successfully",
  "result": {
    "items": [...],
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1
  }
}
```

### 51. Create Group (Premium Only)

**Endpoint:** `POST /communications/groups/create`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
groupName: "Group Name"
imageUrl: "image_url" (optional)

Response:
{
  "code": 1000,
  "message": "Create group successfully",
  "result": {
    "groupId": "uuid",
    "image": "url",
    "name": "Group Name",
    "adminId": "user_id"
  }
}
```

### 52. Get Group Detail

**Endpoint:** `GET /communications/groups/{groupId}`
**Headers:** `Authorization: Bearer {token}`

```json
Response:
{
  "code": 1000,
  "message": "Get group detail successfully",
  "result": {
    "groupId": "uuid",
    "name": "Group Name",
    "image": "url",
    "description": "Group description",
    "adminId": "user_id",
    "memberCount": 10,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 53. Update Group (Admin Only)

**Endpoint:** `PATCH /communications/groups/{groupId}`
**Headers:** `Authorization: Bearer {token}`

```json
Request Body:
{
  "name": "New Group Name",
  "description": "New description"
}

Response:
{
  "code": 1000,
  "message": "Update group successfully",
  "result": {...}
}
```

### 54. Upload Group Avatar (Admin Only)

**Endpoint:** `POST /communications/groups/{groupId}/avatar`
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`

```
Form Data:
file: [image file]

Response:
{
  "code": 1000,
  "message": "Upload group avatar successfully",
  "result": "image_url"
}
```

### 55. Request Join Group

**Endpoint:** `POST /communications/groups/request-join-group`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
groupId: group_id

Response:
{
  "code": 1000,
  "message": "Request to join group sent successfully"
}
```

### 56. Modify Request Status (Admin Only)

**Endpoint:** `PATCH /communications/groups/modify-request-status`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
requestId: user_id_who_requested
groupId: group_id
accept: 1 (accept) or 0 (deny)

Response:
{
  "code": 1000,
  "message": "Modify request status successfully"
}
```

### 57. Get Group Image

**Endpoint:** `GET /communications/groups/get-image/{groupId}`
**Headers:** `Authorization: Bearer {token}`

### 58. Get Group Messages

**Endpoint:** `GET /communications/groups/{groupId}/messages`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
page: 1 (default)
size: 20 (default)

Response:
{
  "code": 1000,
  "message": "Get group messages successfully",
  "result": {
    "items": [
      {
        "id": "message_id",
        "groupId": "group_id",
        "senderId": "user_id",
        "message": "Message content",
        "isImage": false,
        "timestamp": "formatted_time"
      }
    ],
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

### 59. Get Messages (1-1 Chat)

**Endpoint:** `GET /communications/communications/get-messages`
**Headers:** `Authorization: Bearer {token}`

```
Query Params:
receiverId: user_id
page: 1 (default)
size: 15 (default)

Response:
{
  "code": 1000,
  "message": "Messages retrieved successfully",
  "result": {
    "items": [...],
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 150
  }
}
```

---

## 🔌 COMMUNICATION SOCKET.IO (Chat)

**Server:** `http://localhost:8899`
**Namespace:** `/`
**Connection Param:** `?userId={user_id}`

### Events

#### Client → Server

**1. sendMessage (1-1 Chat)**

```javascript
socket.emit("sendMessage", {
  senderId: "user_id",
  receiverId: "receiver_user_id",
  message: "Hello!",
  isImage: false,
});
```

**2. sendMessageToGroup (Group Chat)**

```javascript
socket.emit("sendMessageToGroup", {
  senderId: "user_id",
  groupId: "group_id",
  message: "Hello group!",
  isImage: false,
});
```

**3. joinRoom**

```javascript
socket.emit("joinRoom", "group_id");
// Manually join a group room
```

**4. leaveRoom**

```javascript
socket.emit("leaveRoom", "group_id");
// Leave a group room
```

#### Server → Client

**1. connect**

```javascript
socket.on("connect", () => {
  console.log("Connected to communication socket");
  // Automatically joins all user's group rooms
});
```

**2. receiveMessage (1-1 Chat)**

```javascript
socket.on("receiveMessage", (data) => {
  console.log("New message:", data);
  // data: { senderId, receiverId, message, isImage }
});
```

**3. receiveGroupMessage (Group Chat)**

```javascript
socket.on("receiveGroupMessage", (data) => {
  console.log("New group message:", data);
  // data: { senderId, groupId, message, isImage }
});
```

**4. disconnect**

```javascript
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  // Automatically leaves all group rooms
});
```

---

## 🏥 HEALTH CHECK ENDPOINTS

### All Services

**Endpoint:** `HEAD /check`
**Response:** `200 OK` (no body)

**Purpose:** Lightweight health check for deployment platforms

---

## 📊 RESPONSE CODES

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 1000 | Success                                |
| 1001 | User not found                         |
| 1002 | Invalid credentials                    |
| 1003 | Role not found                         |
| 1004 | User already exists                    |
| 1015 | Username already exists                |
| 1016 | Email already exists                   |
| 1017 | Passwords do not match                 |
| 1020 | Incorrect account                      |
| 1021 | Old password incorrect                 |
| 1024 | File upload failed                     |
| 1025 | Authentication failed                  |
| 1026 | User already set password              |
| 1027 | Limit register exceeded                |
| 1500 | Internal server error                  |
| 1501 | Unauthorized                           |
| 2001 | Sender ID empty                        |
| 2002 | Receiver ID empty                      |
| 2003 | Message empty                          |
| 2004 | Group not found                        |
| 2008 | User not premium (cannot create group) |
| 2009 | Not group member                       |

---

## 🔒 AUTHENTICATION FLOW

1. **Register** → `POST /api/v1/identity/users/register`
2. **Login** → `POST /api/v1/identity/auth/login` → Get `accessToken` & `refreshToken`
3. **Use Token** → Add header: `Authorization: Bearer {accessToken}`
4. **Refresh** → When token expires: `GET /api/v1/identity/auth/refresh/{refreshToken}`
5. **Logout** → `GET /api/v1/identity/auth/logout`

---

## 🎯 PREMIUM FEATURES

**Premium users can:**

- Create groups (Communication Service)

**How to check premium:**

- `GET /api/v1/identity/users/check-premium?userId={userId}`
- Returns: `{ "result": true/false }`

**Premium status fields in User:**

- `premiumOneMonth`: boolean
- `premiumSixMonths`: boolean
- `premiumPoints`: number

---

## 📁 FILE UPLOAD

**Supported endpoints:**

1. Upload Avatar (Identity): `POST /api/v1/identity/users/upload-avatar`
2. Create Post (Post): `POST /api/v1/posts/create` (with image)
3. Upload Group Avatar (Communication): `POST /communications/groups/{groupId}/avatar`

**Content-Type:** `multipart/form-data`
**Max File Size:** 10MB
**File Service:** `https://file-service-cdal.onrender.com`

---

## 🔗 SERVICE DEPENDENCIES

```
API Gateway (8888)
├── Identity Service (8080)
│   ├── Profile Service (8081)
│   ├── Post Service (8082)
│   └── File Service (external)
├── Post Service (8082)
│   └── File Service (external)
├── Profile Service (8081)
│   └── Mail Service (external)
├── Comments Service (8003)
│   └── Socket.IO (8003)
└── Communication Service (8085)
    ├── Identity Service (8080)
    ├── File Service (external)
    └── Socket.IO (8899)
```

---

## 🌐 CONTEXT PATHS

All services are accessible through API Gateway with context paths:

- `/api/v1/identity/*` → Identity Service
- `/api/v1/profiles/*` → Profile Service
- `/api/v1/posts/*` → Post Service
- `/api/v1/comments/*` → Comments Service
- `/communications/*` → Communication Service

**Direct access:** Services can also be accessed directly on their respective ports for development.

---

## 💡 USAGE TIPS

1. **Always include Authorization header** for protected endpoints
2. **Premium check** before creating groups
3. **Socket.IO connection** requires `userId` parameter
4. **File uploads** use `multipart/form-data`
5. **Pagination** starts at page 1 (not 0)
6. **Comments Socket** auto-broadcasts after REST API calls
7. **Communication Socket** auto-joins user's groups on connect
8. **Token refresh** should be done before expiry (70 minutes default)

---

## 🚀 QUICK START

```javascript
// 1. Register
POST /api/v1/identity/users/register
Body: { username, email, password, confirmPass, fullName }

// 2. Login
POST /api/v1/identity/auth/login
Body: { usernameOrEmail, password }
→ Save accessToken

// 3. Use APIs with token
GET /api/v1/identity/users/me
Headers: { Authorization: Bearer {token} }

// 4. Connect to sockets
const socket = io('http://localhost:8899?userId=YOUR_USER_ID');
socket.on('connect', () => {
  console.log('Connected!');
});
```

---

**Last Updated:** November 17, 2025
**API Version:** 1.0
**Total Endpoints:** 59 REST APIs + 2 Socket.IO Servers
