# 🎨 Frontend - AI PhotoFun Studio

> Ứng dụng React với các tính năng AI chỉnh sửa ảnh và mạng xã hội

[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-cyan.svg)](https://tailwindcss.com/)

---

## 📋 Mục Lục

- [Tổng quan](#-tổng-quan)
- [Công nghệ](#-công-nghệ)
- [Cài đặt](#-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Trang và Tính năng](#-trang-và-tính-năng)
- [Cấu hình](#-cấu-hình)

---

## 🎯 Tổng quan

Frontend React SPA (Single Page Application) cho AI PhotoFun Studio với:
- 🤖 **AI Tools** - Tạo ảnh, enhance, xóa nền, style transfer
- 💬 **Social Features** - Nhắn tin, đăng bài, notifications
- 🎥 **Video Features** - Image to Video, Prompt to Video
- 👤 **User Management** - Đăng ký, đăng nhập, OAuth Google

---

## 🛠️ Công nghệ

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **React** | 19.1 | UI Library |
| **Vite** | 7.1 | Build tool |
| **Tailwind CSS** | 4.1 | Styling |
| **React Router** | 7.9 | Routing |
| **Axios** | 1.13 | HTTP client |
| **Socket.io** | 2.5 | Real-time messaging |
| **Firebase** | 12.6 | Authentication |
| **Lucide React** | 0.548 | Icons |

---

## 📥 Cài đặt

### Yêu cầu

- **Node.js** 18+ 
- **npm** hoặc **yarn**

### Cài đặt dependencies

```bash
cd src/frontend
npm install
```

---

## 🚀 Chạy ứng dụng

### Development

```bash
npm run dev
# → http://localhost:5173
```

### Build Production

```bash
npm run build
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 📁 Cấu trúc dự án

```
src/frontend/
├── public/                 # Static files
├── src/
│   ├── api/               # API clients (10 files)
│   │   ├── aiApi.js       # AI features API
│   │   ├── authApi.js     # Authentication API
│   │   ├── postApi.js     # Posts API
│   │   └── ...
│   │
│   ├── components/        # Reusable components (15 files)
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── ImageUploader.jsx
│   │   └── ...
│   │
│   ├── pages/             # Page components (30 files)
│   │   ├── TextToImage.jsx
│   │   ├── ImageEnhance.jsx
│   │   ├── MessagesPage.jsx
│   │   └── ...
│   │
│   ├── hooks/             # Custom React hooks (4 files)
│   │   ├── useAuth.js
│   │   └── ...
│   │
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx
│   │
│   ├── layouts/           # Layout components
│   │   └── MainLayout.jsx
│   │
│   ├── routes/            # Route definitions
│   │   └── AppRoutes.jsx
│   │
│   ├── utils/             # Utility functions
│   ├── config/            # App configuration
│   │
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
│
├── index.html
├── package.json
├── vite.config.js
└── README.md              # This file
```

---

## 📱 Trang và Tính năng

### 🤖 AI Tools

| Trang | File | Mô tả |
|-------|------|-------|
| **Text to Image** | `TextToImage.jsx` | Tạo ảnh từ prompt |
| **Image Enhance** | `ImageEnhance.jsx` | Nâng cao chất lượng ảnh |
| **Background Tools** | `BackgroundTools.jsx` | Xóa/thay nền |
| **Style Transfer** | `StyleTransfer.jsx` | Chuyển phong cách nghệ thuật |
| **Face Swap** | `FaceSwap.jsx` | Hoán đổi khuôn mặt |
| **Photo Restore** | `PhotoRestore.jsx` | Phục hồi ảnh cũ |
| **Relight** | `Relight.jsx` | Thay đổi ánh sáng |
| **Image Expand** | `ImageExpand.jsx` | Mở rộng ảnh |
| **AI Chat** | `AIChat.jsx` | Chat với AI assistant |

### 🎥 Video Features

| Trang | File | Mô tả |
|-------|------|-------|
| **Image to Video** | `ImageToVideo.jsx` | Chuyển ảnh thành video |
| **Prompt to Video** | `PromptToVideo.jsx` | Tạo video từ prompt |

### 👥 Social Features

| Trang | File | Mô tả |
|-------|------|-------|
| **Messages** | `MessagesPage.jsx` | Nhắn tin realtime |
| **Notifications** | `Notifications.jsx` | Thông báo |
| **Profile** | `Profile.jsx` | Hồ sơ cá nhân |
| **User Profile** | `UserProfile.jsx` | Xem profile người khác |
| **Edit Profile** | `EditProfile.jsx` | Chỉnh sửa hồ sơ |

### 💳 Premium & Settings

| Trang | File | Mô tả |
|-------|------|-------|
| **Pricing** | `PricingPage.jsx` | Các gói dịch vụ |
| **Premium Dashboard** | `PremiumDashboard.jsx` | Dashboard premium |
| **Settings** | `Settings.jsx` | Cài đặt tài khoản |

### 🔐 Authentication

| Trang | File | Mô tả |
|-------|------|-------|
| **Login** | `LoginPage.jsx` | Đăng nhập |
| **Register** | `RegisterPage.jsx` | Đăng ký |
| **Google OAuth** | `GoogleLoadingPage.jsx` | Đăng nhập Google |
| **Verify Email** | `VerifyEmailPage.jsx` | Xác minh email |

---

## ⚙️ Cấu hình

### Biến môi trường (.env)

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

```env
# Backend AI
VITE_AI_API_URL=http://localhost:9999

# Backend Social (API Gateway)
VITE_SOCIAL_API_URL=http://localhost:8888

# WebSocket
VITE_SOCKET_URL=ws://localhost:8899

# Firebase (optional)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 🔌 API Integration

### Backend AI (Port 9999)

```javascript
// src/api/aiApi.js
import axios from 'axios';

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL + '/v1',
});

// Text to Image
export const generateImage = (data) => 
  aiApi.post('/features/image-generate/', data);

// Remove Background
export const removeBackground = (data) => 
  aiApi.post('/features/remove-background/', data);
```

### Backend Social (Port 8888)

```javascript
// src/api/authApi.js
import axios from 'axios';

const socialApi = axios.create({
  baseURL: import.meta.env.VITE_SOCIAL_API_URL,
});

// Login
export const login = (credentials) => 
  socialApi.post('/identity/auth/login', credentials);

// Get Profile
export const getProfile = (userId) => 
  socialApi.get(`/profiles/${userId}`);
```

---

## 🧪 Development

### Code Style

- ESLint với React rules
- Prettier formatting (optional)

### File Naming

- Components: `PascalCase.jsx` (e.g., `TextToImage.jsx`)
- Utilities: `camelCase.js` (e.g., `useAuth.js`)

---

## 🐛 Troubleshooting

### CORS errors

Đảm bảo backend đã cấu hình CORS cho `http://localhost:5173`

### Hot reload không hoạt động

```bash
# Xóa cache và restart
rm -rf node_modules/.vite
npm run dev
```

### Build errors

```bash
# Xóa node_modules và reinstall
rm -rf node_modules
npm install
```

---

*Frontend - AI PhotoFun Studio* 🎨
