# XỬ LÝ LỖI FREEPIK API

## Lỗi bạn gặp: Error 500

```
ERROR 2025-12-17 23:43:20,270 freepik_client Freepik API HTTP error: 500
ERROR 2025-12-17 23:43:20,270 services Image generation failed: Freepik API error: 500
```

### ✅ **KHÔNG PHẢI LỖI CODE CỦA BẠN!**

Lỗi 500 là lỗi server của Freepik API. Theo response HTML:
```
"Something is going on in the Universe..."
"It seems like we're having some difficulties with the server"
```

## Nguyên nhân có thể:

1. **Freepik API đang bảo trì hoặc gặp sự cố**
2. **API key đã hết quota** (số lượng request miễn phí đã hết)
3. **Server Freepik quá tải**
4. **API key không hợp lệ hoặc bị khóa**

## Giải pháp:

### 1. Kiểm tra API Key
```bash
# Xem API key hiện tại trong .env
cat .env | grep FREEPIK_API_KEY
```

Hoặc kiểm tra trong code:
```python
# core/freepik_client.py line 38
self.api_key = getattr(settings, 'FREEPIK_API_KEY', 'FPSX3d8830ff41ace804badb3f71265b89bd')
```

### 2. Kiểm tra trạng thái Freepik API

Truy cập: https://www.freepik.com/api/status

Hoặc test API key:
```bash
curl -X GET "https://api.freepik.com/v1/ai/mystic/status" \
  -H "x-freepik-api-key: YOUR_API_KEY"
```

### 3. Đợi một lúc và thử lại

Lỗi 500 thường tạm thời. Đợi 5-10 phút rồi thử lại.

### 4. Dùng API key khác

Nếu key hiện tại hết quota, đăng ký key mới:
- https://www.freepik.com/api

Cập nhật trong `.env`:
```bash
FREEPIK_API_KEY=YOUR_NEW_KEY
```

### 5. Retry Mechanism (Đã cập nhật)

Code đã được cập nhật để tự động retry 3 lần với exponential backoff:
- Lần 1: Thử ngay
- Lần 2: Đợi 1 giây rồi thử
- Lần 3: Đợi 2 giây rồi thử
- Lần 4: Đợi 4 giây rồi thử

## Các loại lỗi Freepik API:

### 400 - Bad Request
- Payload không đúng format
- Thiếu tham số bắt buộc

### 401 - Unauthorized
- API key không hợp lệ
- API key chưa được set

### 403 - Forbidden
- API key bị khóa hoặc hết hạn
- Không có quyền truy cập endpoint

### 429 - Too Many Requests
- Vượt quá rate limit
- Cần đợi hoặc upgrade plan

### 500 - Internal Server Error
- **Lỗi server Freepik** (như bạn gặp)
- Không phải lỗi của code
- Retry hoặc đợi

### 503 - Service Unavailable
- Freepik đang bảo trì
- Server tạm thời không khả dụng

## Test thử API:

```bash
cd /path/to/backendAI
python3 manage.py shell

# Test Freepik client
from core.freepik_client import freepik_client
result = freepik_client.generate_image_mystic(
    prompt="A cat",
    aspect_ratio="square_1_1"
)
print(result)
```

## Kiểm tra log chi tiết:

```bash
tail -f logs/django.log
```

## Alternative: Mock API response cho development

Nếu Freepik API liên tục lỗi, tạm thời mock response:

```python
# core/freepik_client.py
def generate_image_mystic(self, prompt: str, **kwargs):
    # TEMPORARY: Mock for development
    if settings.DEBUG:
        return {
            "task_id": "mock-task-id",
            "status": "CREATED",
            "generated": ["https://via.placeholder.com/512"]
        }
    # Real API call...
```

## Contact Support

Nếu lỗi kéo dài:
- Email: support@freepik.com
- Subject: "Error 500 - API Key: YOUR_KEY"
