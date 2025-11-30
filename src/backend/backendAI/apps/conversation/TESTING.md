# 🧪 Test Conversation API

Hướng dẫn test Conversation API với giao diện chat đơn giản.

## 📋 Chuẩn bị

### 1. Cài đặt dependencies

Đảm bảo bạn đã cài đặt pymongo:

```bash
cd src/backend/backendAI
pip install pymongo
```

### 2. Cấu hình MongoDB

Thêm biến môi trường `MONGO_URI` vào file `.env`:

```bash
# src/backend/backendAI/.env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ai_photofun_studio
```

Hoặc chỉnh sửa trong `backendAI/settings.py`:

```python
# Thêm vào settings.py nếu chưa có
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'ai_photofun_studio')
```

### 3. Đăng ký app conversation

Thêm vào `INSTALLED_APPS` trong `backendAI/settings.py`:

```python
INSTALLED_APPS = [
    # ... các apps khác
    "apps.conversation",  # Thêm dòng này
]
```

### 4. Đăng ký URLs

Thêm vào `backendAI/urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... các urls khác
    path('api/v1/conversation/', include('apps.conversation.urls')),
]
```

### 5. Cấu hình CORS (quan trọng!)

Trong `backendAI/settings.py`, đảm bảo CORS cho phép localhost:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Thêm null để cho phép file:// protocol
]

# Hoặc trong development, bạn có thể dùng:
CORS_ALLOW_ALL_ORIGINS = True  # CHỈ DÙNG TRONG DEVELOPMENT!
```

## 🚀 Chạy Backend

### Bước 1: Start MongoDB

```bash
# Nếu dùng Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc start MongoDB service trên máy
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # Mac
```

### Bước 2: Migrate Database (nếu cần)

```bash
cd src/backend/backendAI
python manage.py makemigrations
python manage.py migrate
```

### Bước 3: Start Django Server

```bash
python manage.py runserver
```

Server sẽ chạy tại: `http://localhost:8000`

## 🖥️ Mở Chat Interface

### Cách 1: Mở trực tiếp file HTML

```bash
cd src/backend/backendAI/apps/conversation
# Mở file chat_test.html bằng browser
xdg-open chat_test.html  # Linux
open chat_test.html      # Mac
start chat_test.html     # Windows
```

### Cách 2: Serve qua HTTP server

```bash
cd src/backend/backendAI/apps/conversation
python -m http.server 8080
```

Sau đó mở: `http://localhost:8080/chat_test.html`

## 📝 Cách sử dụng Chat Interface

### 1. Kết nối Session

- **API Base URL**: Mặc định là `http://localhost:8000/api/v1/conversation`
- **Session ID**: Tự động generate hoặc nhập manual (vd: `user-123-chat`)
- Click nút **🔌 Connect** để tạo/kết nối session

### 2. Gửi tin nhắn

- Gõ tin nhắn vào ô input
- Nhấn **Enter** hoặc click nút **➤** để gửi
- Bot sẽ tự động phản hồi (simulated response)

### 3. Chức năng khác

- **🔄 Reload**: Tải lại conversation từ server
- **🗑️ Clear**: Xóa chat và reset session
- **✏️ Sửa**: Chỉnh sửa tin nhắn đã gửi
- **🗑️ Xóa**: Xóa một tin nhắn cụ thể

## 🧪 Test Manual với curl

### 1. Tạo session mới

```bash
curl -X POST http://localhost:8000/api/v1/conversation/ \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123"}'
```

**Response:**
```json
{
  "session_id": "test-123",
  "messages": [],
  "created_at": "2025-11-05T10:30:00Z"
}
```

### 2. Gửi tin nhắn

```bash
curl -X POST http://localhost:8000/api/v1/conversation/test-123/message/ \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "Hello, this is a test message!"
  }'
```

**Response:**
```json
{
  "message_id": "auto-generated-uuid",
  "role": "user",
  "content": "Hello, this is a test message!",
  "created_at": "2025-11-05T10:31:00Z"
}
```

### 3. Lấy toàn bộ conversation

```bash
curl http://localhost:8000/api/v1/conversation/test-123/
```

### 4. List tất cả sessions

```bash
curl "http://localhost:8000/api/v1/conversation/?limit=10&skip=0"
```

### 5. Sửa tin nhắn

```bash
curl -X PATCH http://localhost:8000/api/v1/conversation/test-123/messages/MESSAGE_ID/ \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated message content"}'
```

### 6. Xóa tin nhắn

```bash
curl -X DELETE http://localhost:8000/api/v1/conversation/test-123/messages/MESSAGE_ID/
```

## 🐛 Troubleshooting

### Lỗi: CORS blocked

**Triệu chứng:**
```
Access to fetch at 'http://localhost:8000/...' from origin 'null' has been blocked by CORS policy
```

**Giải pháp:**
- Thêm CORS configuration trong `settings.py` (xem phần Cấu hình CORS ở trên)
- Hoặc dùng `python -m http.server` để serve HTML file thay vì mở trực tiếp

### Lỗi: Connection refused

**Triệu chứng:**
```
Failed to fetch: Connection refused
```

**Giải pháp:**
- Kiểm tra Django server đang chạy: `python manage.py runserver`
- Kiểm tra URL đúng: `http://localhost:8000`
- Kiểm tra firewall không block port 8000

### Lỗi: MongoDB not configured

**Triệu chứng:**
```
Requested setting MONGO_URI, but settings are not configured
```

**Giải pháp:**
- Thêm `MONGO_URI` vào `.env` hoặc `settings.py`
- Restart Django server

### Lỗi: 404 Not Found

**Triệu chứng:**
```
HTTP 404: /api/v1/conversation/
```

**Giải pháp:**
- Kiểm tra đã thêm conversation URLs vào `backendAI/urls.py`
- Kiểm tra đã thêm `apps.conversation` vào `INSTALLED_APPS`
- Restart Django server

## ✅ Checklist kiểm tra nhanh

- [ ] MongoDB đang chạy
- [ ] Django server đang chạy (`python manage.py runserver`)
- [ ] CORS đã được cấu hình
- [ ] `apps.conversation` đã được thêm vào `INSTALLED_APPS`
- [ ] URLs đã được đăng ký trong `backendAI/urls.py`
- [ ] `MONGO_URI` đã được cấu hình trong settings
- [ ] Chat interface đã mở được trong browser

## 📊 Expected Behavior

Khi test thành công, bạn sẽ thấy:

1. ✅ Kết nối session thành công
2. ✅ Gửi tin nhắn và nhận response
3. ✅ Tin nhắn được lưu vào MongoDB
4. ✅ Reload conversation hiển thị đúng history
5. ✅ Edit/Delete message hoạt động
6. ✅ Không có lỗi CORS
7. ✅ Status messages hiển thị đúng

## 🎯 Next Steps

Sau khi test thành công với chat interface, bạn có thể:

1. **Tích hợp AI service**: Thay thế simulated bot response bằng real AI call
2. **Thêm authentication**: Implement JWT/session auth
3. **Add WebSocket**: Cho real-time chat
4. **Add file upload**: Cho image_url field
5. **Add rate limiting**: Prevent abuse
6. **Write unit tests**: Test coverage cho API endpoints

## 📚 Tài liệu tham khảo

- API Documentation: `apps/conversation/API_DOCUMENTATION.md`
- Django Views: https://docs.djangoproject.com/en/5.0/topics/http/views/
- MongoDB Python: https://pymongo.readthedocs.io/
- DRF Serializers: https://www.django-rest-framework.org/api-guide/serializers/
