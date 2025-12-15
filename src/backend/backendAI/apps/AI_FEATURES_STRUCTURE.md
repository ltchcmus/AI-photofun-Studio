# AI Feature Apps Structure

## 📁 Created Apps

### Feature Apps (Empty - Logic sẽ implement sau)

1. **`apps/image_generation/`**
   - Generate images from text prompts
   - Support aspect ratio và style reference

2. **`apps/upscale/`**
   - Enhance image resolution
   - 3 flavors: sublime, photo, photo_denoiser

3. **`apps/remove_background/`**
   - Remove background from images
   - Simple input: chỉ cần image

4. **`apps/relight/`**
   - Adjust image lighting
   - Support prompt hoặc reference image

5. **`apps/style_transfer/`**
   - Transfer artistic style
   - Cần image + reference_image

6. **`apps/reimagine/`**
   - Reimagine image với prompt mới
   - Transform existing image

7. **`apps/image_expand/`**
   - Expand image boundaries
   - AI-generated outpainting

### Routing App (Logic đã hoàn chỉnh)

8. **`apps/intent_router/`** ✅
   - Centralized routing logic
   - Constants cho tất cả intents
   - Ready to use

## 🎯 Intent Codes

```python
IntentType.IMAGE_GENERATE       → apps/image_generation/
IntentType.UPSCALE               → apps/upscale/
IntentType.REMOVE_BACKGROUND     → apps/remove_background/
IntentType.RELIGHT               → apps/relight/
IntentType.STYLE_TRANSFER        → apps/style_transfer/
IntentType.REIMAGINE             → apps/reimagine/
IntentType.IMAGE_EXPAND          → apps/image_expand/
```

## 📝 Next Steps

### 1. Cho mỗi feature app, tạo:
```
apps/[feature_name]/
├── __init__.py              ✅ (đã tạo)
├── apps.py                  ⏳ Django app config
├── celery_tasks.py          ⏳ Async task processing
├── serializers.py           ⏳ Input validation
├── services.py              ⏳ Business logic
├── views.py                 ⏳ API endpoints (optional)
└── urls.py                  ⏳ URL routing (optional)
```

### 2. Wire Intent Router vào Conversation Service:
```python
from apps.intent_router import IntentRouter

# In conversation/service.py
task_chain = IntentRouter.route(
    intent=detected_intent,
    payload=user_payload,
    context={"session_id": session_id}
)
```

### 3. Update Prompt Service để detect thêm intents:
```python
# In prompt_service/services.py
def detect_intent(prompt):
    # Add logic to detect:
    # - upscale
    # - remove_background
    # - relight
    # - style_transfer
    # - reimagine
    # - image_expand
    ...
```

## 🔧 Usage Example

```python
from apps.intent_router import IntentRouter, IntentType, UpscaleFlavor

# Route to upscale
IntentRouter.route(
    intent=IntentType.UPSCALE,
    payload={
        "image": "https://example.com/image.jpg",
        "flavor": UpscaleFlavor.PHOTO
    },
    context={"session_id": "abc123"}
)

# Route to style transfer
IntentRouter.route(
    intent=IntentType.STYLE_TRANSFER,
    payload={
        "image": "https://example.com/photo.jpg",
        "reference_image": "https://example.com/style.jpg",
        "prompt": "Apply Van Gogh style"
    },
    context={"session_id": "abc123"}
)
```

## 📚 Documentation

- **Intent Router README**: `apps/intent_router/README.md`
- **Constants**: `apps/intent_router/constants.py`
- **Router Logic**: `apps/intent_router/router.py`

All ready for implementation! 🚀
