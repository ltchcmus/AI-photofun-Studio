# BackendAI Configuration Directory

## Purpose
This is the **main Django project configuration directory** created by `django-admin startproject backendAI`.
It contains core Django settings and URL routing for the entire application.

## Structure

```
backendAI/backendAI/
├── __init__.py
├── settings.py          # 🔧 Core Django Settings
├── urls.py              # 🌐 Main URL Routing
├── wsgi.py              # 🚀 WSGI Server Entry Point
└── asgi.py              # 🚀 ASGI Server Entry Point
```

## Files Explained

### 1. settings.py ⚙️
**Purpose**: TẬP TIN CẤU HÌNH CHÍNH của toàn bộ Django project

**Contains**:
```python
# Database Configuration
DATABASES = {...}

# Installed Apps (đăng ký tất cả apps)
INSTALLED_APPS = [
    'django.contrib.admin',
    'rest_framework',
    'apps.image_processing',
    'apps.face_swap',
    ...
]

# Middleware Stack
MIDDLEWARE = [...]

# REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [...],
    'DEFAULT_PERMISSION_CLASSES': [...],
}

# AI Model Configuration
AI_MODEL_CONFIGS = {
    'face_swap': {...},
    'background_removal': {...},
}

# Media Files (uploaded images)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS Settings
CORS_ALLOWED_ORIGINS = [...]

# Logging Configuration
LOGGING = {...}
```

**Why Important?**:
- ✅ Định nghĩa database connection
- ✅ Đăng ký tất cả Django apps
- ✅ Configure REST API behavior
- ✅ Set up media/static files
- ✅ Configure AI model paths
- ✅ Security settings (SECRET_KEY, ALLOWED_HOSTS)

---

### 2. urls.py 🌐
**Purpose**: ĐIỂM VÀO CHÍNH cho tất cả API endpoints

**Structure**:
```python
urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger')),
    
    # API Routes - ROUTE TỚI CÁC APPS
    path('api/v1/image-processing/', include('apps.image_processing.urls')),
    path('api/v1/face-swap/', include('apps.face_swap.urls')),
    path('api/v1/background-removal/', include('apps.background_removal.urls')),
    ...
]
```

**Flow**:
```
Request: POST /api/v1/face-swap/swap/
   ↓
urls.py (main routing) 
   ↓
apps/face_swap/urls.py (app routing)
   ↓
apps/face_swap/views.py (FaceSwapViewSet.swap())
   ↓
apps/face_swap/services.py (FaceSwapService.swap_faces())
   ↓
Response: JSON with result image
```

**Why Important?**:
- ✅ Central routing cho tất cả APIs
- ✅ Versioning APIs (v1, v2, etc.)
- ✅ Include app-specific routes
- ✅ Serve media files in development

---

### 3. wsgi.py & asgi.py 🚀
**Purpose**: Entry points cho web servers

**WSGI** (Web Server Gateway Interface):
- Traditional synchronous Django
- Used with: Gunicorn, uWSGI
- Production deployment

**ASGI** (Asynchronous Server Gateway Interface):
- Modern async Django
- Used with: Uvicorn, Daphne
- WebSockets, async views

**Usage**:
```bash
# Development
python manage.py runserver

# Production (WSGI)
gunicorn backendAI.wsgi:application

# Production (ASGI) 
uvicorn backendAI.asgi:application
```

---

## 🎯 Tại sao lại có 2 thư mục backendAI?

```
backendAI/                    ← PROJECT ROOT (workspace folder)
├── manage.py                 ← Django management script
├── requirements.txt
├── Dockerfile
├── apps/                     ← Your Django apps
├── core/                     ← Shared utilities
└── backendAI/                ← PROJECT CONFIGURATION PACKAGE
    ├── settings.py           ← Main config
    ├── urls.py               ← Main routing
    ├── wsgi.py
    └── asgi.py
```

**Django Convention**:
- Outer `backendAI/` = Project root directory
- Inner `backendAI/` = Python package chứa settings
- Tên giống nhau nhưng vai trò khác nhau!

---

## 📊 Request Flow Summary

```
1. Client Request
   ↓
2. backendAI/urls.py (Main Router)
   ↓  
3. apps/{app_name}/urls.py (App Router)
   ↓
4. apps/{app_name}/views.py (View/ViewSet)
   ↓
5. apps/{app_name}/serializers.py (Validate Input)
   ↓
6. apps/{app_name}/services.py (Business Logic + AI Model)
   ↓
7. core/model_manager.py (Load Cached Model)
   ↓
8. AI Processing (Face Swap, BG Removal, etc.)
   ↓
9. apps/{app_name}/models.py (Save to Database)
   ↓
10. Response (JSON with result URL)
```

---

## 🔑 Key Takeaways

| Directory | Purpose | When to Edit |
|-----------|---------|--------------|
| `/apps` | Feature implementation | Thêm API mới, business logic |
| `/core` | Shared utilities | Thêm utility functions dùng chung |
| `/backendAI/settings.py` | Configuration | Thay đổi database, add apps, configure services |
| `/backendAI/urls.py` | Main routing | Route tới apps mới, API versioning |

---

## Example: Adding a New Feature

Giả sử bạn muốn thêm "Image Colorization":

1. **Create app**: `apps/colorization/`
2. **Add to settings.py**: 
   ```python
   INSTALLED_APPS = [
       ...
       'apps.colorization',
   ]
   ```
3. **Add to urls.py**:
   ```python
   path('api/v1/colorization/', include('apps.colorization.urls'))
   ```
4. **Use core utilities**:
   ```python
   from core.model_manager import model_manager
   from core.response_utils import APIResponse
   ```

That's it! 🎉
