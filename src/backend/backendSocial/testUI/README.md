# 🧪 API Testing Dashboard - React Version

Ứng dụng React test đầy đủ **59 REST APIs + 2 Socket.IO servers** cho hệ thống microservices.

## 📋 Danh sách API

### Authentication (5 APIs)

1. POST `/api/v1/identity/users/register` - Register
2. POST `/api/v1/identity/auth/login` - Login
3. GET `/api/v1/identity/auth/introspect/{token}` - Introspect
4. GET `/api/v1/identity/auth/refresh/{token}` - Refresh Token
5. GET `/api/v1/identity/auth/logout` - Logout

### User Management (8 APIs)

6. GET `/api/v1/identity/users/me` - Get My Info
7. GET `/api/v1/identity/users/get-all` - Get All Users
8. GET `/api/v1/identity/users/get/{id}` - Get User By ID
9. POST `/api/v1/identity/users/change-password` - Change Password
10. POST `/api/v1/identity/users/upload-avatar` - Upload Avatar
11. PATCH `/api/v1/identity/users/click-like/{postId}` - Like Post
12. GET `/api/v1/identity/users/check-login-by-google` - Check Google Login
13. GET `/api/v1/identity/users/check-premium` - Check Premium

### Group Management (10 APIs)

14. GET `/communications/groups/all` - Get All Groups
15. GET `/api/v1/identity/users/get-group-joined` - Get My Groups
16. GET `/communications/groups/{id}` - Get Group Detail
17. POST `/communications/groups/create` - Create Group (Premium Only)
18. PATCH `/communications/groups/{id}` - Update Group (Admin Only)
19. POST `/communications/groups/{id}/avatar` - Upload Group Avatar (Admin Only)
20. POST `/communications/groups/request-join-group` - Request to Join
21. PATCH `/api/v1/identity/users/get-request-join-group` - Get Member Requests
22. PATCH `/communications/groups/modify-request-status` - Accept/Deny Request (Admin Only)
23. GET `/communications/groups/{id}/messages` - Get Group Messages

### Profile (5 APIs)

24. GET `/api/v1/profiles/my-profile` - Get My Profile
25. PUT `/api/v1/profiles/update` - Update Profile
26. GET `/api/v1/profiles/check-verify` - Check Verify Status
27. GET `/api/v1/profiles/verify-profile` - Send Verification Email
28. PATCH `/api/v1/profiles/activate-profile/{code}` - Activate Profile

### Posts (6 APIs)

29. GET `/api/v1/posts/get-all` - Get All Posts
30. GET `/api/v1/posts/my-posts` - Get My Posts
31. GET `/api/v1/posts/view/{id}` - View Post
32. POST `/api/v1/posts/create` - Create Post
33. PATCH `/api/v1/posts/like` - Like/Unlike Post
34. GET `/api/v1/posts/download/{id}` - Download Post

### Comments (5 APIs)

35. GET `/comments/post/{postId}` - Get Comments by Post
36. GET `/comments/{id}` - Get Comment by ID
37. POST `/comments` - Create Comment
38. PUT `/comments/{id}` - Update Comment
39. DELETE `/comments/{id}` - Delete Comment

### Chat (2 APIs)

40. GET `/communications/communications/get-messages` - Get 1-1 Messages
41. GET `/communications/groups/{id}/messages` - Get Group Messages

### Socket.IO (2 Servers, 10 Events)

**Comments Socket (Port 8003)**

- 42. Event: `connect` - Connect to Comments Socket
- 43. Event: `disconnect` - Disconnect
- 44. Event: `join` - Join Post Room
- 45. Event: `leave` - Leave Post Room

**Communication Socket (Port 8899)**

- 46. Event: `connect` - Connect to Communication Socket (auto-join groups)
- 47. Event: `disconnect` - Disconnect
- 48. Event: `sendMessage` - Send 1-1 Message
- 49. Event: `sendMessageToGroup` - Send Group Message (broadcasts to all members)
- 50. Event: `joinRoom` - Manually Join Room
- 51. Event: `leaveRoom` - Leave Room

### Admin (6 APIs)

52. GET `/api/v1/identity/roles/get-all` - Get All Roles
53. GET `/api/v1/identity/authorities/get-all` - Get All Authorities
54. POST `/api/v1/identity/authorities/create` - Create Authority (Admin Only)
55. POST `/api/v1/identity/roles/create` - Create Role (Admin Only)
56. DELETE `/api/v1/identity/users/delete/{id}` - Delete User (Admin Only)
57. DELETE `/api/v1/posts/delete-all` - Delete All Posts (Admin Only)

**Total: 57 REST APIs + 10 Socket.IO Events = 67 Endpoints**

## 🚀 Installation & Run

### Prerequisites

- Node.js 16+ installed
- All backend services running

### Steps

1. **Navigate to testUI folder:**

```powershell
cd "c:\Users\ACER\Desktop\Project\NMCNPM\AI photofun Studio\src\backend\backendSocial\testUI"
```

2. **Install dependencies:**

```powershell
npm install
```

3. **Run development server:**

```powershell
npm run dev
```

4. **Open browser:**

```
http://localhost:3000
```

## 🎯 How to Use

### 1. Configuration

- Set API Gateway URL (default: `http://localhost:8888`)
- Set Comments Service URL (default: `http://localhost:8003`)
- Set Communication Socket URL (default: `http://localhost:8899`)

### 2. Authentication Flow

1. Go to **Auth** tab
2. Fill in registration form and click "Register"
3. Login with username/email and password
4. Token will be saved automatically
5. Authentication status will show at the top

### 3. Test APIs

- Navigate through tabs: **Auth, User, Groups, Profile, Posts, Comments, Chat, Sockets, Admin**
- Fill in form fields
- Click buttons to call APIs
- Responses appear in the black box at the bottom

### 4. Test Socket.IO

1. Go to **Sockets** tab
2. **Comments Socket:**
   - Click "Connect"
   - Enter Post ID and click "Join Room"
   - Watch logs for real-time events
3. **Communication Socket:**
   - Enter your User ID
   - Click "Connect" (auto-joins all your groups)
   - Send 1-1 messages or group messages
   - Receive events in real-time

### 5. Test Premium Features

- To test group creation: User must have `premiumOneMonth` or `premiumSixMonths` = true
- Update user in database or use admin panel

### 6. Test Admin Features

- Login with account that has `ADMIN` role
- Access **Admin** tab
- Create roles, authorities, delete users/posts

## 📁 Project Structure

```
testUI/
├── package.json          # Dependencies
├── vite.config.js        # Vite config
├── index-react.html      # HTML entry point
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main app component
│   ├── index.css        # Global styles
│   └── components/      # Tab components
│       ├── AuthTab.jsx
│       ├── UserTab.jsx
│       ├── GroupTab.jsx
│       ├── ProfileTab.jsx
│       ├── PostTab.jsx
│       ├── CommentTab.jsx
│       ├── ChatTab.jsx
│       ├── SocketTab.jsx
│       └── AdminTab.jsx
```

## 🔧 Troubleshooting

### CORS Errors

Make sure all backend services have CORS enabled for `http://localhost:3000`

### Socket.IO Connection Failed

- Check if services are running on correct ports
- Verify URLs in configuration section
- Check browser console for errors

### 401 Unauthorized

- Make sure you're logged in
- Token might be expired - click "Refresh Token"
- Check if endpoint requires ADMIN role

### File Upload Failed

- Check file size limits
- Verify file service is running
- Check network tab in browser DevTools

## 🎨 Features

✅ **All 59 APIs implemented**
✅ **2 Socket.IO servers with real-time messaging**
✅ **Automatic token management**
✅ **File upload support**
✅ **Real-time socket logs**
✅ **Clean, organized UI**
✅ **Response display with JSON formatting**
✅ **Error handling**
✅ **Status indicators**

## 📝 Notes

- This is a testing tool, not production UI
- No input validation (focus on API testing)
- Styling is minimal but functional
- All responses shown as raw JSON
- Socket logs show all events in real-time

## 🤝 API Mapping

| Service       | Port | Context Path     | APIs Count     |
| ------------- | ---- | ---------------- | -------------- |
| Identity      | 8080 | /api/v1/identity | 20             |
| Profile       | 8081 | /api/v1/profiles | 5              |
| Post          | 8082 | /api/v1/posts    | 6              |
| Comments      | 8003 | /comments        | 5 + Socket.IO  |
| Communication | 8085 | /communications  | 14 + Socket.IO |
| API Gateway   | 8888 | -                | Routes all     |

Total: **57 REST + 10 Socket Events = 67 Endpoints**
