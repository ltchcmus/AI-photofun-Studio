# 🌐 Backend Social - AI PhotoFun Studio

> Microservices backend cho tính năng mạng xã hội

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)

---

## 📋 Mục Lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc Microservices](#-kiến-trúc-microservices)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt và Chạy](#-cài-đặt-và-chạy)
- [API Endpoints](#-api-endpoints)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)

---

## 🎯 Tổng quan

Backend Social cung cấp các dịch vụ mạng xã hội cho AI PhotoFun Studio bao gồm:
- Xác thực người dùng (OAuth, JWT)
- Quản lý hồ sơ
- Đăng bài viết
- Bình luận
- Nhắn tin realtime & Video call

---

## 🏗️ Kiến trúc Microservices

```
                           ┌─────────────────┐
                           │   API Gateway   │
                           │     :8888       │
                           └────────┬────────┘
                                    │
          ┌─────────────┬───────────┼───────────┬─────────────┐
          │             │           │           │             │
          ▼             ▼           ▼           ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌──────────────┐
   │ Identity │  │ Profile  │  │  Post  │  │ Comments │  │Communication │
   │  :8000   │  │  :8081   │  │ :8082  │  │  :8003   │  │ :8085/:8899  │
   └────┬─────┘  └────┬─────┘  └───┬────┘  └────┬─────┘  └──────┬───────┘
        │             │            │            │               │
        └─────────────┴────────────┴────────────┴───────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────┴─────┐        ┌──────┴─────┐
              │ PostgreSQL│        │  MongoDB   │
              │ (Supabase)│        │            │
              └───────────┘        └────────────┘
```

### Services

| Service | Port | Mô tả | Database |
|---------|------|-------|----------|
| **api-gateway** | 8888 | Routing, CORS, Load balancing | - |
| **identity-service** | 8000 | Đăng ký, đăng nhập, OAuth Google, JWT | PostgreSQL |
| **profile-service** | 8081 | Quản lý hồ sơ người dùng | PostgreSQL |
| **post-service** | 8082 | CRUD bài viết, chia sẻ ảnh/video | PostgreSQL |
| **comments-service** | 8003 | Bình luận bài viết | MongoDB |
| **communication-service** | 8085 (API), 8899 (WebSocket) | Nhắn tin, Video call | - |

---

## 🛠️ Công nghệ sử dụng

- **Framework:** Spring Boot 3.5.6, Spring Cloud 2025.0.0
- **Language:** Java 21
- **Database:** PostgreSQL (Supabase), MongoDB
- **ORM:** Spring Data JPA, Flyway migrations
- **Communication:** OpenFeign, WebSocket
- **Security:** Spring Security, OAuth2, JWT
- **Build:** Maven
- **Deployment:** Docker

---

## 🚀 Cài đặt và Chạy

### Yêu cầu

- **Java 21** hoặc cao hơn
- **Maven 3.8+**
- **Docker** & **Docker Compose**

### Option 1: Docker Compose (Khuyến nghị)

```bash
cd src/backend/backendSocial

# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

**Services sẽ chạy tại:**
- API Gateway: http://localhost:8888
- Identity: http://localhost:8000
- Profile: http://localhost:8081
- Post: http://localhost:8082
- Comments: http://localhost:8003
- Communication: http://localhost:8085 (API), ws://localhost:8899 (WebSocket)

### Option 2: Chạy từng Service

```bash
# Identity Service
cd identity
./mvnw spring-boot:run

# Profile Service
cd profile
./mvnw spring-boot:run

# Post Service
cd post
./mvnw spring-boot:run

# Comments Service
cd comments
./mvnw spring-boot:run

# Communication Service
cd communication
./mvnw spring-boot:run

# API Gateway
cd api-gateway
./mvnw spring-boot:run
```

---

## 📡 API Endpoints

### Identity Service (`:8000`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/identity/users/register` | Đăng ký tài khoản |
| POST | `/identity/auth/login` | Đăng nhập |
| POST | `/identity/auth/refresh` | Làm mới token |
| GET | `/identity/users/me` | Thông tin user hiện tại |
| POST | `/identity/auth/google` | Đăng nhập Google OAuth |

### Profile Service (`:8081`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/profiles/{userId}` | Lấy profile |
| PUT | `/profiles/{userId}` | Cập nhật profile |
| POST | `/profiles/{userId}/avatar` | Upload avatar |

### Post Service (`:8082`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/posts` | Danh sách bài viết |
| POST | `/posts` | Tạo bài viết mới |
| GET | `/posts/{id}` | Chi tiết bài viết |
| PUT | `/posts/{id}` | Cập nhật bài viết |
| DELETE | `/posts/{id}` | Xóa bài viết |
| POST | `/posts/{id}/like` | Like bài viết |

### Comments Service (`:8003`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/comments/post/{postId}` | Comments của bài viết |
| POST | `/comments` | Thêm comment |
| PUT | `/comments/{id}` | Sửa comment |
| DELETE | `/comments/{id}` | Xóa comment |

### Communication Service (`:8085`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/conversations` | Danh sách hội thoại |
| POST | `/messages` | Gửi tin nhắn |
| GET | `/messages/{conversationId}` | Lịch sử tin nhắn |

**WebSocket (`:8899`)** - Kết nối realtime cho tin nhắn và video call.

---

## ⚙️ Cấu hình môi trường

### Biến môi trường (docker-compose.yml)

```yaml
# Database
DATABASE_URL: jdbc:postgresql://host:port/database
DATABASE_USERNAME: username
DATABASE_PASSWORD: password

# MongoDB (Comments)
MONGO_URI: mongodb+srv://user:pass@cluster.mongodb.net/

# Service URLs
IDENTITY_SERVICE_URL: http://identity-service:8000
PROFILE_SERVICE_URL: http://profile-service:8081
POST_SERVICE_URL: http://post-service:8082
COMMENT_SERVICE_URL: http://comments-service:8003
COMMUNICATION_SERVICE_URL: http://communication-service:8085

# OAuth
GOOGLE_CLIENT_SECRET: your-google-client-secret
REDIRECT_URI: http://localhost:5173/google-loading

# CORS
CORS_ALLOWED_ORIGINS: http://localhost:5173,http://localhost:3000
```

---

## 📁 Cấu trúc thư mục

```
backendSocial/
├── api-gateway/           # API Gateway service
│   ├── src/main/java/
│   ├── pom.xml
│   └── Dockerfile
│
├── identity/              # Authentication service
│   ├── src/main/java/
│   ├── dbscript/          # Flyway migrations
│   ├── pom.xml
│   └── Dockerfile
│
├── profile/               # Profile management
│   ├── src/main/java/
│   └── ...
│
├── post/                  # Post service
│   ├── src/main/java/
│   └── ...
│
├── comments/              # Comments service (MongoDB)
│   ├── src/main/java/
│   └── ...
│
├── communication/         # Messaging & WebSocket
│   ├── src/main/java/
│   └── ...
│
├── docker-compose.yml     # Docker orchestration
└── README.md              # This file
```

---

## 🧪 Testing

### Postman Collection

Import file `API social.postman_collection.json` để test APIs.

### Health Check

```bash
# Check từng service
curl http://localhost:8000/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8888/actuator/health
```

---

## 🐛 Troubleshooting

### Service không khởi động

```bash
# Xem logs
docker-compose logs identity-service

# Restart service
docker-compose restart identity-service
```

### Lỗi kết nối database

- Kiểm tra DATABASE_URL trong docker-compose.yml
- Đảm bảo Supabase connection pooler đang hoạt động

### CORS errors

- Thêm origin vào CORS_ALLOWED_ORIGINS trong api-gateway

---

*Backend Social - AI PhotoFun Studio* 🚀
