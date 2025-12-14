# Dual Flow Architecture: Chat vs Direct Feature Access

## 🎯 Problem Statement

User có 2 cách sử dụng AI features:

1. **Chat Flow**: Gửi message trong conversation, chatbot tự động phát hiện intent và xử lý
2. **Direct Flow**: Click nút feature cụ thể (VD: "Upscale Image"), trực tiếp call API feature đó

**Question**: Thiết kế hiện tại có scale được không?

**Answer**: ✅ **CÓ** - Nhưng cần tách routing logic thành 2 layers

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                      │
├──────────────────────┬──────────────────────────────────┤
│   Chat with Bot      │    Direct Feature Buttons        │
│   💬 "Make sunset"   │    🎨 Generate  📸 Upscale       │
└──────────┬───────────┴────────────┬─────────────────────┘
           │                        │
           │                        │ Direct API Call
           ▼                        ▼
┌──────────────────┐      ┌──────────────────────┐
│  Conversation    │      │  Feature Endpoints   │
│  Service         │      │  /v1/features/xxx/   │
└────────┬─────────┘      └──────────┬───────────┘
         │                           │
         │ Detect Intent             │ Skip conversation
         ▼                           │
┌──────────────────┐                 │
│  Prompt Service  │                 │
│  (Intent Detect) │                 │
└────────┬─────────┘                 │
         │                           │
         │ Intent Code               │
         ▼                           │
┌────────────────────────────────────▼───────────┐
│           Intent Router (Optional)             │
│         Maps intent → feature app              │
└────────┬───────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│              Feature Apps Layer                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │Image │  │Upscale│  │ BG   │  │Style │        │
│  │ Gen  │  │      │  │Remove│  │Transfer│       │
│  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘        │
└─────┼────────┼─────────┼─────────┼──────────────┘
      │        │         │         │
      └────────┴─────────┴─────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│            Image Gallery Service                 │
│         (Save result to PostgreSQL)              │
└──────────────────────────────────────────────────┘
```

---

## 📊 Flow Comparison

### Flow 1: Chat với Chatbot (Complex Flow)

```python
# Step 1: User sends message
POST /api/v1/chat/sessions/{session_id}/messages/
{
    "content": "Create a beautiful sunset image"
}

# Step 2: Conversation service saves message
conversation_service.add_message(session_id, user_message)

# Step 3: Prompt service refines + detects intent
prompt_result = prompt_service.refine_prompt(user_message)
# Result: {
#     "refined_prompt": "A vibrant sunset over mountains...",
#     "intent": "image_generate"
# }

# Step 4: Intent Router dispatches (OPTIONAL trong flow này)
task = IntentRouter.route(
    intent="image_generate",
    payload={"prompt": refined_prompt},
    context={"session_id": session_id}
)

# Step 5: Image Generation executes
result = image_generation_service.generate(refined_prompt)

# Step 6: Save to Gallery
ImageGallery.objects.create(
    user_id=user.id,
    image_url=result['image_url'],
    refined_prompt=refined_prompt,
    intent='image_generate',
    metadata={'session_id': session_id}  # Track conversation
)

# Step 7: Finalize conversation
conversation_service.add_message(session_id, {
    "role": "assistant",
    "status": "DONE",
    "image_url": result['image_url']
})
```

### Flow 2: Direct Feature Access (Simple Flow)

```python
# Step 1: User clicks "Generate Image" button
POST /v1/features/image-generation/
{
    "prompt": "A sunset over mountains",
    "aspect_ratio": "16:9",
    "user_id": "user123"
}

# Step 2: Direct to Image Generation (NO conversation, NO prompt service)
result = image_generation_service.generate(
    prompt=request.data['prompt'],
    aspect_ratio=request.data['aspect_ratio']
)

# Step 3: Save to Gallery
ImageGallery.objects.create(
    user_id=request.data['user_id'],
    image_url=result['image_url'],
    refined_prompt=request.data['prompt'],  # Use as-is
    intent='image_generate',
    metadata={'source': 'direct_feature'}  # NO session_id
)

# Step 4: Return result immediately
return {
    "image_url": result['image_url'],
    "task_id": result['task_id']
}
```

---

## 🔧 API Endpoints Design

### Conversation-Based Endpoints (Existing)

```
POST   /api/v1/chat/sessions/                    # Create session
POST   /api/v1/chat/sessions/{id}/messages/      # Send message (auto-routing)
GET    /api/v1/chat/sessions/{id}/messages/{mid} # Poll result
```

### Direct Feature Endpoints (NEW)

```
POST   /v1/features/image-generation/            # Generate image directly
POST   /v1/features/upscale/                     # Upscale image directly
POST   /v1/features/remove-background/           # Remove BG directly
POST   /v1/features/relight/                     # Relight directly
POST   /v1/features/style-transfer/              # Style transfer directly
POST   /v1/features/reimagine/                   # Reimagine directly
POST   /v1/features/image-expand/                # Expand directly
```

### Gallery Endpoints (Shared by both flows)

```
GET    /v1/gallery/                              # List user images
POST   /v1/gallery/                              # Create image record
GET    /v1/gallery/{image_id}/                   # Get image detail
DELETE /v1/gallery/{image_id}/                   # Soft delete
```

---

## 💾 Database Design

### Conversation Database (MongoDB)

```javascript
// Only for chat flow
{
    "_id": ObjectId("..."),
    "session_id": "uuid",
    "user_id": "user123",
    "messages": [
        {
            "role": "user",
            "content": "Create sunset image"
        },
        {
            "role": "assistant",
            "status": "DONE",
            "intent": "image_generate",
            "image_url": "https://...",
            "request_id": "task-123"
        }
    ],
    "created_at": ISODate("...")
}
```

### Image Gallery (PostgreSQL)

```sql
-- Shared by BOTH flows
CREATE TABLE image_gallery (
    image_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    refined_prompt TEXT,
    intent VARCHAR(100),
    metadata JSONB DEFAULT '{}',  -- Different metadata for each flow
    created_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Chat flow metadata example:
{
    "source": "conversation",
    "session_id": "abc-123",
    "message_id": "msg-456"
}

-- Direct flow metadata example:
{
    "source": "direct_feature",
    "original_prompt": "sunset",  -- No refinement in direct flow
    "aspect_ratio": "16:9"
}
```

---

## 🎯 Code Organization

### Shared Service Layer

```python
"""
apps/image_generation/services.py
Core business logic - KHÔNG phụ thuộc vào conversation hay direct call
"""

class ImageGenerationService:
    """
    Pure service - có thể gọi từ:
    1. Conversation flow (qua Intent Router)
    2. Direct API endpoint
    3. Scheduled tasks
    4. Admin panel
    """
    
    @staticmethod
    def generate(prompt: str, aspect_ratio: str = "1:1", style_reference: str = None):
        """
        Generate image - agnostic to caller
        """
        # AI logic here
        result = {
            "image_url": "https://cloudinary.com/...",
            "task_id": "uuid",
            "metadata": {
                "model": "stable-diffusion",
                "generation_time": 3.5
            }
        }
        return result
```

### Conversation Flow Handler

```python
"""
apps/conversation/service.py
Sử dụng IntentRouter + Service layer
"""

def process_message(session_id, message):
    # 1. Detect intent
    prompt_result = prompt_service.refine(message['content'])
    
    # 2. Route to feature
    task = IntentRouter.route(
        intent=prompt_result['intent'],
        payload={"prompt": prompt_result['refined_prompt']},
        context={"session_id": session_id}
    )
    
    # 3. Execute
    result = task.apply_async()
    
    # 4. Save to conversation
    add_message(session_id, {
        "role": "assistant",
        "image_url": result['image_url']
    })
```

### Direct API Handler

```python
"""
apps/image_generation/views.py
Trực tiếp gọi Service layer
"""

class ImageGenerationView(APIView):
    def post(self, request):
        # 1. Validate
        serializer = ImageGenerationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 2. Call service directly (NO conversation, NO prompt refinement)
        result = ImageGenerationService.generate(
            prompt=serializer.validated_data['prompt'],
            aspect_ratio=serializer.validated_data.get('aspect_ratio')
        )
        
        # 3. Save to gallery
        ImageGallery.objects.create(
            user_id=serializer.validated_data['user_id'],
            image_url=result['image_url'],
            refined_prompt=serializer.validated_data['prompt'],
            intent='image_generate',
            metadata={'source': 'direct_feature'}
        )
        
        # 4. Return immediately
        return APIResponse.success(result=result)
```

---

## ✅ Benefits of This Design

### 1. **Separation of Concerns** ✅
- Conversation logic riêng
- Feature logic riêng
- Gallery storage riêng

### 2. **Reusable Service Layer** ✅
- `ImageGenerationService.generate()` dùng được cho cả 2 flows
- Dễ test (không phụ thuộc context)

### 3. **Flexible Routing** ✅
- Chat flow: Conversation → Prompt Service → Intent Router → Feature
- Direct flow: API Endpoint → Feature (skip conversation)

### 4. **Scalable** ✅
- Thêm feature mới: chỉ cần thêm app + endpoint
- Không ảnh hưởng conversation flow

### 5. **Clear Data Ownership** ✅
- Conversation DB: chỉ lưu chat history
- Image Gallery: lưu TẤT CẢ ảnh (từ cả 2 flows)
- Metadata field phân biệt source

---

## 🚀 Implementation Checklist

### Phase 1: Core Services (Shared Logic)
- [ ] `apps/image_generation/services.py`
- [ ] `apps/upscale/services.py`
- [ ] `apps/remove_background/services.py`
- [ ] etc.

### Phase 2: Direct API Endpoints
- [x] `apps/image_generation/views.py` ✅
- [x] `apps/image_generation/urls.py` ✅
- [x] `apps/upscale/views.py` ✅
- [x] `apps/upscale/urls.py` ✅
- [ ] Wire to main `urls.py`

### Phase 3: Conversation Flow Integration
- [ ] Update `conversation/service.py` to use IntentRouter
- [ ] Update `prompt_service` to detect new intents

### Phase 4: Gallery Integration
- [ ] Auto-save from conversation flow
- [ ] Auto-save from direct flow
- [ ] Add metadata differentiation

---

## 📝 Example: User Journey

### Journey 1: Chat Flow
```
User: "Create a sunset image"
  ↓
[Chat UI] → POST /api/v1/chat/sessions/123/messages
  ↓
[Conversation] → Saves message to MongoDB
  ↓
[Prompt Service] → "A vibrant sunset over mountains" + intent: image_generate
  ↓
[Intent Router] → Routes to image_generation
  ↓
[Image Gen Service] → Generates image
  ↓
[Gallery] → Saves with metadata: {session_id: 123}
  ↓
[Conversation] → Updates message with image_url
  ↓
[Chat UI] → Displays image in chat
```

### Journey 2: Direct Feature
```
User: Clicks "Generate Image" button
  ↓
[Feature UI] → Shows form: prompt, aspect_ratio
  ↓
User fills form → "sunset", "16:9"
  ↓
[Feature UI] → POST /v1/features/image-generation
  ↓
[Image Gen View] → Validates input
  ↓
[Image Gen Service] → Generates image (SAME service as chat flow!)
  ↓
[Gallery] → Saves with metadata: {source: 'direct_feature'}
  ↓
[Feature UI] → Displays image immediately
  ↓
[Gallery UI] → Image appears in user gallery
```

---

## 🎯 Conclusion

**Yes, thiết kế hiện tại CÓ THỂ scale** với điều kiện:

1. ✅ Tách **Service Layer** độc lập (core business logic)
2. ✅ Tạo **Direct API Endpoints** cho từng feature
3. ✅ **Conversation flow** và **Direct flow** đều dùng chung Service Layer
4. ✅ **Image Gallery** lưu kết quả từ cả 2 flows (dùng metadata phân biệt)
5. ✅ **Intent Router** optional - chỉ dùng cho conversation flow

Architecture này cho phép:
- 🚀 Scale độc lập từng component
- 🔄 Reuse code giữa 2 flows
- 📊 Track được image source (chat vs direct)
- 🎯 Maintain clarity and separation of concerns
