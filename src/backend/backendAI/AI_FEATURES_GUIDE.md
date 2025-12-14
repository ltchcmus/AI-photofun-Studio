# AI Features Implementation Guide

## Overview
All 7 AI feature apps have been implemented using Freepik API. Each feature follows a consistent pattern:
- Service layer for business logic
- Celery tasks for async processing
- Token-based cost control
- File upload integration
- Status polling endpoints

---

## Architecture

### Core Infrastructure
- **`core/freepik_client.py`**: Unified HTTP client for all Freepik APIs
- **`core/file_uploader.py`**: Upload service for file-service-cdal.onrender.com
- **`core/token_client.py`**: External token management API integration
- **`core/token_decorators.py`**: `@require_tokens` decorator for views
- **`core/token_costs.py`**: Token pricing for each feature

### Token Costs
```python
TOKEN_COSTS = {
    'image_generation': 10,
    'upscale': 5,
    'remove_background': 3,
    'relight': 8,
    'style_transfer': 12,
    'reimagine': 15,
    'image_expand': 10
}
```

---

## Implemented Features

### 1. Image Generation (`apps/image_generation/`)
**Endpoint**: `POST /v1/features/image-generation/`

**Description**: Text-to-image generation using Freepik Mystic API with multiple AI models.

**Request Body**:
```json
{
  "prompt": "A sunset over mountains",
  "user_id": "user123",
  "aspect_ratio": "square_1_1",
  "style_reference": "https://example.com/style.jpg"
}
```

**Features**:
- Automatic prompt refinement via `PromptService`
- Multiple models: realism, fluid, zen, flexible, super_real
- Style and structure references support
- Resolution options: 2k, 4k
- HDR and creative detailing

**Status Polling**: `GET /v1/features/image-generation/status/<task_id>/`

---

### 2. Upscale (`apps/upscale/`)
**Endpoint**: `POST /v1/features/upscale/`

**Description**: Image upscaling with precision controls using Freepik Upscaler.

**Request Body**:
```json
{
  "image": "https://example.com/image.jpg",
  "user_id": "user123",
  "flavor": "photo"
}
```

**Flavor Presets**:
- `photo`: sharpen=0.5, smart_grain=0.2, ultra_detail=0.3
- `art`: sharpen=0.3, smart_grain=0.0, ultra_detail=0.5
- `illustration`: sharpen=0.7, smart_grain=0.0, ultra_detail=0.4

**Status Polling**: `GET /v1/features/upscale/status/<task_id>/`

---

### 3. Remove Background (`apps/remove_background/`)
**Endpoint**: `POST /v1/features/remove-background/`

**Description**: **SYNCHRONOUS** background removal (returns immediately).

**Request Body**:
```json
{
  "image": "https://example.com/image.jpg",
  "user_id": "user123"
}
```

**Note**: This is the only synchronous feature. No polling needed.

**Response**:
```json
{
  "no_background": "https://freepik.com/result.png",
  "original": "https://freepik.com/original.jpg",
  "uploaded_url": "https://file-service/stored.png"
}
```

---

### 4. Relight (`apps/relight/`)
**Endpoint**: `POST /v1/features/relight/`

**Description**: AI-powered image relighting with style presets.

**Request Body**:
```json
{
  "image": "https://example.com/image.jpg",
  "prompt": "Sunset lighting with warm tones",
  "user_id": "user123",
  "reference_image": "https://example.com/ref.jpg",
  "light_transfer_strength": 0.8,
  "style": "cinematic"
}
```

**Style Options**:
- `standard`
- `darker_but_realistic`
- `clean`
- `smooth`
- `cinematic`

**Status Polling**: `GET /v1/features/relight/status/<task_id>/`

---

### 5. Style Transfer (`apps/style_transfer/`)
**Endpoint**: `POST /v1/features/style-transfer/`

**Description**: Transfer artistic style from reference image.

**Request Body**:
```json
{
  "image": "https://example.com/image.jpg",
  "reference_image": "https://example.com/style.jpg",
  "user_id": "user123",
  "style_strength": 0.75,
  "structure_strength": 0.75,
  "is_portrait": false,
  "portrait_style": "anime"
}
```

**Portrait Styles** (when `is_portrait=true`):
- anime
- photographic
- digital_art
- comic_book
- fantasy_art
- line_art
- neon_punk

**Status Polling**: `GET /v1/features/style-transfer/status/<task_id>/`

---

### 6. Reimagine (`apps/reimagine/`)
**Endpoint**: `POST /v1/features/reimagine/`

**Description**: Reimagine existing images with AI creativity.

**Request Body**:
```json
{
  "image": "https://example.com/image.jpg",
  "user_id": "user123",
  "prompt": "Make it more futuristic",
  "imagination": "subtle",
  "aspect_ratio": "square_1_1"
}
```

**Imagination Levels**:
- `wild`: High creativity
- `subtle`: Conservative changes
- `vivid`: Enhanced colors and details

**Status Polling**: `GET /v1/features/reimagine/status/<task_id>/`

---

### 7. Image Expand (`apps/image_expand/`)
**Endpoint**: `POST /v1/features/image-expand/`

**Description**: Expand image borders with AI-generated fill.

**Request Body**:
```json
{
  "image": "https://example.com/image.jpg",
  "user_id": "user123",
  "prompt": "Continue the landscape",
  "left": 100,
  "right": 100,
  "top": 0,
  "bottom": 0
}
```

**Expansion Parameters**:
- `left`, `right`, `top`, `bottom`: Pixels to expand in each direction
- At least one direction must be > 0

**Status Polling**: `GET /v1/features/image-expand/status/<task_id>/`

---

## Common Workflow

### 1. Request Processing
```
User Request → Token Check (@require_tokens) → Validate Input (Serializer)
→ Call Service → Freepik API → Poll Status → Upload to File Service
→ Return URLs
```

### 2. Token Deduction
All endpoints protected by `@require_tokens` decorator:
```python
@require_tokens(cost=TOKEN_COSTS['feature_name'], feature='feature_name')
def post(self, request):
    # Token automatically deducted on success
```

### 3. File Upload Flow
```
Freepik Result URLs → file_uploader.upload_from_url()
→ file-service-cdal.onrender.com → Storage URL → Save to DB
```

### 4. Status Polling
Most features are async:
```
1. POST request returns task_id
2. Client polls GET /status/<task_id>/
3. When status=COMPLETED, get uploaded_urls
```

---

## API Endpoints Summary

| Feature | Endpoint | Method | Token Cost | Async? |
|---------|----------|--------|------------|--------|
| Image Generation | `/v1/features/image-generation/` | POST | 10 | ✅ |
| Image Generation Status | `/v1/features/image-generation/status/<task_id>/` | GET | - | - |
| Upscale | `/v1/features/upscale/` | POST | 5 | ✅ |
| Upscale Status | `/v1/features/upscale/status/<task_id>/` | GET | - | - |
| Remove Background | `/v1/features/remove-background/` | POST | 3 | ❌ (sync) |
| Relight | `/v1/features/relight/` | POST | 8 | ✅ |
| Relight Status | `/v1/features/relight/status/<task_id>/` | GET | - | - |
| Style Transfer | `/v1/features/style-transfer/` | POST | 12 | ✅ |
| Style Transfer Status | `/v1/features/style-transfer/status/<task_id>/` | GET | - | - |
| Reimagine | `/v1/features/reimagine/` | POST | 15 | ✅ |
| Reimagine Status | `/v1/features/reimagine/status/<task_id>/` | GET | - | - |
| Image Expand | `/v1/features/image-expand/` | POST | 10 | ✅ |
| Image Expand Status | `/v1/features/image-expand/status/<task_id>/` | GET | - | - |

---

## Configuration

### Settings.py
All apps registered in `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ...
    "apps.image_generation",
    "apps.upscale",
    "apps.remove_background",
    "apps.relight",
    "apps.style_transfer",
    "apps.reimagine",
    "apps.image_expand",
]
```

### Environment Variables
```bash
# Freepik API
FREEPIK_API_KEY=FPSX66c28e0d80af9f0e2e80d89ee01e834c

# File Upload Service
FILE_UPLOAD_URL=https://file-service-cdal.onrender.com/api/v1/file/uploads

# Token Service
TOKEN_SERVICE_URL=<your-token-service-url>
```

---

## Error Handling

Each feature has custom exception:
- `ImageGenerationError`
- `UpscaleError`
- `RemoveBackgroundError`
- `RelightError`
- `StyleTransferError`
- `ReimagineError`
- `ImageExpandError`

All views return standardized error responses via `APIResponse.error()`.

---

## Testing Checklist

- [ ] Test each feature with real Freepik API
- [ ] Verify token deduction works
- [ ] Test status polling for async features
- [ ] Verify file upload to storage service
- [ ] Test error handling (invalid input, API failures)
- [ ] Test rate limiting on AI endpoints
- [ ] Test input sanitization on prompts
- [ ] Integration test: conversation flow → AI feature → gallery save

---

## Next Steps

1. **Test all endpoints** with real API credentials
2. **Implement image_gallery auto-save** after successful generation
3. **Add webhook support** for async notifications
4. **Integrate with conversation flow** (intent router → AI features)
5. **Add monitoring and logging** for production
6. **Setup Celery workers** for background tasks
7. **Configure Redis** for rate limiting and caching

---

## Quick Start

```bash
# 1. Set environment variables
export FREEPIK_API_KEY="FPSX66c28e0d80af9f0e2e80d89ee01e834c"

# 2. Run migrations (if any)
python manage.py migrate

# 3. Start development server
python manage.py runserver

# 4. Test image generation
curl -X POST http://localhost:8000/v1/features/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A sunset over mountains",
    "user_id": "test123",
    "aspect_ratio": "square_1_1"
  }'

# 5. Poll status (use task_id from response)
curl http://localhost:8000/v1/features/image-generation/status/<task_id>/
```

---

## Support

For issues or questions:
- Check Freepik API documentation: https://docs.freepik.com
- Review `core/freepik_client.py` for implementation details
- Check logs in `logs/debug.log`
