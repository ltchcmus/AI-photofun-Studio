# Axios Interceptor - Auto Refresh Token Guide

## Overview

Axios instance được cấu hình với interceptor để tự động xử lý refresh token khi nhận HTTP status 401 (Unauthorized).

## Architecture

```
┌─────────────┐
│   Request   │
│  (with JWT) │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Request Interceptor│ ──► Add Authorization: Bearer {token}
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│  API Server  │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│    Response     │
└──────┬──────────┘
       │
       ▼
    HTTP 401?
       │
   ┌───┴───┐
   │  Yes  │
   └───┬───┘
       │
       ▼
┌────────────────────┐
│ Response Interceptor│
│ 1. Queue request    │
│ 2. Call refresh API │
│ 3. Update token     │
│ 4. Retry request    │
└────────┬───────────┘
         │
    ┌────┴────┐
    │Success? │
    └────┬────┘
         │
    ┌────┴────┐
    │   Yes   │ ──► Return response
    └─────────┘
         │
    ┌────┴────┐
    │   No    │ ──► Logout user
    └─────────┘
```

## Implementation

### 1. Create Axios Instance

```javascript
// src/utils/axiosInstance.js
import axios from "axios";

const createAxiosInstance = (config, auth, setAuth, logout) => {
  const instance = axios.create({
    baseURL: config.apiGateway,
    withCredentials: true,
  });

  // Request interceptor
  instance.interceptors.request.use((config) => {
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  });

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 and refresh token...
    }
  );

  return instance;
};
```

### 2. Use in App Component

```javascript
// src/App.jsx
import createAxiosInstance from './utils/axiosInstance'

function App() {
  const [auth, setAuth] = useState({...})

  const logout = () => {
    setAuth({ accessToken: '', refreshToken: '', userId: '' })
  }

  // Create axios instance
  const apiClient = useMemo(() => {
    return createAxiosInstance(config, auth, setAuth, logout)
  }, [config.apiGateway, auth.accessToken])

  // Pass to child components
  return <UserTab apiClient={apiClient} />
}
```

### 3. Use in Components

```javascript
// Before (Direct axios)
const res = await axios({
  method: "GET",
  url: `${config.apiGateway}/api/v1/identity/users/me`,
  headers: { Authorization: `Bearer ${auth.accessToken}` },
});

// After (With interceptor)
const res = await apiClient({
  method: "GET",
  url: "/api/v1/identity/users/me",
  // No need to add Authorization header!
});
```

## Refresh Token Flow

### Step 1: Request with Expired Token

```http
GET /api/v1/identity/users/me
Authorization: Bearer eyJhbGci... (expired)
```

### Step 2: Server Returns 401

```json
HTTP 401 Unauthorized
{
  "code": 1001,
  "message": "Token expired"
}
```

### Step 3: Interceptor Calls Refresh API

```http
GET /api/v1/identity/auth/refresh-token
Cookie: refreshToken=abc123...
```

### Step 4: Receive New Access Token

```json
{
  "code": 1000,
  "message": "Refresh token successful",
  "result": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWI..."
  }
}
```

### Step 5: Retry Original Request

```http
GET /api/v1/identity/users/me
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9... (new token)
```

### Step 6: Success or Logout

- ✅ **If success**: Return response to component
- ❌ **If 401 again**: Call `logout()` to clear auth state

## Queue Mechanism

When multiple requests fail with 401 simultaneously:

```javascript
let isRefreshing = false;
let failedQueue = [];

// First 401 request
if (!isRefreshing) {
  isRefreshing = true;
  // Call refresh token API
  // Process all queued requests
  processQueue(null, newToken);
}

// Other 401 requests
else {
  // Add to queue
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}
```

**Example:**

```
Request A ──┐
Request B ──┼──► 401 (all fail together)
Request C ──┘

Request A: Calls refresh API
Request B: Waits in queue
Request C: Waits in queue

Refresh succeeds ──► Process queue ──► Retry A, B, C with new token
```

## Key Features

### ✅ Automatic Token Refresh

No need to manually check token expiration. Interceptor handles it automatically.

### ✅ Request Queueing

Multiple simultaneous requests won't trigger multiple refresh calls. Only one refresh happens at a time.

### ✅ Retry Original Request

After refresh, the original failed request is automatically retried with the new token.

### ✅ Auto Logout

If refresh fails (e.g., refresh token expired), user is automatically logged out.

### ✅ Centralized Logic

All components use the same axios instance, so refresh logic is in one place.

## Error Handling

### Scenario 1: Access Token Expired, Refresh Token Valid

```
1. GET /users/me → 401
2. GET /auth/refresh-token → 200 (new access token)
3. GET /users/me (retry) → 200 ✅
```

### Scenario 2: Both Tokens Expired

```
1. GET /users/me → 401
2. GET /auth/refresh-token → 401 (refresh token expired)
3. Call logout() → Clear auth state → Redirect to login ❌
```

### Scenario 3: Network Error

```
1. GET /users/me → Network Error
2. Interceptor does NOT catch (only catches 401)
3. Component handles error normally ⚠️
```

## Configuration

### Update Auth State After Refresh

```javascript
if (refreshResponse.data.code === 1000) {
  const newAccessToken = refreshResponse.data.result.accessToken;

  // Update React state
  setAuth((prevAuth) => ({
    ...prevAuth,
    accessToken: newAccessToken,
  }));

  // Update default headers
  instance.defaults.headers.common[
    "Authorization"
  ] = `Bearer ${newAccessToken}`;
}
```

### Logout on Refresh Failure

```javascript
catch (refreshError) {
  processQueue(refreshError, null)
  logout() // Clear auth state, redirect to login
  return Promise.reject(refreshError)
}
```

## Testing

### Test 1: Normal Request

```javascript
// Should succeed without refresh
const res = await apiClient.get("/api/v1/identity/users/me");
console.log(res.data); // User info
```

### Test 2: Expired Access Token

```javascript
// Manually set expired token
setAuth({ accessToken: "expired_token_here" });

// Should auto-refresh and succeed
const res = await apiClient.get("/api/v1/identity/users/me");
console.log(res.data); // User info (after refresh)
```

### Test 3: Both Tokens Expired

```javascript
// Clear refresh token cookie
document.cookie = "refreshToken=; Max-Age=0";

// Should logout
const res = await apiClient.get("/api/v1/identity/users/me");
// → Triggers logout(), user redirected to login
```

## Common Issues

### Issue 1: Infinite Refresh Loop

**Problem:** Refresh API also returns 401, causing infinite loop

**Solution:** Add `_retry` flag to prevent retry on refresh API

```javascript
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true; // Prevent infinite loop
  // Call refresh...
}
```

### Issue 2: Multiple Refresh Calls

**Problem:** Multiple requests trigger multiple refresh calls

**Solution:** Use `isRefreshing` flag and queue

```javascript
if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}
```

### Issue 3: Token Updated in State But Not in Headers

**Problem:** New token in `auth.accessToken` but still uses old token

**Solution:** Update both state and axios default headers

```javascript
setAuth({ ...auth, accessToken: newToken });
instance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
```

## API Endpoints

### Refresh Token API

```http
GET /api/v1/identity/auth/refresh-token
Cookie: refreshToken=abc123...
```

**Response:**

```json
{
  "code": 1000,
  "message": "Refresh token successful",
  "result": {
    "accessToken": "eyJhbGci..."
  }
}
```

### Logout API

```http
GET /api/v1/identity/auth/logout
```

**Response:**

```json
{
  "code": 1000,
  "message": "Logout successful"
}
```

## Best Practices

1. **Use interceptor for all API Gateway calls** (identity, profile, post, etc.)
2. **Don't use interceptor for login/register** (no token yet)
3. **Don't use interceptor for external services** (comments, communication)
4. **Always pass `logout` function** to interceptor for cleanup
5. **Test with expired tokens** to ensure refresh works

## Summary

- ✅ Tự động thêm `Authorization` header vào mọi request
- ✅ Tự động refresh token khi nhận HTTP 401
- ✅ Queue requests để tránh multiple refresh calls
- ✅ Retry original request với token mới
- ✅ Auto logout khi refresh thất bại
- ✅ Centralized logic, dễ maintain

**Result:** User experience mượt mà, không bị kick out khi access token hết hạn!
