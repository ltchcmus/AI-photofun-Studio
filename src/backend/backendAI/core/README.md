# Core Package Documentation

## Purpose
The `/core` directory contains shared utilities and components used across all Django apps.
This follows the DRY (Don't Repeat Yourself) principle and centralizes common functionality.

## Structure

```
core/
├── __init__.py
├── model_manager.py      # AI Model Loading & Caching
├── file_handler.py       # File Upload & Validation
├── response_utils.py     # Standardized API Responses
├── middleware.py         # Custom Middleware
└── exceptions.py         # Custom Exception Handlers
```

## Components Explained

### 1. model_manager.py
**Purpose**: Quản lý việc load và cache các AI models
**Why?**: 
- AI models rất nặng (vài GB), không thể load mỗi lần request
- Cần singleton pattern để tái sử dụng model đã load
- Tập trung quản lý model paths, GPU configuration

**Usage Example**:
```python
from core.model_manager import model_manager

# In face_swap service
model = model_manager.load_model('face_swap_model', FaceSwapModel, use_gpu=True)
```

### 2. file_handler.py
**Purpose**: Xử lý file upload, validation, temporary storage
**Why?**: 
- Validate kích thước, định dạng ảnh trước khi xử lý
- Tránh lặp code validation ở mỗi app
- Xử lý temporary files an toàn

**Usage Example**:
```python
from core.file_handler import FileHandler

# Validate uploaded image
is_valid, error = FileHandler.validate_image(uploaded_file, max_size_mb=10)
if not is_valid:
    raise ValidationError(error)
```

### 3. response_utils.py
**Purpose**: Chuẩn hóa format API response
**Why?**: 
- Frontend cần format response nhất quán
- Dễ dàng xử lý error handling
- Tạo structure chuẩn cho success/error responses

**Usage Example**:
```python
from core.response_utils import APIResponse

# Success response
return APIResponse.success(
    data={'result_url': result_image.url},
    message='Face swap completed'
)

# Error response
return APIResponse.error(
    message='Processing failed',
    errors={'detail': str(e)}
)
```

### 4. middleware.py
**Purpose**: Custom middleware cho logging, CORS, etc.
**Why?**: 
- Log tất cả requests/responses cho debugging
- Handle CORS nếu cần custom logic
- Measure request processing time

**Auto-applied**: Được config trong settings.py MIDDLEWARE

### 5. exceptions.py
**Purpose**: Custom exception handler cho Django REST Framework
**Why?**: 
- Wrap tất cả exceptions thành format chuẩn
- Log errors tự động
- Return user-friendly error messages

**Auto-applied**: Được config trong REST_FRAMEWORK settings

## Benefits
✅ **Code Reusability**: Không lặp lại code ở nhiều apps
✅ **Consistency**: Format responses, error handling giống nhau
✅ **Maintainability**: Sửa 1 chỗ, áp dụng cho tất cả apps
✅ **Performance**: Model caching, file optimization
✅ **Security**: Centralized validation và security checks
