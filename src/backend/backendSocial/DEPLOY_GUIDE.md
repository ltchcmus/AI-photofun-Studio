# Hướng dẫn Deploy các Service Spring Boot lên Render

Dự án này bao gồm 4 microservices Spring Boot cần deploy lên Render:

- **api-gateway** (Port 8888)
- **identity-service** (Port 8080)
- **post-service** (Port 8082)
- **profile-service** (Port 8081)

## Thứ tự Deploy

**QUAN TRỌNG**: Deploy theo thứ tự sau để đảm bảo các service phụ thuộc đã sẵn sàng:

1. **identity-service** (deploy trước)
2. **post-service**
3. **profile-service**
4. **api-gateway** (deploy sau cùng)

---

## Bước 1: Chuẩn bị Database PostgreSQL trên Render

Tất cả các service đều dùng chung database PostgreSQL. Bạn có thể:

- Sử dụng database hiện tại đã có
- Hoặc tạo mới database trên Render:
  1. Vào Dashboard Render → Chọn "New +"
  2. Chọn "PostgreSQL"
  3. Đặt tên database (ví dụ: `my-app-db`)
  4. Chọn region: **Singapore**
  5. Plan: Free
  6. Sau khi tạo xong, lưu lại:
     - Internal Database URL
     - Username
     - Password

---

## Bước 2: Deploy từng Service

### 2.1. Deploy Identity Service

1. **Vào Render Dashboard** → Chọn "New +" → "Web Service"

2. **Connect Repository**:

   - Chọn repository GitHub của bạn
   - Hoặc chọn "Deploy from a GitHub repository" và kết nối repo

3. **Cấu hình Service**:

   - **Name**: `identity-service`
   - **Region**: Singapore
   - **Branch**: master (hoặc branch chính của bạn)
   - **Root Directory**: `identity`
   - **Runtime**: Docker
   - **Docker Build Context**: `./identity`
   - **Dockerfile Path**: `./identity/Dockerfile`

4. **Thêm Environment Variables** (click "Advanced" → "Add Environment Variable"):

   ```
   PORT=8080
   DATABASE_URL=<your-postgres-internal-url>
   DATABASE_USERNAME=<your-db-username>
   DATABASE_PASSWORD=<your-db-password>
   PROFILE_SERVICE_URL=<sẽ cập nhật sau>
   POST_SERVICE_URL=<sẽ cập nhật sau>
   MAIL_SERVICE_URL=https://mail-service-80a4.onrender.com
   JWT_SECRET=<tạo random string 64+ ký tự>
   LOOP_HASH=10
   EXPIRES_IN=70
   REFRESH_EXPIRES_IN=86400
   USER_DEFAULT=admin
   PASS_DEFAULT=<password-mạnh-của-bạn>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=None
   REDIRECT_AFTER_LOGIN_GOOGLE_FRONTEND=<your-frontend-url>/google-loading
   REDIRECT_AFTER_LOGIN_GOOGLE_FRONTEND_FAILURE=<your-frontend-url>/failure
   REDIRECT_URI=<identity-service-url>/identity/auth/authentication
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Đợi build xong (khoảng 5-10 phút)
   - Lưu lại URL của service (ví dụ: `https://identity-service.onrender.com`)

---

### 2.2. Deploy Post Service

1. **New Web Service** → Connect repository

2. **Cấu hình**:

   - **Name**: `post-service`
   - **Region**: Singapore
   - **Branch**: master
   - **Root Directory**: `post`
   - **Runtime**: Docker
   - **Docker Build Context**: `./post`
   - **Dockerfile Path**: `./post/Dockerfile`

3. **Environment Variables**:

   ```
   PORT=8082
   DATABASE_URL=<your-postgres-internal-url>
   DATABASE_USERNAME=<your-db-username>
   DATABASE_PASSWORD=<your-db-password>
   ```

4. Deploy và lưu URL

---

### 2.3. Deploy Profile Service

1. **New Web Service** → Connect repository

2. **Cấu hình**:

   - **Name**: `profile-service`
   - **Region**: Singapore
   - **Branch**: master
   - **Root Directory**: `profile`
   - **Runtime**: Docker
   - **Docker Build Context**: `./profile`
   - **Dockerfile Path**: `./profile/Dockerfile`

3. **Environment Variables**:

   ```
   POST=8081
   DATABASE_URL=<your-postgres-internal-url>
   DATABASE_USERNAME=<your-db-username>
   DATABASE_PASSWORD=<your-db-password>
   MAIL_SERVICE_URL=https://mail-service-80a4.onrender.com
   ```

4. Deploy và lưu URL

---

### 2.4. Cập nhật Identity Service

Sau khi deploy xong post và profile service, quay lại **Identity Service** và cập nhật env vars:

```
PROFILE_SERVICE_URL=<profile-service-url>
POST_SERVICE_URL=<post-service-url>
```

Sau đó trigger deploy lại (Manual Deploy hoặc đợi auto-deploy)

---

### 2.5. Deploy API Gateway (cuối cùng)

1. **New Web Service** → Connect repository

2. **Cấu hình**:

   - **Name**: `api-gateway`
   - **Region**: Singapore
   - **Branch**: master
   - **Root Directory**: `api-gateway`
   - **Runtime**: Docker
   - **Docker Build Context**: `./api-gateway`
   - **Dockerfile Path**: `./api-gateway/Dockerfile`

3. **Environment Variables**:

   ```
   PORT=8888
   IDENTITY_SERVICE_URL=<identity-service-url>
   PROFILE_SERVICE_URL=<profile-service-url>
   POST_SERVICE_URL=<post-service-url>
   COMMENT_SERVICE_URL=<comment-service-url>
   ```

4. Deploy

---

## Bước 3: Kiểm tra

1. **Test từng service riêng lẻ**:

   - Identity: `https://identity-service.onrender.com/identity/actuator/health`
   - Post: `https://post-service.onrender.com/posts/actuator/health`
   - Profile: `https://profile-service.onrender.com/profiles/actuator/health`

2. **Test qua API Gateway**:
   - `https://api-gateway.onrender.com/api-gateway/api/v1/identity/...`
   - `https://api-gateway.onrender.com/api-gateway/api/v1/posts/...`
   - `https://api-gateway.onrender.com/api-gateway/api/v1/profiles/...`

---

## Lưu ý quan trọng

### 1. Free Plan Limitations

- Service sẽ sleep sau 15 phút không hoạt động
- Khởi động lại mất 30-60 giây khi có request đầu tiên
- 750 giờ free mỗi tháng

### 2. Build Time

- Lần build đầu tiên mất 5-10 phút (download dependencies)
- Các lần sau nhanh hơn nhờ cache

### 3. Database

- Nếu dùng Render PostgreSQL Free:
  - Database sẽ bị xóa sau 90 ngày
  - Giới hạn 1GB storage
  - Backup thường xuyên!

### 4. Environment Variables

- Không commit sensitive data (password, secret) vào git
- Sử dụng Render env vars để quản lý

### 5. Auto Deploy

- Render tự động deploy khi có push mới vào branch được cấu hình
- Có thể tắt auto-deploy trong Settings nếu muốn deploy thủ công

### 6. Logs

- Xem logs tại Dashboard → Service → Logs
- Hữu ích để debug khi có lỗi

---

## Troubleshooting

### Service không start được

1. Check logs để xem lỗi cụ thể
2. Kiểm tra env vars đã đủ chưa
3. Kiểm tra database connection string

### Build failed

1. Kiểm tra Dockerfile syntax
2. Kiểm tra pom.xml có dependencies đủ không
3. Xem build logs chi tiết

### Service running nhưng không truy cập được

1. Kiểm tra port number trong env vars
2. Kiểm tra context-path trong application.yaml
3. Kiểm tra health check endpoint

### Database connection error

1. Kiểm tra DATABASE_URL format đúng chưa
2. Kiểm tra username/password
3. Nếu dùng external DB, check firewall/whitelist

---

## Sử dụng render.yaml (Optional)

Thay vì deploy manual qua UI, bạn có thể:

1. Copy file `render.yaml` từ mỗi thư mục service
2. Cập nhật env vars trong render.yaml
3. Commit vào repo
4. Render sẽ tự động detect và deploy theo config

**Lưu ý**: File `render.yaml` chỉ nên chứa template, các giá trị sensitive nên set qua UI.

---

## Monitoring

1. **Uptime Monitoring**: Dùng UptimeRobot hoặc Pingdom
2. **Logs**: Render cung cấp logs real-time
3. **Metrics**: Render Dashboard hiển thị CPU, Memory usage

---

## Tối ưu Performance

1. **Health Check**: Thêm Spring Boot Actuator để có health endpoint
2. **Keep Alive**: Dùng cron job hoặc UptimeRobot ping định kỳ tránh sleep
3. **JVM Options**: Có thể thêm options trong Dockerfile:
   ```dockerfile
   ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]
   ```

---

Chúc bạn deploy thành công! 🚀
