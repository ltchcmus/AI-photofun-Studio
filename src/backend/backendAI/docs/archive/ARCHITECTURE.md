# 🏗️ Backend AI Architecture Overview

## 📊 Tóm Tắt Nhanh

### 3 Thành Phần Chính

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND AI                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. /apps         → Django Apps (Features)              │
│     Mỗi tính năng AI là 1 app độc lập                   │
│                                                          │
│  2. /core         → Shared Utilities                    │
│     Các function dùng chung cho tất cả apps             │
│                                                          │
│  3. /backendAI    → Project Configuration              │
│     Settings, URL routing, WSGI/ASGI                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ /apps - Django Applications (Features)

### Vai Trò
✅ Implement các tính năng AI cụ thể  
✅ Mỗi app = 1 module độc lập, có thể bật/tắt riêng  
✅ Chứa models, views, serializers, business logic  

### Structure của 1 App

```
apps/face_swap/
├── __init__.py
├── apps.py           # App configuration
├── models.py         # 💾 Database models (lưu lịch sử, metadata)
├── serializers.py    # 📋 Validate input/output
├── views.py          # 🌐 API endpoints (ViewSets)
├── services.py       # 🧠 Business logic + AI processing
├── urls.py           # 🔗 URL routing cho app này
└── admin.py          # 🛠️ Django admin interface
```

### Ví Dụ Flow Trong 1 App

```python
# 1. Client gửi request
POST /api/v1/face-swap/swap/
{
  "source_image": <file>,
  "target_image": <file>,
  "blend_ratio": 0.8
}

# 2. urls.py route đến view
router.register(r'', FaceSwapViewSet)

# 3. views.py nhận request
@action(detail=False, methods=['post'])
def swap(self, request):
    # Validate với serializer
    serializer = FaceSwapUploadSerializer(data=request.data)
    
    # 4. Call service để xử lý
    service = FaceSwapService()
    result = service.swap_faces(source, target, blend_ratio)
    
    # 5. Lưu kết quả vào database
    face_swap_request.result_image = result
    face_swap_request.save()
    
    # 6. Return response
    return Response(serializer.data)
```

### Các Apps Hiện Có

| App | Status | Description |
|-----|--------|-------------|
| `image_processing` | ✅ Ready | Resize, crop, rotate, filter |
| `face_swap` | ✅ Ready | AI face swapping |
| `background_removal` | ✅ Ready | Remove backgrounds |
| `object_removal` | 🚧 Placeholder | AI inpainting (LaMa) |
| `style_transfer` | 🚧 Placeholder | Neural style transfer |
| `image_enhancement` | 🚧 Placeholder | Super resolution |

---

## 2️⃣ /core - Shared Utilities

### Vai Trò
✅ Tránh lặp code giữa các apps  
✅ Centralized utilities cho toàn project  
✅ Single source of truth cho common logic  

### Components

```
core/
├── model_manager.py    # 🧠 Load & cache AI models
├── file_handler.py     # 📁 File validation & handling
├── response_utils.py   # 📤 Standardized API responses
├── middleware.py       # ⚙️ Request logging, CORS
└── exceptions.py       # ❌ Custom error handlers
```

### Tại Sao Cần /core?

**Không có /core (Bad)**:
```python
# apps/face_swap/services.py
def validate_image(image):
    if image.size > 10MB:
        raise Error("Too large")

# apps/background_removal/services.py  
def validate_image(image):
    if image.size > 10MB:  # ← Lặp lại code!
        raise Error("Too large")

# apps/image_processing/services.py
def validate_image(image):
    if image.size > 10MB:  # ← Lặp lại code!
        raise Error("Too large")
```

**Có /core (Good)**:
```python
# core/file_handler.py
class FileHandler:
    @staticmethod
    def validate_image(image, max_size_mb=10):
        if image.size > max_size_mb * 1024 * 1024:
            raise ValidationError("Too large")
        # ... more validation logic
        return True

# Tất cả apps dùng chung
from core.file_handler import FileHandler

FileHandler.validate_image(uploaded_image)
```

### Real-World Examples

#### 1. Model Manager
```python
# apps/face_swap/services.py
from core.model_manager import model_manager

class FaceSwapService:
    def __init__(self):
        # Load model 1 lần, cache lại
        self.model = model_manager.load_model(
            'insightface',
            InsightFaceModel,
            use_gpu=True
        )
    
    def swap_faces(self, source, target):
        # Model đã được cache, không load lại
        return self.model.process(source, target)
```

#### 2. Response Utils
```python
# apps/*/views.py
from core.response_utils import APIResponse

# Tất cả apps return cùng 1 format
return APIResponse.success(
    data={'result_url': url},
    message='Processing completed'
)

return APIResponse.error(
    message='Processing failed',
    errors={'detail': str(e)}
)
```

---

## 3️⃣ /backendAI/backendAI - Project Configuration

### Vai Trò
✅ Cấu hình tổng thể cho Django project  
✅ Main URL routing  
✅ Settings cho database, apps, middleware  
✅ Entry point cho web server  

### Tại Sao Có 2 Thư Mục Tên Giống Nhau?

```
backendAI/              ← PROJECT ROOT (folder chứa project)
│
├── manage.py           ← Django CLI
├── apps/               ← Your code
├── core/               ← Your utilities
│
└── backendAI/          ← PROJECT PACKAGE (Python package)
    ├── settings.py     ← Configuration file
    ├── urls.py         ← Main router
    ├── wsgi.py         ← Web server interface
    └── asgi.py         ← Async server interface
```

**Lý Do**: Django convention! Khi chạy `django-admin startproject backendAI`, nó tạo:
- Outer folder: Project root
- Inner folder: Python package chứa settings

### settings.py - Trái Tim Của Project

```python
# settings.py chứa MỌI THỨ:

# 1. Đăng ký apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'rest_framework',
    'apps.image_processing',  # ← Register apps ở đây
    'apps.face_swap',
    ...
]

# 2. Database config
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'backendai_db',
        ...
    }
}

# 3. REST API config
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [...],
    'DEFAULT_PAGINATION_CLASS': ...,
}

# 4. AI Model config
AI_MODEL_CONFIGS = {
    'face_swap': {
        'model_path': 'ml_models/face_swap',
        'use_gpu': True,
    },
}

# 5. CORS, Media, Static, Logging, ...
```

### urls.py - Main Router

```python
# urls.py là ĐIỂM VÀO duy nhất cho tất cả requests

urlpatterns = [
    path('admin/', admin.site.urls),
    path('swagger/', schema_view.with_ui('swagger')),
    
    # Route đến các apps
    path('api/v1/image-processing/', include('apps.image_processing.urls')),
    path('api/v1/face-swap/', include('apps.face_swap.urls')),
    path('api/v1/background-removal/', include('apps.background_removal.urls')),
]
```

**Request Flow**:
```
1. Client: POST /api/v1/face-swap/swap/
   ↓
2. backendAI/urls.py: "api/v1/face-swap/" → include('apps.face_swap.urls')
   ↓
3. apps/face_swap/urls.py: "swap/" → FaceSwapViewSet.swap()
   ↓
4. apps/face_swap/views.py: Execute view logic
   ↓
5. Response
```

---

## 🔄 Complete Request Flow

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Frontend)                                       │
│  POST /api/v1/face-swap/swap/                           │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  1. backendAI/urls.py (Main Router)                     │
│     path('api/v1/face-swap/', include(...))             │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. apps/face_swap/urls.py (App Router)                 │
│     router.register(r'', FaceSwapViewSet)               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. apps/face_swap/views.py (ViewSet)                   │
│     @action(methods=['post'])                           │
│     def swap(self, request): ...                        │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. apps/face_swap/serializers.py (Validation)          │
│     FaceSwapUploadSerializer.is_valid()                 │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. apps/face_swap/services.py (Business Logic)         │
│     FaceSwapService.swap_faces()                        │
│     ├── Use core/model_manager (load AI model)          │
│     ├── Use core/file_handler (validate files)          │
│     └── AI Processing                                   │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  6. apps/face_swap/models.py (Database)                 │
│     FaceSwapRequest.objects.create(...)                 │
│     Save result to DB                                   │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  7. core/response_utils.py (Response)                   │
│     APIResponse.success(data=...)                       │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Frontend)                                       │
│  {                                                       │
│    "success": true,                                      │
│    "data": {"result_image": "/media/result.png"}        │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Khi Nào Edit File Nào?

| Mục Đích | File | Lý Do |
|----------|------|-------|
| Thêm API endpoint mới | `apps/{app}/views.py` | Implement logic |
| Thêm database table | `apps/{app}/models.py` | Define schema |
| Validate request data | `apps/{app}/serializers.py` | Input validation |
| AI processing logic | `apps/{app}/services.py` | Business logic |
| Thêm utility function | `core/*.py` | Share across apps |
| Thêm app mới | `backendAI/settings.py` | Register app |
| Thêm route mới | `backendAI/urls.py` | Main routing |
| Config database | `backendAI/settings.py` | DB settings |
| Config AI models | `backendAI/settings.py` | Model paths |

---

## 🚀 Quick Start Guide

### 1. Cài Đặt
```bash
# Clone và setup
cd src/backend/backendAI
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Cấu Hình
```bash
# Copy environment file
cp .env.example .env

# Edit settings
nano .env
```

### 3. Chạy
```bash
# Migrate database
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver

# Access:
# - API: http://localhost:8000/api/v1/
# - Admin: http://localhost:8000/admin/
# - Docs: http://localhost:8000/swagger/
```

---

## 📚 Resources

- **README.md** - Hướng dẫn đầy đủ
- **core/README.md** - Chi tiết về core utilities
- **backendAI/README.md** - Chi tiết về project config
- **Swagger Docs** - API documentation tự động

---

**Chúc bạn code vui! 🎉**
