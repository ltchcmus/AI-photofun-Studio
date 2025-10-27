# AI Gateway Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React/Vue)                        │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Chat Input  │  │ Image Upload │  │  Gallery     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘              │
│         │                  │                                         │
│         └──────────────────┴─────────────────────────────────┐      │
│                                                               ↓      │
│                          POST /api/v1/ai-gateway/chat/              │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
                                                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        AI GATEWAY (Django)                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              ChatGatewayViewSet (views.py)                  │   │
│  │  • POST /chat/        - Process message                     │   │
│  │  • GET  /sessions/    - List sessions                       │   │
│  │  • GET  /sessions/:id - Get session details                 │   │
│  │  • DELETE /sessions/:id - Delete session                    │   │
│  │  • GET  /capabilities/ - List features                      │   │
│  └────────────────────────────┬───────────────────────────────┘   │
│                                ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │           AIGatewayPipeline (pipeline.py)                   │   │
│  │                                                              │   │
│  │  process_message(message, session_id, image, context)      │   │
│  │       │                                                      │   │
│  │       ├─→ Step 1: Classify Intent                          │   │
│  │       ├─→ Step 2: Refine Prompt                            │   │
│  │       ├─→ Step 3: Route to Service                         │   │
│  │       └─→ Step 4: Format Response                          │   │
│  └────────────────────────────┬───────────────────────────────┘   │
│                                ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    SERVICES LAYER                           │   │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┬─┘
                                                                   │
          ┌────────────────────────┬──────────────────────────────┤
          ↓                        ↓                               ↓
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ Intent Classifier    │  │ Prompt Refiner   │  │ Response Handler     │
│                      │  │                  │  │                      │
│ classify_intent()    │  │ refine_prompt()  │  │ format_image_resp()  │
│ extract_parameters() │  │ validate()       │  │ format_text_resp()   │
│                      │  │ extract_negative │  │ format_error_resp()  │
│ Detects:             │  │                  │  │ add_suggestions()    │
│ • image_generation   │  │ Enhances:        │  │                      │
│ • face_swap          │  │ • Add quality    │  │ Creates:             │
│ • background_removal │  │ • Add details    │  │ • Actions            │
│ • image_edit         │  │ • Extract params │  │ • Suggestions        │
│ • style_transfer     │  │ • Validate       │  │ • Metadata           │
└──────────┬───────────┘  └──────────────────┘  └──────────────────────┘
           │
           ↓
┌────────────────────────────────────────────────────────────────────┐
│                         SERVICE ROUTER                              │
│                                                                     │
│  if intent == 'image_generation':                                  │
│      → ImageGenerationService.generate_image()                     │
│  elif intent == 'face_swap':                                       │
│      → apps.face_swap.views (existing service)                     │
│  elif intent == 'background_removal':                              │
│      → apps.background_removal.views (existing service)            │
│  elif intent == 'image_edit':                                      │
│      → apps.image_processing.views (existing service)              │
│  elif intent == 'style_transfer':                                  │
│      → apps.style_transfer.views (existing service)                │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
          ┌───────────────┴────────────────┐
          ↓                                ↓
┌──────────────────────┐        ┌──────────────────────┐
│ Image Generation     │        │ Other AI Services    │
│                      │        │                      │
│ generate_image()     │        │ • Face Swap          │
│ generate_variations()│        │ • Background Removal │
│ upscale_image()      │        │ • Object Removal     │
│                      │        │ • Style Transfer     │
│ Uses:                │        │ • Image Enhancement  │
│ • Stable Diffusion   │        │                      │
│ • DALL-E             │        │ Already implemented  │
│ • Midjourney API     │        │ in /apps directory   │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           ↓
┌────────────────────────────────────────────────────────────────────┐
│                    AI MODELS (Placeholder → Real)                   │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │ Stable        │  │ InsightFace   │  │ U2-Net        │         │
│  │ Diffusion     │  │ (Face Swap)   │  │ (Background)  │         │
│  └───────────────┘  └───────────────┘  └───────────────┘         │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │ LaMa          │  │ Real-ESRGAN   │  │ Neural Style  │         │
│  │ (Inpainting)  │  │ (Upscaling)   │  │ (Style)       │         │
│  └───────────────┘  └───────────────┘  └───────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Image Generation

```
1. USER ACTION
   Frontend sends:
   {
     "message": "Create a fantasy dragon",
     "session_id": "session-123"
   }

2. CHAT GATEWAY (views.py)
   • Receives request
   • Validates with ChatRequestSerializer
   • Gets/creates ChatSession
   • Saves user message to database

3. PIPELINE CONTROLLER (pipeline.py)
   ┌─────────────────────────────────────────┐
   │ process_message()                       │
   │                                         │
   │ Step 1: Intent Classification           │
   │    IntentClassificationService          │
   │    → classify_intent("Create a dragon") │
   │    → Result: ("image_generation", 0.95) │
   │                                         │
   │ Step 2: Prompt Refinement               │
   │    PromptRefinementService              │
   │    → refine_prompt("Create a dragon")   │
   │    → Result: "fantasy dragon, detailed, │
   │              cinematic, 8k, high quality"│
   │                                         │
   │ Step 3: Route to Service                │
   │    _route_to_service()                  │
   │    → Detects: image_generation          │
   │    → Calls: ImageGenerationService      │
   │                                         │
   │ Step 4: Format Response                 │
   │    ResponseHandlerService               │
   │    → format_image_response()            │
   │    → Add actions & suggestions          │
   └─────────────────────────────────────────┘

4. IMAGE GENERATION SERVICE (services/image_generation.py)
   generate_image(
     prompt="fantasy dragon, detailed...",
     width=1024,
     height=768,
     steps=50,
     guidance_scale=7.5
   )
   → Returns: (image_bytes, metadata)

5. RESPONSE HANDLER (services/response_handler.py)
   format_image_response(
     image_url="/media/generated/dragon_456.png",
     prompt="fantasy dragon, detailed...",
     metadata={...}
   )
   → Adds:
     • Download action
     • Regenerate action
     • Variations suggestion
     • Upscale suggestion

6. CHAT GATEWAY
   • Saves assistant message
   • Saves generated image
   • Returns formatted response

7. FRONTEND
   Receives:
   {
     "session_id": "session-123",
     "message_id": "msg-456",
     "type": "image",
     "message": "I've generated your dragon!",
     "data": {
       "image_url": "/media/generated/dragon_456.png",
       "prompt": "fantasy dragon, detailed...",
       "metadata": {
         "width": 1024,
         "height": 768,
         "generation_time": 10.5
       }
     },
     "actions": [
       {"id": "download", "label": "Download"},
       {"id": "regenerate", "label": "Generate Again"}
     ],
     "suggestions": [
       "Generate variations",
       "Change the color scheme",
       "Upscale to higher resolution"
     ]
   }

   Frontend displays:
   • Dragon image
   • Download button
   • Regenerate button
   • Suggestions as clickable chips
```

---

## Database Schema

```
┌─────────────────────────────────────────┐
│           ChatSession                    │
├─────────────────────────────────────────┤
│ id (PK)                  UUID            │
│ session_id               VARCHAR(100)    │
│ created_at               DATETIME        │
│ updated_at               DATETIME        │
│ metadata                 JSON            │
└──────────────┬──────────────────────────┘
               │
               │ 1:N
               │
┌──────────────┴──────────────────────────┐
│           ChatMessage                    │
├─────────────────────────────────────────┤
│ id (PK)                  UUID            │
│ session_id (FK)          UUID            │
│ role                     VARCHAR(20)     │
│ content                  TEXT            │
│ image                    FILE            │
│ created_at               DATETIME        │
│ metadata                 JSON            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         PromptTemplate                   │
├─────────────────────────────────────────┤
│ id (PK)                  UUID            │
│ name                     VARCHAR(200)    │
│ description              TEXT            │
│ category                 VARCHAR(50)     │
│ template                 TEXT            │
│ example_input            TEXT            │
│ example_output           TEXT            │
│ tags                     JSON            │
│ is_active                BOOLEAN         │
│ usage_count              INTEGER         │
│ created_at               DATETIME        │
│ updated_at               DATETIME        │
└─────────────────────────────────────────┘
```

---

## Service Integration Points

```
AI Gateway Services
        ↓
┌───────────────────────────────────────┐
│   Existing Apps (Already Built)       │
├───────────────────────────────────────┤
│                                       │
│  /apps/face_swap/                     │
│    • FaceSwapViewSet                  │
│    • FaceSwapService                  │
│    • InsightFace integration          │
│                                       │
│  /apps/background_removal/            │
│    • BackgroundRemovalViewSet         │
│    • BackgroundRemovalService         │
│    • U2-Net integration               │
│                                       │
│  /apps/image_processing/              │
│    • ImageProcessingViewSet           │
│    • ImageProcessingService           │
│    • PIL/OpenCV operations            │
│                                       │
│  /apps/object_removal/                │
│    • (To be implemented)              │
│    • LaMa inpainting                  │
│                                       │
│  /apps/style_transfer/                │
│    • (To be implemented)              │
│    • Neural Style Transfer            │
│                                       │
│  /apps/image_enhancement/             │
│    • (To be implemented)              │
│    • Real-ESRGAN upscaling            │
│                                       │
└───────────────────────────────────────┘
```

---

## Configuration Hierarchy

```
backendAI/settings.py
    ↓
┌─────────────────────────────────────────┐
│  AI_MODEL_CONFIGS                       │
│    • Model paths                        │
│    • Device settings (CPU/GPU)          │
│    • Default parameters                 │
│    • Cache settings                     │
└─────────────────────────────────────────┘
    ↓
core/model_manager.py
    ↓
┌─────────────────────────────────────────┐
│  ModelManager (Singleton)               │
│    • load_model()                       │
│    • unload_model()                     │
│    • get_model()                        │
│    • Model caching                      │
└─────────────────────────────────────────┘
    ↓
apps/ai_gateway/services/
    ↓
┌─────────────────────────────────────────┐
│  Service Classes                        │
│    • ImageGenerationService             │
│    • PromptRefinementService            │
│    • IntentClassificationService        │
│    • ResponseHandlerService             │
└─────────────────────────────────────────┘
```

---

## Request/Response Flow

```
HTTP Request
     ↓
Django Middleware
     ├─→ CORS
     ├─→ Authentication
     ├─→ Logging
     └─→ Exception Handling
     ↓
URL Router
     ↓
ChatGatewayViewSet
     ↓
ChatRequestSerializer (Validation)
     ↓
AIGatewayPipeline
     ↓
Service Layer
     ├─→ Intent Classification
     ├─→ Prompt Refinement
     ├─→ Service Execution
     └─→ Response Formatting
     ↓
ChatResponseSerializer (Formatting)
     ↓
Django Response
     ↓
HTTP Response (JSON)
```

---

## Error Handling Flow

```
Exception in Service
     ↓
Pipeline catches exception
     ↓
ResponseHandlerService.format_error_response()
     ├─→ Error message
     ├─→ Error code
     ├─→ Suggestions for recovery
     └─→ Support information
     ↓
ChatResponseSerializer
     ↓
HTTP 500/400 Response with details
     ↓
Frontend displays user-friendly error
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer (Nginx)         │
└─────────────────┬───────────────────────┘
                  │
     ┌────────────┼────────────┐
     ↓            ↓            ↓
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Django  │  │ Django  │  │ Django  │
│ Worker 1│  │ Worker 2│  │ Worker 3│
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  ↓
     ┌────────────────────────┐
     │   PostgreSQL Database  │
     └────────────────────────┘
                  ↓
     ┌────────────────────────┐
     │   Redis Cache/Queue    │
     └────────────────────────┘
                  ↓
     ┌────────────────────────┐
     │   Celery Workers       │
     │   (Async AI Tasks)     │
     └────────────────────────┘
                  ↓
     ┌────────────────────────┐
     │   Media Storage (S3)   │
     │   (Generated Images)   │
     └────────────────────────┘
```

---

## Performance Optimization

```
Request comes in
     ↓
┌─────────────────────────┐
│  1. Check Redis Cache   │
│     • Cached responses  │
│     • Model instances   │
└────────┬────────────────┘
         │ Cache miss
         ↓
┌─────────────────────────┐
│  2. Load AI Models      │
│     • Lazy loading      │
│     • Model warmup      │
│     • GPU allocation    │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│  3. Process Request     │
│     • Batch if possible │
│     • Async for long    │
│     • Stream if needed  │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│  4. Cache Result        │
│     • Redis             │
│     • CDN for images    │
└─────────────────────────┘
```

This architecture provides a scalable, maintainable, and extensible foundation for the AI Gateway system! 🚀
