# 🍪 Cookie Configuration Guide

## Cách hoạt động của Cookie trong hệ thống

### Backend (Đã config sẵn)

- ✅ API Gateway có `setAllowCredentials(true)` trong CORS config
- ✅ Identity Service set cookie `jwt` khi login thành công
- ✅ API Gateway tự động đọc cookie `jwt` và thêm vào header `Authorization`

### Frontend React (Đã thêm `withCredentials: true`)

- ✅ Tất cả axios requests đã có `withCredentials: true`
- ✅ Browser sẽ tự động gửi cookie trong mọi request

## Testing Cookie Flow

### Bước 1: Login

```javascript
// Tab Auth -> Login
Username: your_username;
Password: your_password;
```

Khi login thành công, server sẽ:

1. Trả về response với `accessToken`, `refreshToken`, `userId`
2. **SET COOKIE** `jwt` với giá trị là `accessToken`

### Bước 2: Kiểm tra Cookie

Mở **Browser DevTools** → **Application/Storage** → **Cookies** → `http://localhost:8888`

Bạn sẽ thấy cookie:

```
Name: jwt
Value: eyJ... (JWT token)
Domain: localhost
Path: /
HttpOnly: Yes (nếu backend set)
SameSite: Lax
```

### Bước 3: Test API với Cookie

Sau khi login, các request tiếp theo sẽ:

1. Browser **TỰ ĐỘNG** gửi cookie `jwt`
2. API Gateway đọc cookie và thêm vào `Authorization: Bearer {token}`
3. Các service backend verify token

## Vì sao cần withCredentials?

```javascript
// ❌ KHÔNG gửi cookie
axios.get("http://localhost:8888/api/v1/identity/users/me");

// ✅ GỬI cookie
axios.get("http://localhost:8888/api/v1/identity/users/me", {
  withCredentials: true,
});
```

## Testing

### Test 1: Login và xem cookie

1. Mở DevTools → Network tab
2. Login qua UI
3. Xem response headers của `/auth/login`:
   ```
   Set-Cookie: jwt=eyJ...; Path=/; HttpOnly; SameSite=Lax
   ```

### Test 2: Verify cookie được gửi

1. Sau khi login, gọi API `Get My Info`
2. Xem request headers:
   ```
   Cookie: jwt=eyJ...
   ```
3. API Gateway sẽ convert thành:
   ```
   Authorization: Bearer eyJ...
   ```

### Test 3: Cookie vs LocalStorage

Hiện tại app dùng **CẢ HAI**:

- **Cookie**: Được set tự động bởi server, dùng bởi API Gateway
- **LocalStorage**: React app lưu token để hiển thị UI status

Bạn có thể:

- **Chỉ dùng Cookie**: Xóa phần lưu localStorage, rely 100% vào cookie
- **Chỉ dùng LocalStorage + Header**: Xóa cookie logic, luôn gửi token qua header
- **Dùng cả hai** (hiện tại): Safety redundancy

## Troubleshooting

### Cookie không được set?

1. Kiểm tra CORS: `Access-Control-Allow-Credentials: true` trong response
2. Kiểm tra URL: Cookie chỉ hoạt động với **cùng domain** hoặc **localhost**
3. Kiểm tra SameSite: Nếu `SameSite=Strict` có thể block cross-origin

### Cookie không được gửi?

1. Đảm bảo `withCredentials: true` trong axios config
2. Kiểm tra cookie chưa expired
3. Kiểm tra Path: Cookie có path `/` sẽ gửi cho mọi endpoint

### Lỗi 401 Unauthorized?

1. Cookie đã expired → Login lại
2. Token invalid → Kiểm tra JWT secret
3. API Gateway không đọc được cookie → Check logs

## Best Practices

### Production

- Set `Secure: true` (chỉ gửi qua HTTPS)
- Set `HttpOnly: true` (không thể đọc bằng JavaScript - bảo mật hơn)
- Set `SameSite: Strict` hoặc `Lax`

### Development (hiện tại)

- `Secure: false` (cho phép HTTP localhost)
- `SameSite: Lax` (cho phép test dễ dàng)

## Configuration Files

### Backend

```java
// api-gateway/ConfigGlobal.java
config.setAllowCredentials(true);  // ✅ Already set

// identity/CookieUtils.java
Cookie cookie = new Cookie("jwt", token);
cookie.setHttpOnly(true);
cookie.setPath("/");
// ✅ Already implemented
```

### Frontend

```javascript
// All Tab components
axios({
  withCredentials: true, // ✅ Already added
});
```

## Kết luận

✅ **Backend đã config đầy đủ**
✅ **Frontend đã thêm withCredentials**
✅ **Cookie sẽ tự động hoạt động**

Chỉ cần:

1. Login qua UI
2. Check DevTools → Cookies
3. Call các API khác → Cookie tự động gửi

**Cookie = Tự động, Bảo mật, HttpOnly!** 🍪🔒
