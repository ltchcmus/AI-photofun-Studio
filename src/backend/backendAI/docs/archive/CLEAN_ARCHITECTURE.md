# 🏗️ Backend AI - Clean Architecture

## ✨ Kiến Trúc Mới (Đã Tổ Chức Lại)

### Nguyên Tắc Thiết Kế

1. **Separation of Concerns** - Mỗi service làm một việc duy nhất
2. **Single Responsibility** - Mỗi app chịu trách nhiệm cho một chức năng
3. **AI Gateway = Pure Orchestrator** - Không chứa business logic

---

## 📁 Cấu Trúc Thư Mục

```
apps/
│
├── 🎨 AI FEATURE SERVICES (Standalone, độc lập)
│   ├── image_processing/       # Xử lý ảnh cơ bản (crop, resize, filter)
│   ├── face_swap/              # Đổi khuôn mặt
│   ├── background_removal/     # Xóa phông nền
│   ├── object_removal/         # Xóa vật thể
│   ├── style_transfer/         # Chuyển đổi phong cách
│   ├── image_enhancement/      # Nâng cao chất lượng
│   ├── prompt_refinement/      # 📝 Cải thiện prompt (NEW - Tách riêng)
│   └── image_generation/       # 🎨 Sinh ảnh từ text (NEW - Tách riêng)
│
└── 🎯 AI GATEWAY (Orchestrator only)
    └── ai_gateway/
        ├── pipeline.py         # Điều phối workflow
        └── services/
            ├── intent_classification.py  # Phân loại ý định
            └── response_handler.py       # Format response
```

---

## 🔄 Luồng Hoạt Động

### Cũ (❌ Sai):
```
Frontend → AI Gateway (có business logic) → Response
                ↓
    Prompt Refinement (trong Gateway)
    Image Generation (trong Gateway)
    Face Swap (trong Gateway)
```

### Mới (✅ Đúng):
```
Frontend → AI Gateway (pure orchestrator)
               ↓
          1. Intent Classification
               ↓
          2. Call Prompt Refinement Service (apps/prompt_refinement)
               ↓
          3. Route to appropriate service:
               ├─→ Image Generation (apps/image_generation)
               ├─→ Face Swap (apps/face_swap)
               ├─→ Background Removal (apps/background_removal)
               └─→ ...
               ↓
          4. Format Response
               ↓
           Response
```

---

## 📊 Chi Tiết Các Service

### 1. Prompt Refinement Service (`apps/prompt_refinement/`)

**Nhiệm vụ:** Cải thiện prompt của user

**API Endpoints:**
```
POST /api/v1/prompt-refinement/refine/
POST /api/v1/prompt-refinement/validate/
POST /api/v1/prompt-refinement/extract-negative/
GET  /api/v1/prompt-refinement/templates/
```

**Có thể gọi từ:**
- ✅ AI Gateway
- ✅ Image Generation Service
- ✅ Bất kỳ service nào khác

**Ví dụ:**
```python
# Internal call (direct)
from apps.prompt_refinement.service import get_service
service = get_service()
result = service.refine_prompt("a cat")
# → "a cat, detailed, high quality, sharp focus"

# External call (REST API)
POST /api/v1/prompt-refinement/refine/
{
  "prompt": "a cat",
  "context": {"style": "photorealistic"}
}
```

---

### 2. Image Generation Service (`apps/image_generation/`)

**Nhiệm vụ:** Sinh ảnh từ text prompts (Stable Diffusion)

**API Endpoints:**
```
POST /api/v1/image-generation/generate/
POST /api/v1/image-generation/generate-variations/
GET  /api/v1/image-generation/status/{id}/
GET  /api/v1/image-generation/history/
```

**Có thể gọi từ:**
- ✅ AI Gateway
- ✅ Frontend (directly)
- ✅ Các service khác

**Ví dụ:**
```python
# Internal call
from apps.image_generation.service import get_service
service = get_service()
result = service.generate_image(
    prompt="fantasy dragon",
    width=1024,
    height=768
)

# External call
POST /api/v1/image-generation/generate/
{
  "prompt": "fantasy dragon",
  "width": 1024,
  "height": 768,
  "num_inference_steps": 50
}
```

---

### 3. AI Gateway (`apps/ai_gateway/`)

**Nhiệm vụ:** CHỈ điều phối, KHÔNG có business logic

**Components:**

#### a) `pipeline.py` - Orchestrator
```python
class AIGatewayPipeline:
    def process_message(message):
        # 1. Classify intent
        intent = self.intent_classifier.classify_intent(message)
        
        # 2. Call Prompt Refinement Service
        refined = call_prompt_refinement_service(message)
        
        # 3. Route to appropriate service
        if intent == 'image_generation':
            result = call_image_generation_service(refined)
        elif intent == 'face_swap':
            result = call_face_swap_service(refined, image)
        ...
        
        # 4. Format response
        return self.response_handler.format(result)
```

#### b) `services/intent_classification.py`
- Phân loại: `image_generation`, `face_swap`, `background_removal`, ...
- Extract parameters từ prompt

#### c) `services/response_handler.py`
- Format response thành chuẩn cho frontend
- Add actions (download, regenerate)
- Add suggestions

**API Endpoints:**
```
POST /api/v1/ai-gateway/chat/            # Main endpoint
GET  /api/v1/ai-gateway/sessions/
GET  /api/v1/ai-gateway/capabilities/
```

---

## 🎯 Use Cases

### Use Case 1: User Muốn Sinh Ảnh

```
1. Frontend sends:
   POST /api/v1/ai-gateway/chat/
   {
     "message": "Create a fantasy dragon"
   }

2. AI Gateway:
   ├─→ Classify intent → "image_generation"
   ├─→ Call Prompt Refinement Service
   │   └─→ "fantasy dragon, detailed, cinematic, 8k"
   ├─→ Call Image Generation Service
   │   └─→ Generate image with Stable Diffusion
   └─→ Format response

3. Frontend receives:
   {
     "type": "image",
     "image_url": "/media/generated/dragon_123.png",
     "actions": ["download", "regenerate"],
     "suggestions": ["Generate variations", "Change style"]
   }
```

### Use Case 2: Direct Call to Service

```
Frontend có thể gọi trực tiếp service nếu cần:

POST /api/v1/image-generation/generate/
{
  "prompt": "fantasy dragon, detailed, cinematic, 8k",
  "width": 1024,
  "height": 768
}

→ Bỏ qua AI Gateway, gọi thẳng Image Generation Service
```

---

## 🔧 Cấu Hình

### `settings.py`

```python
INSTALLED_APPS = [
    # Feature services (standalone)
    "apps.image_processing",
    "apps.face_swap",
    "apps.background_removal",
    "apps.object_removal",
    "apps.style_transfer",
    "apps.image_enhancement",
    "apps.prompt_refinement",   # ← Tách riêng
    "apps.image_generation",    # ← Tách riêng
    
    # Orchestration layer
    "apps.ai_gateway",           # ← Pure orchestrator
]
```

### `urls.py`

```python
urlpatterns = [
    # Standalone AI Services
    path('api/v1/image-processing/', ...),
    path('api/v1/face-swap/', ...),
    path('api/v1/background-removal/', ...),
    path('api/v1/prompt-refinement/', ...),   # ← New
    path('api/v1/image-generation/', ...),    # ← New
    
    # Orchestration Layer
    path('api/v1/ai-gateway/', ...),
]
```

---

## ✅ Lợi Ích Của Kiến Trúc Mới

### 1. **Separation of Concerns**
- Mỗi service làm một việc duy nhất
- Dễ maintain, dễ test

### 2. **Flexibility**
- Frontend có thể:
  - Gọi AI Gateway (cho chat-based UI)
  - Gọi trực tiếp service (cho feature-specific UI)

### 3. **Scalability**
- Mỗi service có thể scale riêng
- Image generation chậm → tăng số container chỉ service đó

### 4. **Reusability**
- Prompt Refinement Service có thể được gọi từ:
  - AI Gateway
  - Image Generation Service
  - Style Transfer Service
  - Bất kỳ service nào cần refine prompt

### 5. **Clear Responsibilities**
```
Prompt Refinement → Cải thiện prompt
Image Generation → Sinh ảnh
Face Swap → Đổi mặt
AI Gateway → Điều phối (orchestrate)
```

---

## 📝 So Sánh Cũ vs Mới

| Aspect | Cũ (❌) | Mới (✅) |
|--------|---------|----------|
| **Prompt Refinement** | Trong ai_gateway/services | apps/prompt_refinement (standalone) |
| **Image Generation** | Trong ai_gateway/services | apps/image_generation (standalone) |
| **AI Gateway** | Có business logic | Pure orchestrator |
| **Reusability** | Khó reuse | Dễ reuse |
| **Scalability** | Scale cả Gateway | Scale từng service riêng |
| **Testing** | Khó test riêng | Dễ test từng service |
| **Frontend Flexibility** | Chỉ qua Gateway | Qua Gateway hoặc trực tiếp |

---

## 🚀 Migration Guide

### Bước 1: Remove Old Files
```bash
# Xóa file cũ (không cần nữa)
rm apps/ai_gateway/services/prompt_refinement.py
rm apps/ai_gateway/services/image_generation.py
```

### Bước 2: Update Imports
```python
# Old (trong AI Gateway)
from .services import PromptRefinementService

# New (gọi từ standalone app)
from apps.prompt_refinement.service import get_service
```

### Bước 3: Run Migrations
```bash
python manage.py makemigrations prompt_refinement
python manage.py makemigrations image_generation
python manage.py migrate
```

### Bước 4: Test
```bash
# Test Prompt Refinement
curl -X POST http://localhost:8000/api/v1/prompt-refinement/refine/ \
  -d '{"prompt": "a cat"}'

# Test Image Generation
curl -X POST http://localhost:8000/api/v1/image-generation/generate/ \
  -d '{"prompt": "fantasy dragon"}'

# Test AI Gateway (orchestration)
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -d '{"message": "Create a fantasy dragon"}'
```

---

## 📚 Tài Liệu

- `apps/prompt_refinement/README.md` - Chi tiết về Prompt Refinement Service
- `apps/image_generation/README.md` - Chi tiết về Image Generation Service
- `apps/ai_gateway/README.md` - Chi tiết về AI Gateway
- `apps/ai_gateway/API_DOCUMENTATION.md` - API Reference

---

## 🎉 Kết Luận

Kiến trúc mới:
- ✅ **Clean** - Mỗi service một trách nhiệm
- ✅ **Flexible** - Frontend có nhiều lựa chọn
- ✅ **Scalable** - Scale từng service riêng
- ✅ **Maintainable** - Dễ maintain và test
- ✅ **Reusable** - Service có thể reuse cho nhau

AI Gateway giờ chỉ là **orchestrator** - điều phối các service, không chứa business logic!
