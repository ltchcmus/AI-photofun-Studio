# Intent Router

Centralized routing module để điều phối requests đến các AI feature services dựa trên intent.

## 🎯 Mục Đích

Intent Router giúp:
- ✅ Tách biệt logic routing khỏi business logic
- ✅ Dễ dàng thêm/sửa/xóa features
- ✅ Tập trung quản lý intent mapping
- ✅ Hỗ trợ Celery task chaining

## 📋 Supported Intents

| Intent Code | Feature | App Name |
|-------------|---------|----------|
| `image_generate` | Generate images from text | `image_generation` |
| `upscale` | Enhance image resolution | `upscale` |
| `remove_background` | Remove image background | `remove_background` |
| `relight` | Adjust image lighting | `relight` |
| `style_transfer` | Transfer artistic style | `style_transfer` |
| `reimagine` | Reimagine with new prompt | `reimagine` |
| `image_expand` | Expand image boundaries | `image_expand` |

## 🚀 Usage

### Basic Routing

```python
from apps.intent_router import IntentRouter

# Route request to appropriate service
task_chain = IntentRouter.route(
    intent="image_generate",
    payload={
        "prompt": "A sunset over mountains",
        "aspect_ratio": "16:9",
        "style_reference": "https://..."
    },
    context={
        "session_id": "abc123",
        "user_id": "user456"
    }
)

# Execute async
result = task_chain.apply_async()
```

### Integration with Conversation Service

```python
from apps.intent_router import IntentRouter
from apps.prompt_service.celery_tasks import process_prompt_task
from celery import chain

def process_message(session_id, message):
    """
    Process user message with automatic routing
    """
    # Step 1: Refine prompt and detect intent
    prompt_result = process_prompt_task.delay({
        "prompt": message["content"]
    }).get()
    
    # Step 2: Route based on detected intent
    intent = prompt_result["result"]["intent"]
    refined_prompt = prompt_result["result"]["refined_prompt"]
    
    task_chain = IntentRouter.route(
        intent=intent,
        payload={
            "prompt": refined_prompt,
            **message.get("parameters", {})
        },
        context={"session_id": session_id}
    )
    
    return task_chain.apply_async()
```

## 📦 Feature-Specific Payloads

### 1. Image Generation
```python
payload = {
    "prompt": str,                    # Required
    "aspect_ratio": str,              # Optional: "1:1", "16:9", "9:16", etc.
    "style_reference": str            # Optional: URL của ảnh style reference
}
```

### 2. Upscale
```python
payload = {
    "image": str,                     # Required: URL hoặc base64
    "flavor": str                     # Required: "sublime", "photo", "photo_denoiser"
}
```

**Upscale Flavors:**
- `sublime`: Cho artwork, concept art, 3D renders
- `photo`: Cho portraits, product photos, real-life images
- `photo_denoiser`: Cho ảnh bị noise (low light, high ISO)

### 3. Remove Background
```python
payload = {
    "image": str                      # Required: URL hoặc base64
}
```

### 4. Relight
```python
payload = {
    "prompt": str,                    # Required: Mô tả lighting mong muốn
    "image": str,                     # Required: URL hoặc base64
    "transfer_light_from_reference_image": str  # Optional: URL ảnh reference
}
```

### 5. Style Transfer
```python
payload = {
    "image": str,                     # Required: Ảnh gốc
    "reference_image": str,           # Required: Ảnh style reference
    "prompt": str                     # Optional: Mô tả thêm
}
```

### 6. Reimagine
```python
payload = {
    "image": str,                     # Required: Ảnh gốc
    "prompt": str                     # Required: Prompt mới
}
```

### 7. Image Expand
```python
payload = {
    "image": str,                     # Required: Ảnh gốc
    "prompt": str                     # Required: Mô tả vùng expand
}
```

## 🔧 Adding New Features

### Step 1: Thêm Intent Type

```python
# apps/intent_router/constants.py
class IntentType:
    # ... existing intents
    MY_NEW_FEATURE = "my_new_feature"
```

### Step 2: Thêm App Mapping

```python
# apps/intent_router/constants.py
INTENT_TO_APP_MAP = {
    # ... existing mappings
    IntentType.MY_NEW_FEATURE: "my_new_app",
}
```

### Step 3: Thêm Handler

```python
# apps/intent_router/router.py
class IntentRouter:
    INTENT_HANDLERS = {
        # ... existing handlers
        IntentType.MY_NEW_FEATURE: 'route_to_my_feature',
    }
    
    @staticmethod
    def route_to_my_feature(payload: Dict, context: Dict):
        from apps.my_new_app.celery_tasks import my_feature_task
        from apps.conversation.celery_tasks import finalize_conversation_task
        
        return chain(
            my_feature_task.s(payload),
            finalize_conversation_task.s(context['session_id'])
        )
```

## 📊 Architecture

```
User Request
    │
    ▼
Conversation Service
    │
    ▼
Prompt Service (detect intent)
    │
    ▼
Intent Router ◄────── Central dispatch
    │
    ├─> Image Generation
    ├─> Upscale
    ├─> Remove Background
    ├─> Relight
    ├─> Style Transfer
    ├─> Reimagine
    └─> Image Expand
         │
         ▼
    Finalize & Save to Gallery
```

## 🧪 Testing

```python
from apps.intent_router import IntentRouter, IntentType

# Test routing
router = IntentRouter()

# Test image generation
result = router.route(
    intent=IntentType.IMAGE_GENERATE,
    payload={"prompt": "test"},
    context={"session_id": "test123"}
)

# Test upscale
result = router.route(
    intent=IntentType.UPSCALE,
    payload={"image": "http://...", "flavor": "photo"},
    context={"session_id": "test123"}
)
```

## 🔍 Constants Reference

### IntentType
```python
from apps.intent_router import IntentType

IntentType.IMAGE_GENERATE       # "image_generate"
IntentType.UPSCALE               # "upscale"
IntentType.REMOVE_BACKGROUND     # "remove_background"
IntentType.RELIGHT               # "relight"
IntentType.STYLE_TRANSFER        # "style_transfer"
IntentType.REIMAGINE             # "reimagine"
IntentType.IMAGE_EXPAND          # "image_expand"
IntentType.OTHER                 # "other"
```

### UpscaleFlavor
```python
from apps.intent_router import UpscaleFlavor

UpscaleFlavor.SUBLIME            # "sublime"
UpscaleFlavor.PHOTO              # "photo"
UpscaleFlavor.PHOTO_DENOISER     # "photo_denoiser"
```

### AspectRatio
```python
from apps.intent_router import AspectRatio

AspectRatio.SQUARE               # "1:1"
AspectRatio.LANDSCAPE            # "16:9"
AspectRatio.PORTRAIT             # "9:16"
AspectRatio.WIDE                 # "21:9"
AspectRatio.CLASSIC              # "4:3"
```

## 🚀 Next Steps

1. Implement Celery tasks trong mỗi feature app
2. Wire router vào conversation service
3. Add error handling và retry logic
4. Add monitoring và logging
5. Add rate limiting per feature
