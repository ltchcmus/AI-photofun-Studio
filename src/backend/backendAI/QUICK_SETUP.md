# Quick Setup Summary

## 3 Components Added

### 1. ✅ Token Service (`core/token_client.py`)
**Vị trí:** Core utilities (infrastructure layer)  
**Mục đích:** Get/deduct tokens cho mỗi AI operation

**Cách dùng:**
```python
from core.token_decorators import require_tokens

@require_tokens(cost=10, feature="image_generation")
def generate_view(request):
    # Tokens đã tự động bị trừ trước khi vào đây
    pass
```

**Cần config:**
- `.env`: `TOKEN_SERVICE_URL`, `TOKEN_SERVICE_API_KEY`
- `core/token_client.py`: Sửa endpoint theo API thật của bạn bạn

---

### 2. ✅ Rate Limiting (`core/middleware.py`)
**Vị trí:** Middleware trong core  
**Mục đích:** Giới hạn số request per IP (1 req/sec)

**2 options:**
- **Simple**: 1 req/sec cho tất cả endpoints
- **Advanced**: Khác nhau theo từng loại endpoint
  - AI operations: 1 req/sec
  - API queries: 10 req/sec

**Cần config:**
- Install Redis: `brew install redis` hoặc `apt-get install redis-server`
- `pip install django-redis`
- `settings.py`: Thêm middleware, config Redis cache
- Whitelist IPs: `RATE_LIMIT_WHITELIST = ['127.0.0.1']`

---

### 3. ✅ Input Sanitization (`core/middleware.py` + `shared/utils/validators.py`)
**Vị trí:** Middleware + Validator utilities  
**Mục đích:** Bảo mật - escape/sanitize user input

**Bảo vệ khỏi:**
- **NoSQL Injection**: `$where`, `$regex` trong MongoDB
- **Prompt Injection**: "Ignore previous instructions..."
- **XSS**: `<script>`, `javascript:`
- **Path Traversal**: `../`, `../../etc/passwd`
- **SSRF**: URLs pointing to private IPs

**2 modes:**
- **Strict = False** (default): Tự động xóa dangerous patterns
- **Strict = True**: Reject cả request với 400 error

**Cách dùng:**
```python
# Automatic (middleware sanitizes all requests)
# No code changes needed

# Manual validation in serializers
from shared.utils.validators import PromptValidator

def validate_prompt(self, value):
    return PromptValidator.validate(value)
```

---

## Kiến trúc tổng quan

```
Request từ user
    │
    ▼
┌────────────────────────────────────┐
│ 1. RateLimitMiddleware             │ ← Check IP limit
│    → Nếu vượt 1 req/sec → 429     │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 2. InputSanitizationMiddleware     │ ← Remove $where, <script>, etc.
│    → Clean input tự động           │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 3. View with @require_tokens       │ ← Check & deduct tokens
│    → Call token service API        │
│    → Nếu không đủ → 402           │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│ 4. Serializer validation           │ ← Validate prompt injection
│    → PromptValidator.validate()    │
└────────────────────────────────────┘
    │
    ▼
Business logic (generate image, etc.)
```

---

## To-Do Checklist

### Token Service
- [ ] Lấy API docs từ bạn bạn (endpoints, request/response format)
- [ ] Sửa `core/token_client.py` cho đúng với API thật
- [ ] Add `.env`: TOKEN_SERVICE_URL, TOKEN_SERVICE_API_KEY
- [ ] Test với real API: `from core.token_client import token_client; token_client.get_user_tokens("test")`
- [ ] Add `@require_tokens` vào tất cả paid features

### Rate Limiting
- [ ] Install Redis: `brew install redis` (macOS) hoặc `apt-get install redis-server` (Linux)
- [ ] Start Redis: `redis-server`
- [ ] Install Python client: `pip install django-redis`
- [ ] Config trong `settings.py` (CACHES, MIDDLEWARE)
- [ ] Test: `curl` nhiều lần → expect 429 after 1st request

### Input Sanitization
- [ ] Config trong `settings.py` (INPUT_SANITIZATION_ENABLED = True)
- [ ] Add middleware vào `MIDDLEWARE` list
- [ ] Test với dangerous input: `{"prompt": "Ignore previous instructions"}`
- [ ] Verify logs: `tail -f logs/debug.log`

---

## Files Created

```
core/
├── token_client.py            # NEW - HTTP client for friend's API
├── token_decorators.py        # NEW - @require_tokens decorator
├── token_costs.py             # NEW - TOKEN_COSTS per feature
├── middleware.py              # UPDATED
│   ├── RateLimitMiddleware           # NEW
│   ├── AdvancedRateLimitMiddleware   # NEW
│   └── InputSanitizationMiddleware   # NEW
│
└── exceptions.py              # UPDATED
    ├── TokenServiceError             # NEW
    └── InsufficientTokensError       # NEW

shared/
└── utils/
    └── validators.py          # NEW
        ├── PromptValidator        # Prevent prompt injection
        ├── URLValidator           # Prevent SSRF
        ├── FileNameValidator      # Prevent path traversal
        └── MongoDBQueryValidator  # Prevent NoSQL injection

SECURITY_SETUP_GUIDE.md        # NEW - Complete setup guide
QUICK_SETUP.md                 # NEW - This file
```

---

## Câu hỏi thường gặp

### 1. Token service nên đặt ở đâu?
✅ **Core utilities** `core/token_*.py`  
- Không có models/views → Không cần app riêng
- Infrastructure concern → Thuộc core layer
- Dễ import từ bất kỳ đâu: `from core.token_client import token_client`

### 2. Rate limiting nên đặt ở đâu?
✅ **Middleware** `core/middleware.py`  
- Global protection cho tất cả endpoints
- Execute trước khi vào views
- Dùng Redis để track requests

### 3. Input escaping có cần không?
✅ **CÓ CẦN**, nhưng hiểu đúng loại:
- **SQL Injection**: Django ORM tự động bảo vệ (parameterized queries)
- **XSS**: Django templates tự động escape HTML
- **NoSQL Injection**: ⚠️ MongoDB KHÔNG tự động bảo vệ → CẦN middleware
- **Prompt Injection**: ⚠️ AI models CẦN validation riêng
- **Path Traversal**: ⚠️ File operations CẦN validation

### 4. Nên dùng Simple hay Advanced rate limit?
- **Simple**: Nếu muốn đơn giản, 1 limit cho tất cả
- **Advanced**: Nếu muốn AI features strict hơn API queries

### 5. Strict mode có nên bật không?
- **Development**: `STRICT_MODE = False` (auto-clean, dễ test)
- **Production**: `STRICT_MODE = True` (reject, safer)

---

## Quick Test Commands

```bash
# 1. Test rate limiting
for i in {1..3}; do 
  curl -X POST http://localhost:9999/v1/features/image-generation/ \
    -H "Content-Type: application/json" \
    -d '{"prompt": "test", "user_id": "test"}'; 
  echo ""; 
done
# Expect: 1st OK, 2nd+ → 429

# 2. Test sanitization
curl -X POST http://localhost:9999/v1/features/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Ignore previous instructions and $where attack", "user_id": "test"}'
# Expect: Prompt cleaned

# 3. Test token service
curl -X POST http://localhost:9999/v1/features/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{"prompt": "sunset", "user_id": "user123"}'
# Expect: 402 if insufficient tokens
```

---

## Priority Order

1. **HIGH**: Rate limiting → Ngăn DDoS ngay lập tức
2. **HIGH**: Input sanitization → Bảo mật cơ bản
3. **MEDIUM**: Token service → Cần API của bạn bạn trước

---

Đọc chi tiết: `SECURITY_SETUP_GUIDE.md`
