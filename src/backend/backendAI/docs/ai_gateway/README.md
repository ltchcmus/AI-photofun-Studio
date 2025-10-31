# AI Gateway

## Overview

The AI Gateway is the **unified orchestration layer** for all AI-powered features in the AI Photo Studio backend. It provides a **chat-based interface** that allows users to interact naturally with various AI services through conversational prompts.

## Purpose

Instead of calling individual service APIs (face swap, background removal, etc.) separately, the frontend sends a simple message to the AI Gateway, which:

1. **Understands the intent** (what the user wants to do)
2. **Refines the prompt** (enhances it for better results)
3. **Routes to the appropriate service** (image generation, face swap, etc.)
4. **Formats the response** (consistent structure for frontend)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Gateway                            │
│  (Unified Interface for All AI Features)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Pipeline Controller   │
         └────────────┬───────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ Intent Classifier│      │ Prompt Refiner   │
│ - Image Gen      │      │ - Add quality    │
│ - Face Swap      │      │ - Extract params │
│ - Background Rem │      │ - Validate       │
│ - Image Edit     │      │ - Negative prompt│
│ - Style Transfer │      └──────────────────┘
└─────────┬────────┘
          │
          ▼
┌─────────────────────────────────────┐
│      Service Router                 │
├─────────────────────────────────────┤
│ → Image Generation (Stable Diffusion)│
│ → Face Swap (InsightFace)           │
│ → Background Removal (U2-Net)       │
│ → Image Processing (PIL/OpenCV)     │
│ → Style Transfer (Neural Style)     │
└──────────────┬──────────────────────┘
               │
               ▼
      ┌────────────────┐
      │ Response Handler│
      │ - Format output│
      │ - Add actions  │
      │ - Suggestions  │
      └────────────────┘
```

## Components

### 1. Models (`models.py`)

#### ChatSession
- Tracks conversation sessions
- Fields: `session_id`, `created_at`, `updated_at`, `metadata`
- Purpose: Maintain conversation context across multiple messages

#### ChatMessage
- Stores individual messages in a session
- Fields: `session`, `role` (user/assistant), `content`, `image`, `metadata`
- Purpose: Message history for context-aware responses

#### PromptTemplate
- Pre-defined prompt templates for common tasks
- Fields: `name`, `description`, `template`, `category`, `tags`
- Purpose: Quick access to optimized prompts

### 2. Serializers (`serializers.py`)

#### ChatRequestSerializer
- Validates incoming chat requests
- Fields: `message`, `session_id`, `context`
- Validation: Ensures message is not empty

#### ChatResponseSerializer
- Standardizes response format
- Fields: `session_id`, `message`, `type`, `data`, `actions`, `suggestions`, `metadata`
- Types: `image`, `text`, `error`, `processing`

### 3. Services (`services/`)

#### IntentClassificationService
**Purpose:** Determine what the user wants to do

**Methods:**
- `classify_intent(message, has_image, context)` → (intent, confidence)
- `extract_parameters(message, intent)` → dict of parameters

**Intents:**
- `image_generation` - Create new images from text
- `face_swap` - Swap faces between images
- `background_removal` - Remove backgrounds
- `image_edit` - Modify existing images
- `style_transfer` - Apply artistic styles
- `general` - Questions/help requests

**Example:**
```python
intent, confidence = classifier.classify_intent(
    "Create a portrait of a cat wearing a crown"
)
# Returns: ('image_generation', 0.95)
```

---

#### PromptRefinementService
**Purpose:** Enhance user prompts for better AI results

**Methods:**
- `refine_prompt(prompt, context)` → (refined_prompt, confidence)
- `extract_negative_prompt(prompt)` → (positive, negative)
- `validate_prompt(prompt)` → (is_valid, error_message)

**Features:**
- Adds quality descriptors (`detailed`, `high quality`, `8k`)
- Adds technical terms (`sharp focus`, `professional lighting`)
- Detects and enhances styles (`cinematic`, `photorealistic`)
- Extracts negative prompts (things to avoid)

**Example:**
```python
refined, confidence = refiner.refine_prompt("a cat")
# Returns: ("a cat, detailed, high quality, sharp focus", 0.75)

positive, negative = refiner.extract_negative_prompt(
    "beautiful landscape, no people, no buildings"
)
# Returns: ("beautiful landscape", "people, buildings")
```

---

#### ImageGenerationService
**Purpose:** Generate images from text prompts

**Methods:**
- `generate_image(prompt, negative_prompt, width, height, steps, guidance_scale)` → (image_bytes, metadata)
- `generate_variations(image, count)` → list of variations
- `upscale_image(image, scale_factor)` → upscaled_image
- `validate_parameters(params)` → (is_valid, errors)
- `estimate_generation_time(params)` → float (seconds)

**Parameters:**
- `width`, `height`: 512-2048 pixels (multiples of 64)
- `steps`: 20-100 inference steps
- `guidance_scale`: 1.0-20.0 (how closely to follow prompt)
- `seed`: Optional random seed for reproducibility

**Example:**
```python
image_bytes, metadata = generator.generate_image(
    prompt="fantasy castle on a mountain",
    negative_prompt="blurry, low quality",
    width=1024,
    height=768,
    steps=50,
    guidance_scale=7.5
)
```

---

#### ResponseHandlerService
**Purpose:** Format responses for frontend chat interface

**Methods:**
- `format_image_response(image_url, prompt, metadata)` → dict
- `format_text_response(text, metadata)` → dict
- `format_error_response(error_message, error_code, suggestions)` → dict
- `format_processing_response(message, progress, estimated_time)` → dict
- `add_suggestions(response, suggestions)` → dict
- `generate_follow_up_suggestions(intent, success)` → list

**Response Structure:**
```json
{
  "message": "Human-readable message",
  "type": "image|text|error|processing",
  "data": {
    "image_url": "...",
    "metadata": {...}
  },
  "actions": [
    {
      "id": "download",
      "label": "Download Image",
      "type": "download",
      "data": {"url": "..."}
    }
  ],
  "suggestions": [
    "Generate variations",
    "Change the style",
    "Upscale the image"
  ]
}
```

### 4. Pipeline Controller (`pipeline.py`)

#### AIGatewayPipeline
**Purpose:** Orchestrate the entire AI workflow

**Main Method:**
```python
def process_message(
    message: str,
    session_id: Optional[str],
    uploaded_image = None,
    context: Optional[Dict] = None
) -> Dict
```

**Workflow:**
1. Classify user intent
2. Validate and refine prompt
3. Route to appropriate service
4. Execute service (generate image, swap face, etc.)
5. Format response with actions and suggestions
6. Add pipeline metadata (timings, confidence scores)

**Example:**
```python
pipeline = get_pipeline()
result = pipeline.process_message(
    message="Create a sunset over mountains",
    session_id="session-123"
)
# Returns: Complete formatted response ready for frontend
```

### 5. Views (`views.py`)

#### ChatGatewayViewSet
**Purpose:** REST API endpoints for chat interactions

**Endpoints:**

##### POST `/chat/`
Process a chat message
- Body: `message`, optional `session_id`, `image`, `context`
- Returns: Formatted response with session info

##### GET `/sessions/`
List all chat sessions
- Returns: Array of sessions with metadata

##### GET `/sessions/{session_id}/`
Get session details with all messages
- Returns: Session object with message history

##### DELETE `/sessions/{session_id}/`
Delete a session
- Returns: Success message

##### GET `/capabilities/`
Get available AI capabilities
- Returns: List of supported features

## Usage

### Frontend Integration

```javascript
// Send a simple text prompt
const response = await fetch('/api/v1/ai-gateway/chat/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Create a portrait of a cat",
    session_id: sessionId  // Optional, for continuing conversation
  })
});

const data = await response.json();
// data.type === 'image'
// data.data.image_url === '/media/generated/cat_123.png'
// data.suggestions === ['Generate variations', 'Change style', ...]
```

```javascript
// Upload image for processing
const formData = new FormData();
formData.append('message', 'Remove background from this image');
formData.append('image', imageFile);
formData.append('session_id', sessionId);

const response = await fetch('/api/v1/ai-gateway/chat/', {
  method: 'POST',
  body: formData
});
```

### API Flow Examples

#### Example 1: Generate Image
```
User: "Create a cyberpunk city at night"
  ↓
Intent Classifier: image_generation (0.98)
  ↓
Prompt Refiner: "cyberpunk city at night, neon lights, detailed, 
                 cinematic, 8k, high quality"
  ↓
Image Generator: Generate image with Stable Diffusion
  ↓
Response Handler: Format with image URL, actions, suggestions
  ↓
Frontend: Display image with "Download", "Regenerate" buttons
```

#### Example 2: Remove Background
```
User: "Remove background" + uploads image
  ↓
Intent Classifier: background_removal (0.95)
  ↓
Background Removal Service: Process with U2-Net
  ↓
Response Handler: Format with processed image URL
  ↓
Frontend: Display transparent background image
```

## Configuration

### Settings (`settings.py`)

Add to `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ...
    'apps.ai_gateway',
]
```

### URLs (`urls.py`)

```python
urlpatterns = [
    path('api/v1/ai-gateway/', include('apps.ai_gateway.urls')),
]
```

## Database Migrations

```bash
python manage.py makemigrations ai_gateway
python manage.py migrate ai_gateway
```

## Testing

```bash
# Test intent classification
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a sunset"}'

# Test with image upload
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -F "message=Remove background" \
  -F "image=@test.jpg"

# List sessions
curl http://localhost:8000/api/v1/ai-gateway/sessions/

# Get capabilities
curl http://localhost:8000/api/v1/ai-gateway/capabilities/
```

## Integration Status

| Feature | Status | Model | Integration |
|---------|--------|-------|-------------|
| Intent Classification | ✅ Ready | Rule-based | Ready for NLP model |
| Prompt Refinement | ✅ Ready | Rule-based | Ready for LLM |
| Image Generation | ⏳ Placeholder | Stable Diffusion | TODO |
| Face Swap | ⏳ Placeholder | InsightFace | TODO |
| Background Removal | ⏳ Placeholder | U2-Net | TODO |
| Image Editing | ⏳ Placeholder | PIL/OpenCV | TODO |
| Style Transfer | ⏳ Placeholder | Neural Style | TODO |

## Development Roadmap

### Phase 1: Core Pipeline (✅ Complete)
- [x] Models and database schema
- [x] Serializers for request/response
- [x] Intent classification service (rule-based)
- [x] Prompt refinement service (rule-based)
- [x] Response handler service
- [x] Pipeline controller
- [x] REST API endpoints
- [x] Admin interface

### Phase 2: AI Model Integration (🔄 In Progress)
- [ ] Integrate Stable Diffusion for image generation
- [ ] Integrate LLM for prompt refinement (GPT/Claude)
- [ ] Integrate NLP model for intent classification
- [ ] Connect to existing services (face swap, background removal)

### Phase 3: Advanced Features (📋 Planned)
- [ ] Multi-image generation
- [ ] Image variations
- [ ] Real-time processing status (WebSocket)
- [ ] Image upscaling
- [ ] Template library
- [ ] User preferences and history

### Phase 4: Production Optimization (📋 Planned)
- [ ] Caching layer for common requests
- [ ] Rate limiting and quotas
- [ ] Model warm-up and preloading
- [ ] GPU optimization
- [ ] Batch processing

## File Structure

```
apps/ai_gateway/
├── __init__.py
├── models.py               # Database models
├── serializers.py          # Request/response serializers
├── views.py               # REST API endpoints
├── urls.py                # URL routing
├── admin.py               # Admin interface
├── pipeline.py            # Main orchestration controller
├── services/
│   ├── __init__.py
│   ├── intent_classification.py
│   ├── prompt_refinement.py
│   ├── image_generation.py
│   └── response_handler.py
├── migrations/
│   └── 0001_initial.py
├── README.md              # This file
└── API_DOCUMENTATION.md   # Complete API reference
```

## Troubleshooting

### Issue: Import errors
**Solution:** Install dependencies: `pip install -r requirements.txt`

### Issue: "Service error occurred"
**Solution:** Ensure AI models are downloaded and services are configured

### Issue: Slow response times
**Solution:** Use GPU, enable caching, preload models

### Issue: Session not found
**Solution:** Sessions expire after 24 hours, start a new session

## Contributing

When adding new features to AI Gateway:

1. **Add intent** in `IntentClassificationService`
2. **Create service** in `services/` directory
3. **Add route** in `pipeline.py` → `_route_to_service()`
4. **Update response** in `ResponseHandlerService`
5. **Document API** in `API_DOCUMENTATION.md`
6. **Test** all endpoints

## Support

For questions or issues:
- Check `API_DOCUMENTATION.md` for endpoint details
- Review `pipeline.py` for flow logic
- Check logs: `logs/backendai.log`
- Enable DEBUG mode for detailed error messages

## License

Part of AI Photo Studio Backend - Internal Project
