# API Endpoints Reference

Base URL: `http://localhost:9999`

## Conversation Flow (Chat with Bot)

### Session Management
- **Create Session**: `POST /api/v1/chat/sessions`
  - Body: `{"user_id": "string"}`
  - Returns: `{"session_id": "string", "user_id": "string", "created_at": "datetime"}`

- **Get Session Details**: `GET /api/v1/chat/sessions/{session_id}`
  - Returns: Session info with message history

### Messaging
- **Send Message**: `POST /api/v1/chat/sessions/{session_id}/messages`
  - Body: `{"user_id": "string", "message": "string"}`
  - Returns: Message response with detected intent and task info

- **Get Message Details**: `GET /api/v1/chat/sessions/{session_id}/messages/{message_id}`
  - Returns: Specific message details

## Direct Feature Access (No Conversation Required)

### Image Generation
- **Generate Image**: `POST /v1/features/image-generation/`
  - Body: `{"prompt": "string", "user_id": "string", "aspect_ratio": "string", "model": "string", "resolution": "string"}`
  - Returns: `{task_id, status, uploaded_urls, refined_prompt, ...}`

- **Check Status**: `GET /v1/features/image-generation/status/{task_id}/`
  - Returns: Current task status and results

### Upscale
- **Upscale Image**: `POST /v1/features/upscale/`
  - Body: Image + settings
  - Returns: Task info with uploaded URLs

### Remove Background
- **Remove Background**: `POST /v1/features/remove-background/`
  - Body: Image input
  - Returns: Task info with uploaded URL

### Relight
- **Relight Image**: `POST /v1/features/relight/`
  - Body: Image + prompt + style
  - Returns: Task info with uploaded URLs

### Style Transfer
- **Style Transfer**: `POST /v1/features/style-transfer/`
  - Body: Original image + reference image + settings
  - Returns: Task info with uploaded URLs

### Reimagine
- **Reimagine Image**: `POST /v1/features/reimagine/`
  - Body: Image + optional prompt + imagination level
  - Returns: Task info with uploaded URLs

### Image Expand
- **Expand Image**: `POST /v1/features/image-expand/`
  - Body: Image + prompt + expansion settings
  - Returns: Task info with uploaded URLs

## Gallery (Image History)

### Gallery Management
- **Get User Images**: `GET /v1/gallery/`
  - Query params: `user_id` (required), `intent` (optional)
  - Returns: `{"results": [...], "count": number}`

- **Get Image Details**: `GET /v1/gallery/{image_id}/`
  - Returns: Single image details

- **Delete Image**: `DELETE /v1/gallery/{image_id}/`
  - Returns: Success/error message

## Important Notes

1. **No Trailing Slashes** on most endpoints except POST endpoints
2. **Conversation URLs** are under `/api/v1/chat/`
3. **Feature URLs** are under `/v1/features/{feature-name}/`
4. **Gallery URLs** are under `/v1/gallery/`
5. **Session-based messaging** requires `session_id` in URL path, not in body
6. **User ID** is always required for tracking and gallery association

## URL Pattern Changes from Old API

| Old Pattern | New Pattern |
|-------------|-------------|
| `/api/conversation/sessions/` | `/api/v1/chat/sessions` |
| `/api/conversation/chat/` | `/api/v1/chat/sessions/{id}/messages` |
| `/api/image-generation/` | `/v1/features/image-generation/` |
| `/api/image-generation/{task_id}/` | `/v1/features/image-generation/status/{task_id}/` |
| `/api/image-gallery/` | `/v1/gallery/` |

## Testing

Run test scripts:
```bash
./test_conversation_api.sh
./test_image_generation_api.sh
```

See `API_TEST_README.md` for detailed testing instructions.
