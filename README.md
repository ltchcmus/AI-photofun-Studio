# 🎨 AI PhotoFun Studio

> Nền tảng chỉnh sửa ảnh AI thông minh với tính năng mạng xã hội

[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.1.4-green.svg)](https://www.djangoproject.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)

---

## 📋 Mục Lục

- [Giới thiệu](#-giới-thiệu)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Tính năng](#-tính-năng)

---

## 🎯 Giới thiệu

AI PhotoFun Studio là ứng dụng chỉnh sửa ảnh thông minh sử dụng AI tiên tiến (Google Gemini và Freepik AI). Kết hợp các tính năng mạng xã hội để chia sẻ và tương tác.

### Tính năng chính:
- 🖼️ **Text to Image** - Tạo ảnh từ mô tả văn bản
- ✨ **Image Enhance** - Nâng cao chất lượng ảnh
- 🎭 **Background Tools** - Xóa/thay nền ảnh
- 🎨 **Style Transfer** - Chuyển đổi phong cách nghệ thuật
- 👤 **Face Swap** - Hoán đổi khuôn mặt
- 📸 **Photo Restore** - Phục hồi ảnh cũ
- 💬 **Mạng xã hội** - Nhắn tin, đăng bài, video call

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│                   React + Vite + Tailwind                       │
│                      (Port: 5173)                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────────┐         ┌─────────────────────────────────┐
│    BACKEND AI     │         │        BACKEND SOCIAL           │
│  Django + Celery  │         │     Spring Boot Microservices   │
│   (Port: 9999)    │         │       (API Gateway: 8888)       │
│                   │         │                                 │
│  ┌─────────────┐  │         │  ┌──────────┐  ┌──────────┐    │
│  │   Gemini    │  │         │  │ Identity │  │ Profile  │    │
│  │   Freepik   │  │         │  │  :8000   │  │  :8081   │    │
│  └─────────────┘  │         │  └──────────┘  └──────────┘    │
│                   │         │  ┌──────────┐  ┌──────────┐    │
│  ┌─────────────┐  │         │  │   Post   │  │ Comments │    │
│  │  MongoDB    │  │         │  │  :8082   │  │  :8003   │    │
│  │ PostgreSQL  │  │         │  └──────────┘  └──────────┘    │
│  │   Redis     │  │         │  ┌─────────────────────────┐   │
│  └─────────────┘  │         │  │    Communication        │   │
└───────────────────┘         │  │  :8085 (API) :8899 (WS) │   │
                              │  └─────────────────────────┘   │
                              └─────────────────────────────────┘
```

---

## 🛠️ Công nghệ sử dụng

| Component | Công nghệ |
|-----------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| **Backend AI** | Django 5.1.4, DRF, Celery, Google Gemini, Freepik API |
| **Backend Social** | Spring Boot 3.5.6, Java 21, Spring Cloud, WebSocket |
| **Databases** | PostgreSQL (Supabase), MongoDB |
| **Cache/Queue** | Redis |
| **File Storage** | Cloudinary |
| **Deployment** | Docker, Docker Compose |

---

## 📁 Cấu trúc dự án

```
AI-photofun-Studio/
├── src/
│   ├── backend/
│   │   ├── backendAI/          # Django AI services
│   │   │   ├── apps/           # Django apps
│   │   │   ├── core/           # Shared utilities
│   │   │   └── docker-compose.yml
│   │   │
│   │   └── backendSocial/      # Spring Boot microservices
│   │       ├── identity/       # Auth service (8000)
│   │       ├── profile/        # Profile service (8081)
│   │       ├── post/           # Post service (8082)
│   │       ├── comments/       # Comments service (8003)
│   │       ├── communication/  # Messaging & WebSocket (8085/8899)
│   │       ├── api-gateway/    # API Gateway (8888)
│   │       └── docker-compose.yml
│   │
│   └── frontend/               # React application
│       ├── src/
│       │   ├── pages/          # 30 pages (AI tools, social)
│       │   ├── components/     # Reusable components
│       │   ├── api/            # API clients
│       │   └── hooks/          # Custom hooks
│       └── package.json
│
├── docs/                       # Documentation
└── README.md                   # This file
```

---

## 📥 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Node.js** 18+ (cho Frontend)
- **Python** 3.12+ (cho Backend AI)
- **Java** 21+ (cho Backend Social)
- **Docker** & **Docker Compose** (khuyến nghị)

### Clone repository

```bash
git clone https://github.com/your-repo/AI-photofun-Studio.git
cd AI-photofun-Studio
```

---

## 🚀 Chạy ứng dụng

### Option 1: Docker (Khuyến nghị)

```bash
# 1. Chạy Backend AI
cd src/backend/backendAI
docker-compose up -d

# 2. Chạy Backend Social
cd ../backendSocial
docker-compose up -d

# 3. Chạy Frontend
cd ../../frontend
npm install
npm run dev
```

### Option 2: Chạy thủ công

**Frontend:**
```bash
cd src/frontend
npm install
npm run dev
# → http://localhost:5173
```

**Backend AI:**
```bash
cd src/backend/backendAI
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:9999
# → http://localhost:9999
```

**Backend Social:**
```bash
cd src/backend/backendSocial
docker-compose up -d
# API Gateway → http://localhost:8888
```

---

## ✨ Tính năng

### 🤖 AI Features (Backend AI - Port 9999)

| Tính năng | Token | Thời gian | Mô tả |
|-----------|-------|-----------|-------|
| Text to Image | 10 | 3-8s | Tạo ảnh từ mô tả văn bản |
| Image Enhance | 5 | 5-15s | Nâng độ phân giải gấp 2 |
| Remove Background | 3 | 1-3s | Xóa nền, xuất PNG trong suốt |
| Face Swap | 15 | 5-10s | Hoán đổi khuôn mặt |
| Style Transfer | 10 | 5-15s | Chuyển đổi phong cách nghệ thuật |
| Photo Restore | 8 | 5-10s | Phục hồi ảnh cũ |

### 👥 Social Features (Backend Social - Port 8888)

- **Identity Service** - Đăng ký, đăng nhập, OAuth Google, JWT
- **Profile Service** - Quản lý hồ sơ người dùng
- **Post Service** - Đăng bài, chia sẻ ảnh/video
- **Comments Service** - Bình luận bài viết
- **Communication Service** - Nhắn tin realtime, video call

---

## 📚 Tài liệu chi tiết

- [Backend AI README](src/backend/backendAI/README.md) - Hướng dẫn chi tiết Backend AI
- [Backend AI API Docs](src/backend/backendAI/API_DOCUMENTATION.md) - Tài liệu API đầy đủ
- [Backend Social README](src/backend/backendSocial/README.md) - Hướng dẫn microservices
- [Frontend README](src/frontend/README.md) - Hướng dẫn Frontend

---

## 📞 Liên hệ

**AI PhotoFun Studio Team**

---

*Cảm ơn bạn đã sử dụng AI PhotoFun Studio! 🎉*
