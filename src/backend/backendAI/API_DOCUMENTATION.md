# AI PhotoFun Studio - Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:9999/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Token System](#authentication--token-system)
3. [Common Response Format](#common-response-format)
4. [Image Input Formats](#image-input-formats)
5. [API Endpoints](#api-endpoints)
   - [Conversation Service](#conversation-service)
   - [Image Generation](#image-generation)
   - [Upscale (Image Enhancement)](#upscale-image-enhancement)
   - [Remove Background](#remove-background)
   - [Reimagine](#reimagine)
   - [Relight](#relight)
   - [Image Expand](#image-expand)
   - [Style Transfer](#style-transfer)
   - [Image Gallery](#image-gallery)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## Overview

The AI PhotoFun Studio Backend provides AI-powered image manipulation services through RESTful APIs. The backend supports:

- **Conversational AI** for natural language image processing
- **Direct feature access** for immediate image operations
- **Image gallery management** for storing and organizing generated images
- **Multiple image input formats** (base64, URL, file upload)

### Key Technologies

- **Framework:** Django 5.2 + Django REST Framework
- **AI Models:** Google Gemini 2.5-flash (prompt refinement), Freepik AI APIs (image processing)
- **Database:** MongoDB (conversations), PostgreSQL (image gallery)
- **File Storage:** Cloudinary
- **Task Queue:** Celery + Redis

---

## Authentication & Token System

### Token-Based Usage Limits

Each AI feature consumes tokens from the user's account:

| Feature | Token Cost | Processing Type | Typical Time |
|---------|-----------|----------------|--------------|
| Image Generation | 10 tokens | Async (polling) | 3-8 seconds |
| Upscale | 5 tokens | Async (polling) | 5-15 seconds |
| Remove Background | 3 tokens | Synchronous | 1-3 seconds |
| Reimagine | 15 tokens | Sync/Async | < 1s or 3-10s |
| Relight | 8 tokens | Async (polling) | 5-10 seconds |
| Image Expand | 12 tokens | Async (polling) | 5-12 seconds |
| Style Transfer | 10 tokens | Async (polling) | 5-15 seconds |

**Processing Types Explained:**
- **Synchronous**: Returns result immediately in POST response, no polling needed
- **Async (polling)**: Returns task_id in POST response, requires polling status endpoint
- **Sync/Async**: May complete immediately or require polling depending on complexity

### Bypassing Token Check (Development Only)

For testing, you can bypass token checks by using specific user_id patterns:
- `test_*` (e.g., `test_user_123`)
- `direct_test_*` (e.g., `direct_test_1234567890`)

**⚠️ Important:** This bypass should be disabled in production.

---

## Common Response Format

All API responses follow this standard structure:

### Success Response
```json
{
  "code": 1000,
  "message": "Success message",
  "result": {
    // Response data
  }
}
```

### Error Response
```json
{
  "code": 9999,
  "message": "Error description",
  "errors": "Detailed error information"
}
```

### HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Image Input Formats

The API supports three formats for image input:

### 1. Base64 Encoded Image

```json
{
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "user_id": "user123"
}
```

**Format:** Data URI with base64 encoding  
**Max Size:** Recommended < 10MB  
**Supported Types:** JPEG, PNG, WEBP

### 2. Image URL

```json
{
  "image_url": "https://example.com/image.jpg",
  "user_id": "user123"
}
```

**Requirements:**
- Publicly accessible URL
- Must return valid image content
- Supports: JPEG, PNG, WEBP
- Recommended: Use CDN URLs for best performance

### 3. File Upload (Multipart Form-Data)

```bash
curl -X POST http://localhost:9999/v1/features/remove-background/ \
  -F "image_file=@/path/to/image.jpg" \
  -F "user_id=user123"
```

**Field Name:** `image_file`  
**Content-Type:** `multipart/form-data`  
**Max Size:** 10MB

---

## API Endpoints

### Feature Capabilities Overview

| Feature | Input | Key Parameters | Output | Use Cases |
|---------|-------|----------------|--------|-----------|
| **Image Generation** | Text prompt | aspect_ratio, num_images, style | New AI image | Create images from descriptions |
| **Upscale** | Image | flavor (photo/sublime/denoiser) | 2x resolution | Enhance image quality, increase size |
| **Remove Background** | Image | None | Transparent PNG | Product photos, portraits, compositing |
| **Reimagine** | Image + prompt | imagination, aspect_ratio | Reimagined image | Creative transformations, style changes |
| **Relight** | Image + prompt/reference | style, light_transfer_strength | Relit image | Change lighting conditions, time of day |
| **Image Expand** | Image + directions | left, right, top, bottom | Expanded image | Extend canvas, uncrop photos |
| **Style Transfer** | Image + reference | style_strength, structure_strength | Styled image | Apply artistic styles, filters |

---

## Conversation Service

The conversation service provides a chat-based interface for AI image processing.

### 1. Create or Get Session

**Endpoint:** `POST /v1/chat/sessions`

**Description:** Creates a new chat session or retrieves existing session for a user.

**Request Body:**
```json
{
  "user_id": "user123"
}
```

**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "session_id": "6766f0a3e5c9d2a3b4c5d6e7",
    "user_id": "user123",
    "messages": [],
    "created_at": "2025-12-14T10:30:00Z",
    "updated_at": "2025-12-14T10:30:00Z"
  }
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:9999/v1/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:9999/v1/chat/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'user123' })
});
const data = await response.json();
console.log(data.result.session_id);
```

---

### 2. Get Conversation History

**Endpoint:** `GET /v1/chat/sessions/{session_id}`

**Description:** Retrieves full conversation history including all messages.

**URL Parameters:**
- `session_id` (string, required) - The conversation session ID

**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "session_id": "6766f0a3e5c9d2a3b4c5d6e7",
    "user_id": "user123",
    "messages": [
      {
        "role": "user",
        "content": "Generate a sunset image",
        "timestamp": "2025-12-14T10:31:00Z"
      },
      {
        "role": "assistant",
        "content": "I'll generate a beautiful sunset image for you.",
        "timestamp": "2025-12-14T10:31:05Z",
        "task_id": "abc123",
        "intent": "image_generation"
      }
    ],
    "created_at": "2025-12-14T10:30:00Z",
    "updated_at": "2025-12-14T10:31:05Z"
  }
}
```

**Example (cURL):**
```bash
curl http://localhost:9999/v1/chat/sessions/6766f0a3e5c9d2a3b4c5d6e7
```

---

### 3. Send Message

**Endpoint:** `POST /v1/chat/sessions/{session_id}/messages`

**Description:** Sends a message and receives AI response with task routing.

**URL Parameters:**
- `session_id` (string, required) - The conversation session ID

**Request Body:**
```json
{
  "message": "Generate a beautiful sunset over mountains",
  "user_id": "user123"
}
```

**Response (Async Task Created):**
```json
{
  "code": 1000,
  "message": "Message processed",
  "result": {
    "session_id": "6766f0a3e5c9d2a3b4c5d6e7",
    "user_message": {
      "role": "user",
      "content": "Generate a beautiful sunset over mountains",
      "timestamp": "2025-12-14T10:32:00Z"
    },
    "assistant_message": {
      "role": "assistant",
      "content": "I'll generate that image for you. Processing...",
      "timestamp": "2025-12-14T10:32:02Z",
      "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
      "intent": "image_generation",
      "status": "CREATED"
    }
  }
}
```

**Polling for Completion:**

After receiving `task_id`, poll the status endpoint:

```bash
# For image generation tasks
curl "http://localhost:9999/v1/features/image-generate/status/0a83d2ae-472e-484b-9c2b-3ae774907280/?user_id=user123"
```

**Example (JavaScript - Complete Flow):**
```javascript
// 1. Create session
const sessionRes = await fetch('http://localhost:9999/v1/chat/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'user123' })
});
const { result: session } = await sessionRes.json();

// 2. Send message
const messageRes = await fetch(
  `http://localhost:9999/v1/chat/sessions/${session.session_id}/messages`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Generate a sunset',
      user_id: 'user123'
    })
  }
);
const { result } = await messageRes.json();

// 3. Poll task status
const taskId = result.assistant_message.task_id;
const pollStatus = async () => {
  const statusRes = await fetch(
    `http://localhost:9999/v1/features/image-generate/status/${taskId}/?user_id=user123`
  );
  const { result: status } = await statusRes.json();
  
  if (status.status === 'COMPLETED') {
    console.log('Image URL:', status.image_url);
    return status;
  } else if (status.status === 'FAILED') {
    throw new Error('Task failed');
  } else {
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 3000));
    return pollStatus();
  }
};

const finalResult = await pollStatus();
```

---

### 4. Delete Session

**Endpoint:** `DELETE /v1/chat/sessions/{session_id}`

**Description:** Permanently deletes a conversation session and all its messages.

**URL Parameters:**
- `session_id` (string, required) - The conversation session ID

**Response:**
```json
{
  "code": 1000,
  "message": "Session deleted successfully",
  "result": {}
}
```

**Example (cURL):**
```bash
curl -X DELETE http://localhost:9999/v1/chat/sessions/6766f0a3e5c9d2a3b4c5d6e7
```

---

## Image Generation

Direct API for AI image generation using Freepik Mystic AI.

### Create Image Generation Task

**Endpoint:** `POST /v1/features/image-generate/`

**Description:** Creates an async task to generate an image from text prompt. The prompt is automatically refined using Gemini AI.

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "user_id": "user123",
  "aspect_ratio": "16:9",
  "num_images": 1,
  "styling": {
    "style": "photorealistic"
  }
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text description of desired image |
| `user_id` | string | Yes | - | User identifier |
| `aspect_ratio` | string | No | "1:1" | Image dimensions: "1:1", "16:9", "9:16", "3:2", "2:3" |
| `num_images` | integer | No | 1 | Number of images (1-4) |
| `styling.style` | string | No | "photorealistic" | Style: "photorealistic", "digital-art", "anime", etc. |

**Response:**
```json
{
  "code": 1000,
  "message": "Image generation started. Use task_id to poll status.",
  "result": {
    "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
    "status": "CREATED",
    "refined_prompt": "A breathtaking photorealistic image of a beautiful sunset over majestic mountains, illuminated by the warm golden hour light."
  }
}
```

---

### Check Generation Status

**Endpoint:** `GET /v1/features/image-generate/status/{task_id}/`

**Description:** Polls the status of an image generation task. When completed, returns the generated image URL.

**URL Parameters:**
- `task_id` (string, required) - Task ID from creation response

**Query Parameters:**
- `user_id` (string, required) - User identifier for gallery save

**Response (In Progress):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
    "status": "IN_PROGRESS",
    "image_url": null
  }
}
```

**Response (Completed):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
    "status": "COMPLETED",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/13c09135-a91a-4aa9-a814-a60321a83b9e.png"
  }
}
```

**Task Status Values:**
- `CREATED` - Task created, queued for processing
- `IN_PROGRESS` - AI is generating the image
- `COMPLETED` - Image generated and uploaded successfully
- `FAILED` - Generation failed (check error message)

**Complete Example (JavaScript):**
```javascript
// Create task
const createRes = await fetch('http://localhost:9999/v1/features/image-generate/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A beautiful sunset over mountains',
    user_id: 'user123',
    aspect_ratio: '16:9',
    num_images: 1,
    styling: { style: 'photorealistic' }
  })
});
const { result: task } = await createRes.json();
console.log('Task created:', task.task_id);
console.log('Refined prompt:', task.refined_prompt);

// Poll status
const pollInterval = setInterval(async () => {
  const statusRes = await fetch(
    `http://localhost:9999/v1/features/image-generate/status/${task.task_id}/?user_id=user123`
  );
  const { result: status } = await statusRes.json();
  
  console.log('Status:', status.status);
  
  if (status.status === 'COMPLETED') {
    clearInterval(pollInterval);
    console.log('Image generated:', status.image_url);
    // Display image in UI
    document.getElementById('result-img').src = status.image_url;
  } else if (status.status === 'FAILED') {
    clearInterval(pollInterval);
    console.error('Generation failed');
  }
}, 3000); // Poll every 3 seconds
```

**Complete Example (cURL):**
```bash
# 1. Create task
RESPONSE=$(curl -s -X POST http://localhost:9999/v1/features/image-generate/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "user_id": "user123",
    "aspect_ratio": "16:9",
    "num_images": 1,
    "styling": {"style": "photorealistic"}
  }')

TASK_ID=$(echo $RESPONSE | jq -r '.result.task_id')
echo "Task ID: $TASK_ID"

# 2. Poll status (repeat until COMPLETED)
while true; do
  STATUS_RESPONSE=$(curl -s "http://localhost:9999/v1/features/image-generate/status/$TASK_ID/?user_id=user123")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.result.status')
  
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "COMPLETED" ]; then
    IMAGE_URL=$(echo $STATUS_RESPONSE | jq -r '.result.image_url')
    echo "Image URL: $IMAGE_URL"
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Generation failed"
    break
  fi
  
  sleep 3
done
```

---

## Upscale (Image Enhancement)

Upscale images to higher resolution using Freepik V2 Upscaler Precision API. The V2 API offers improved quality with flavor optimization and configurable scaling factors.

### Create Upscale Task

**Endpoint:** `POST /v1/features/upscale/`

**Description:** Creates an async task to upscale an image to higher resolution with quality enhancement controls. Uses Freepik V2 API for improved results.

**Request Body (URL Format):**
```json
{
  "image_url": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800",
  "user_id": "user123",
  "flavor": "photo"
}
```

**Request Body (Base64 Format):**
```json
{
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "user_id": "user123",
  "flavor": "sublime"
}
```

**Request (File Upload):**
```bash
curl -X POST http://localhost:9999/v1/features/upscale/ \
  -F "image_file=@/path/to/image.jpg" \
  -F "user_id=user123" \
  -F "flavor=photo"
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `image_data` | string | One of three | - | Base64 encoded image with data URI prefix |
| `image_url` | string | One of three | - | Publicly accessible image URL |
| `image_file` | file | One of three | - | Uploaded image file (multipart/form-data) |
| `user_id` | string | Yes | - | User identifier |
| `flavor` | string | No | "photo" | Upscale optimization: "photo" (realistic photos), "sublime" (artistic/illustrations), "photo_denoiser" (noisy photos) |

**Flavor Descriptions:**
- **photo**: Best for realistic photographs, balances sharpness and natural look
- **sublime**: Optimized for artistic content, illustrations, and creative images
- **photo_denoiser**: Specifically for noisy/grainy photos, reduces noise while upscaling

**Response:**
```json
{
  "code": 1000,
  "message": "Upscale started (V2 API). Use task_id to poll status.",
  "result": {
    "task_id": "32dfd56d-b60c-47dd-a1a5-63f5de67237e",
    "status": "CREATED",
    "image_url": null,
    "original_image": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800",
    "flavor": "photo",
    "scale_factor": 2,
    "settings": {
      "sharpen": 0.5,
      "smart_grain": 0.2,
      "ultra_detail": 0.3
    }
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | string | Unique task identifier for polling status |
| `status` | string | Task status: "CREATED", "IN_PROGRESS", "COMPLETED", "FAILED" |
| `image_url` | string/null | Cloudinary URL of upscaled image (null until completed) |
| `original_image` | string | URL of the original input image |
| `flavor` | string | Applied upscale flavor optimization |
| `scale_factor` | integer | Upscale multiplier (2x = 2, 4x = 4) |
| `settings` | object | Applied quality settings (sharpen, smart_grain, ultra_detail as 0.0-1.0) |

---

### Check Upscale Status

**Endpoint:** `GET /v1/features/upscale/status/{task_id}/`

**Description:** Polls the status of an upscale task. When completed, returns the upscaled image URL.

**URL Parameters:**
- `task_id` (string, required) - Task ID from creation response

**Query Parameters:**
- `user_id` (string, required) - User identifier for gallery save

**Response (In Progress):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "32dfd56d-b60c-47dd-a1a5-63f5de67237e",
    "status": "IN_PROGRESS",
    "image_url": null
  }
}
```

**Response (Completed):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "32dfd56d-b60c-47dd-a1a5-63f5de67237e",
    "status": "COMPLETED",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/abc123.png"
  }
}
```

**Complete Example (JavaScript):**
```javascript
// Create upscale task
const createRes = await fetch('http://localhost:9999/v1/features/upscale/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/photo.jpg',
    user_id: 'user123',
    flavor: 'photo'
  })
});
const { result: task } = await createRes.json();

// Poll status
const pollInterval = setInterval(async () => {
  const statusRes = await fetch(
    `http://localhost:9999/v1/features/upscale/status/${task.task_id}/?user_id=user123`
  );
  const { result: status } = await statusRes.json();
  
  if (status.status === 'COMPLETED') {
    clearInterval(pollInterval);
    console.log('Upscaled image:', status.image_url);
  } else if (status.status === 'FAILED') {
    clearInterval(pollInterval);
    console.error('Upscale failed');
  }
}, 3000);
```

**Processing Time:** Typically 5-15 seconds depending on image size

---

## Remove Background

Synchronous API for removing image backgrounds using Freepik AI.

### Remove Background from Image

**Endpoint:** `POST /v1/features/remove-background/`

**Description:** Removes the background from an image. Returns immediately with processed image (synchronous operation).

**Request Body (URL Format):**
```json
{
  "image_url": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800",
  "user_id": "user123"
}
```

**Request Body (Base64 Format):**
```json
{
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "user_id": "user123"
}
```

**Request (File Upload):**
```bash
curl -X POST http://localhost:9999/v1/features/remove-background/ \
  -F "image_file=@/path/to/image.jpg" \
  -F "user_id=user123"
```

**Response:**
```json
{
  "code": 1000,
  "message": "Background removed successfully",
  "result": {
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765696480/file-service/51d7a4a8-d2c4-4685-9b29-fbfb711a246b.png",
    "input_source": "url"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `image_url` | string | Cloudinary URL of processed image (transparent background) |
| `input_source` | string | How image was provided: "url", "base64", or "file" |

**Example (JavaScript - URL Input):**
```javascript
const response = await fetch('http://localhost:9999/v1/features/remove-background/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/photo.jpg',
    user_id: 'user123'
  })
});

const { result } = await response.json();
console.log('Processed image:', result.image_url);

// Display result
document.getElementById('output').src = result.image_url;
```

**Example (JavaScript - File Upload):**
```javascript
const fileInput = document.getElementById('file-input');
const formData = new FormData();
formData.append('image_file', fileInput.files[0]);
formData.append('user_id', 'user123');

const response = await fetch('http://localhost:9999/v1/features/remove-background/', {
  method: 'POST',
  body: formData
});

const { result } = await response.json();
console.log('Processed image:', result.image_url);
```

**Example (Python):**
```python
import requests

# URL input
response = requests.post(
    'http://localhost:9999/v1/features/remove-background/',
    json={
        'image_url': 'https://example.com/photo.jpg',
        'user_id': 'user123'
    }
)
data = response.json()
print('Result:', data['result']['image_url'])

# File upload
with open('image.jpg', 'rb') as f:
    files = {'image_file': f}
    data = {'user_id': 'user123'}
    response = requests.post(
        'http://localhost:9999/v1/features/remove-background/',
        files=files,
        data=data
    )
    result = response.json()
    print('Result:', result['result']['image_url'])
```

**Processing Time:** Typically 1-3 seconds

**Important Notes:**
- This endpoint is **synchronous** (does not use task polling)
- Maximum image size: 10MB
- Supported formats: JPEG, PNG, WEBP
- Output format: PNG with transparency
- Result is automatically uploaded to Cloudinary

---

## Reimagine

Transform images with AI creativity using Freepik Reimagine Flux API. This feature can complete synchronously or asynchronously depending on complexity.

### Create Reimagine Task

**Endpoint:** `POST /v1/features/reimagine/`

**Description:** Reimagines an image with AI creativity, optionally guided by a prompt. The API may return completed results immediately or require polling.

**Request Body:**
```json
{
  "image_url": "https://example.com/photo.jpg",
  "user_id": "user123",
  "prompt": "Transform into a watercolor painting",
  "imagination": "creative",
  "aspect_ratio": "portrait_4_5"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `image_data` | string | One of three | - | Base64 encoded image with data URI prefix |
| `image_url` | string | One of three | - | Publicly accessible image URL |
| `image_file` | file | One of three | - | Uploaded image file (multipart/form-data) |
| `user_id` | string | Yes | - | User identifier |
| `prompt` | string | No | null | Optional guidance for reimagination (AI will refine) |
| `imagination` | string | No | "subtle" | Creativity level: "subtle", "moderate", "creative", "extreme" |
| `aspect_ratio` | string | No | "square_1_1" | Output dimensions: "square_1_1", "portrait_4_5", "portrait_2_3", "landscape_16_9", "landscape_3_2" |

**Imagination Level Descriptions:**
- **subtle**: Minor creative adjustments, stays very close to original
- **moderate**: Balanced creativity, recognizable but enhanced
- **creative**: Significant creative transformation
- **extreme**: Maximum AI freedom, dramatic reimagination

**Aspect Ratio Options:**
- **square_1_1**: 1:1 square format
- **portrait_4_5**: 4:5 portrait (Instagram style)
- **portrait_2_3**: 2:3 portrait (standard photo)
- **landscape_16_9**: 16:9 landscape (widescreen)
- **landscape_3_2**: 3:2 landscape (classic photo)

**Response (Completed Immediately):**
```json
{
  "code": 1000,
  "message": "Reimagine completed!",
  "result": {
    "task_id": "abc123",
    "status": "COMPLETED",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/abc123.png",
    "original_image": "https://example.com/photo.jpg",
    "imagination": "creative",
    "refined_prompt": "Transform the image into a beautiful watercolor painting with soft brush strokes and artistic flair",
    "aspect_ratio": "portrait_4_5"
  }
}
```

**Response (Requires Polling):**
```json
{
  "code": 1000,
  "message": "Reimagine started. Use task_id to poll status.",
  "result": {
    "task_id": "abc123",
    "status": "CREATED",
    "image_url": null,
    "original_image": "https://example.com/photo.jpg",
    "imagination": "creative",
    "refined_prompt": "Transform the image into a beautiful watercolor painting with soft brush strokes and artistic flair",
    "aspect_ratio": "portrait_4_5"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | string | Unique task identifier |
| `status` | string | "CREATED", "IN_PROGRESS", "COMPLETED", "FAILED" |
| `image_url` | string/null | Cloudinary URL of reimagined image (null if not completed) |
| `original_image` | string | URL of the original input image |
| `imagination` | string | Applied creativity level |
| `refined_prompt` | string | AI-enhanced prompt (if prompt provided) |
| `aspect_ratio` | string | Applied aspect ratio |

---

### Check Reimagine Status

**Endpoint:** `GET /v1/features/reimagine/status/{task_id}/`

**Description:** Polls the status of a reimagine task. Use only if initial response status was not "COMPLETED".

**URL Parameters:**
- `task_id` (string, required) - Task ID from creation response

**Query Parameters:**
- `user_id` (string, required) - User identifier for gallery save

**Response:** Same format as completion response above.

**Complete Example (JavaScript):**
```javascript
// Create reimagine task
const createRes = await fetch('http://localhost:9999/v1/features/reimagine/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/photo.jpg',
    user_id: 'user123',
    prompt: 'Transform into a watercolor painting',
    imagination: 'creative',
    aspect_ratio: 'portrait_4_5'
  })
});
const { result: task } = await createRes.json();

// Check if already completed
if (task.status === 'COMPLETED') {
  console.log('Reimagined immediately:', task.image_url);
} else {
  // Poll for completion
  const pollInterval = setInterval(async () => {
    const statusRes = await fetch(
      `http://localhost:9999/v1/features/reimagine/status/${task.task_id}/?user_id=user123`
    );
    const { result: status } = await statusRes.json();
    
    if (status.status === 'COMPLETED') {
      clearInterval(pollInterval);
      console.log('Reimagined image:', status.image_url);
    } else if (status.status === 'FAILED') {
      clearInterval(pollInterval);
      console.error('Reimagine failed');
    }
  }, 3000);
}
```

**Processing Time:** Often completes synchronously (< 1s), or 3-10 seconds if async

---

## Relight

Relight images with AI-controlled lighting using Freepik Relight API. Supports prompt-based lighting or reference image lighting transfer.

### Create Relight Task

**Endpoint:** `POST /v1/features/relight/`

**Description:** Creates an async task to relight an image with AI-generated lighting. Supports either text prompt for new lighting or reference image for lighting transfer.

**Request Body (Prompt-Based):**
```json
{
  "image_url": "https://example.com/photo.jpg",
  "user_id": "user123",
  "prompt": "warm sunset lighting from the right",
  "style": "dramatic"
}
```

**Request Body (Reference Image Transfer):**
```json
{
  "image_url": "https://example.com/photo.jpg",
  "reference_image_url": "https://example.com/lighting-reference.jpg",
  "user_id": "user123",
  "prompt": "apply the lighting from reference image",
  "light_transfer_strength": 0.8,
  "style": "standard"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `image_data` | string | One of three | - | Base64 encoded main image |
| `image_url` | string | One of three | - | Main image URL |
| `image_file` | file | One of three | - | Main image file upload |
| `user_id` | string | Yes | - | User identifier |
| `prompt` | string | Yes | - | Lighting description or instruction |
| `reference_image_data` | string | Optional | null | Base64 encoded reference image |
| `reference_image_url` | string | Optional | null | Reference image URL |
| `reference_image_file` | file | Optional | null | Reference image file upload |
| `light_transfer_strength` | float | No | 0.8 | Strength of reference lighting transfer (0.0-1.0) |
| `style` | string | No | "standard" | Relighting style: "standard", "dramatic", "soft", "natural" |

**Style Descriptions:**
- **standard**: Balanced, natural-looking lighting
- **dramatic**: High contrast, theatrical lighting
- **soft**: Gentle, diffused lighting
- **natural**: Mimics natural light sources

**Response:**
```json
{
  "code": 1000,
  "message": "Relight started. Use task_id to poll status.",
  "result": {
    "task_id": "def456",
    "status": "CREATED",
    "image_url": null,
    "original_image": "https://example.com/photo.jpg",
    "reference_image": "https://example.com/lighting-reference.jpg",
    "light_transfer_strength": 0.8,
    "style": "standard"
  }
}
```

---

### Check Relight Status

**Endpoint:** `GET /v1/features/relight/status/{task_id}/`

**Description:** Polls the status of a relight task.

**URL Parameters:**
- `task_id` (string, required) - Task ID from creation response

**Query Parameters:**
- `user_id` (string, required) - User identifier for gallery save

**Response (Completed):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "def456",
    "status": "COMPLETED",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/def456.png"
  }
}
```

**Processing Time:** Typically 5-10 seconds

---

## Image Expand

Expand image boundaries with AI-generated content using Freepik Flux Pro API.

### Create Image Expand Task

**Endpoint:** `POST /v1/features/image-expand/`

**Description:** Creates an async task to expand image borders in specified directions with AI-generated seamless content.

**Request Body:**
```json
{
  "image_url": "https://example.com/photo.jpg",
  "user_id": "user123",
  "prompt": "continue the ocean waves and beach scenery",
  "left": 100,
  "right": 100,
  "top": 0,
  "bottom": 50
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `image_data` | string | One of three | - | Base64 encoded image |
| `image_url` | string | One of three | - | Image URL |
| `image_file` | file | One of three | - | Image file upload |
| `user_id` | string | Yes | - | User identifier |
| `prompt` | string | No | null | Optional guidance for expansion content |
| `left` | integer | No | 0 | Pixels to expand on left side (0-500) |
| `right` | integer | No | 0 | Pixels to expand on right side (0-500) |
| `top` | integer | No | 0 | Pixels to expand on top (0-500) |
| `bottom` | integer | No | 0 | Pixels to expand on bottom (0-500) |

**Note:** At least one direction (left, right, top, bottom) must be > 0.

**Response:**
```json
{
  "code": 1000,
  "message": "Image expand started. Use task_id to poll status.",
  "result": {
    "task_id": "ghi789",
    "status": "CREATED",
    "image_url": null,
    "original_image": "https://example.com/photo.jpg",
    "left": 100,
    "right": 100,
    "top": 0,
    "bottom": 50
  }
}
```

---

### Check Image Expand Status

**Endpoint:** `GET /v1/features/image-expand/status/{task_id}/`

**Description:** Polls the status of an expand task.

**URL Parameters:**
- `task_id` (string, required) - Task ID from creation response

**Query Parameters:**
- `user_id` (string, required) - User identifier for gallery save

**Response (Completed):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "ghi789",
    "status": "COMPLETED",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/ghi789.png"
  }
}
```

**Processing Time:** Typically 5-12 seconds depending on expansion size

---

## Style Transfer

Apply artistic style from reference image to target image using Freepik Style Transfer API.

### Create Style Transfer Task

**Endpoint:** `POST /v1/features/style-transfer/`

**Description:** Creates an async task to transfer artistic style from a reference image to a target image. Supports both general and portrait-optimized transfers.

**Request Body (General Style Transfer):**
```json
{
  "image_url": "https://example.com/photo.jpg",
  "reference_image_url": "https://example.com/painting.jpg",
  "user_id": "user123",
  "style_strength": 0.75,
  "structure_strength": 0.75,
  "is_portrait": false
}
```

**Request Body (Portrait Style Transfer):**
```json
{
  "image_url": "https://example.com/portrait.jpg",
  "reference_image_url": "https://example.com/artistic-portrait.jpg",
  "user_id": "user123",
  "style_strength": 0.8,
  "structure_strength": 0.7,
  "is_portrait": true,
  "portrait_style": "artistic"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `image_data` | string | One of three | - | Base64 encoded target image |
| `image_url` | string | One of three | - | Target image URL |
| `image_file` | file | One of three | - | Target image file upload |
| `reference_image_data` | string | One of three | - | Base64 encoded style reference |
| `reference_image_url` | string | One of three | - | Style reference image URL |
| `reference_image_file` | file | One of three | - | Style reference file upload |
| `user_id` | string | Yes | - | User identifier |
| `style_strength` | float | No | 0.75 | How much style to apply (0.0-1.0) |
| `structure_strength` | float | No | 0.75 | How much to preserve original structure (0.0-1.0) |
| `is_portrait` | boolean | No | false | Enable portrait-specific optimization |
| `portrait_style` | string | No | "standard" | Portrait style: "standard", "artistic", "realistic" (only if is_portrait=true) |

**Parameter Guidelines:**
- **style_strength**: 0.0 = no style transfer, 1.0 = maximum style application
- **structure_strength**: 0.0 = free transformation, 1.0 = preserve exact structure
- Balanced settings: Both around 0.7-0.8 for natural results
- High style, low structure: More artistic, abstract results
- Low style, high structure: Subtle style hints, maintains composition

**Portrait Style Options (when is_portrait=true):**
- **standard**: Balanced portrait style transfer
- **artistic**: Emphasizes artistic expression, more creative
- **realistic**: Maintains photorealistic quality

**Response:**
```json
{
  "code": 1000,
  "message": "Style transfer started. Use task_id to poll status.",
  "result": {
    "task_id": "jkl012",
    "status": "CREATED",
    "image_url": null,
    "original_image": "https://example.com/photo.jpg",
    "reference_image": "https://example.com/painting.jpg",
    "style_strength": 0.75,
    "structure_strength": 0.75,
    "is_portrait": false,
    "portrait_style": "standard"
  }
}
```

---

### Check Style Transfer Status

**Endpoint:** `GET /v1/features/style-transfer/status/{task_id}/`

**Description:** Polls the status of a style transfer task.

**URL Parameters:**
- `task_id` (string, required) - Task ID from creation response

**Query Parameters:**
- `user_id` (string, required) - User identifier for gallery save

**Response (Completed):**
```json
{
  "code": 1000,
  "message": "Task status retrieved",
  "result": {
    "task_id": "jkl012",
    "status": "COMPLETED",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/jkl012.png"
  }
}
```

**Complete Example (JavaScript):**
```javascript
// Upload both images and create style transfer
const createRes = await fetch('http://localhost:9999/v1/features/style-transfer/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_url: 'https://example.com/photo.jpg',
    reference_image_url: 'https://example.com/painting.jpg',
    user_id: 'user123',
    style_strength: 0.75,
    structure_strength: 0.75,
    is_portrait: false
  })
});
const { result: task } = await createRes.json();

// Poll for completion
const pollInterval = setInterval(async () => {
  const statusRes = await fetch(
    `http://localhost:9999/v1/features/style-transfer/status/${task.task_id}/?user_id=user123`
  );
  const { result: status } = await statusRes.json();
  
  if (status.status === 'COMPLETED') {
    clearInterval(pollInterval);
    console.log('Style transferred:', status.image_url);
    document.getElementById('result').src = status.image_url;
  } else if (status.status === 'FAILED') {
    clearInterval(pollInterval);
    console.error('Style transfer failed');
  }
}, 3000);
```

**Processing Time:** Typically 5-15 seconds

---

## Image Gallery

API for managing user's generated images collection.

**Important:** All gallery endpoints do NOT use trailing slash.

**URL Format:**
- ✅ `/v1/gallery` (correct)
- ✅ `/v1/gallery/<image_id>` (correct)
- ❌ `/v1/gallery/` (wrong - will redirect)
- ❌ `/v1/gallery/<image_id>/` (wrong - will redirect)

### 1. List User Images

**Endpoint:** `GET /v1/gallery`

**Description:** Retrieves all non-deleted images for a user.

**Query Parameters:**
- `user_id` (string, required) - User identifier

**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": [
    {
      "id": 1,
      "user_id": "user123",
      "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/13c09135.png",
      "prompt": "A breathtaking sunset over mountains",
      "intent": "image_generation",
      "metadata": {
        "feature": "image_generation",
        "version": "1.0",
        "timestamp": "2025-12-14T10:32:15Z",
        "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
        "aspect_ratio": "16:9",
        "style": "photorealistic",
        "processing_time": 3.5
      },
      "created_at": "2025-12-14T10:32:15Z",
      "deleted_at": null
    },
    {
      "id": 2,
      "user_id": "user123",
      "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765696480/file-service/51d7a4a8.png",
      "prompt": "Portrait photo with transparent background",
      "intent": "remove_background",
      "metadata": {
        "feature": "remove_background",
        "version": "1.0",
        "timestamp": "2025-12-14T10:35:20Z",
        "task_id": "51d7a4a8",
        "processing_time": 2.1
      },
      "created_at": "2025-12-14T10:35:20Z",
      "deleted_at": null
    }
  ]
}
```

**Example (cURL):**
```bash
curl "http://localhost:9999/v1/gallery/?user_id=user123"
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:9999/v1/gallery/?user_id=user123');
const { result: images } = await response.json();

// Display gallery
images.forEach(img => {
  console.log(`Image ${img.id}: ${img.image_url}`);
  console.log(`Created: ${img.created_at}`);
  console.log(`Intent: ${img.intent}`);
});
```

---

### 2. Create Gallery Entry

**Endpoint:** `POST /v1/gallery`

**Description:** Manually adds an image to user's gallery (usually done automatically after generation).

**Request Body:**
```json
{
  "user_id": "user123",
  "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/abc123.png",
  "prompt": "A beautiful landscape",
  "intent": "image_generation",
  "metadata": {
    "feature": "image_generation",
    "version": "1.0",
    "timestamp": "2025-12-14T11:00:00Z",
    "task_id": "abc123",
    "aspect_ratio": "16:9",
    "processing_time": 3.5
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | Yes | User identifier |
| `image_url` | string | Yes | Cloudinary URL of the image |
| `prompt` | string | No | Original or refined prompt used |
| `intent` | string | No | Feature used: "image_generation", "remove_background", etc. |
| `metadata` | object | No | Standardized metadata from MetadataBuilder (feature, version, timestamp, task_id, processing_time, feature-specific fields) |

**Response:**
```json
{
  "code": 1000,
  "message": "Image created successfully",
  "result": {
    "id": 3,
    "user_id": "user123",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/abc123.png",
    "prompt": "A beautiful landscape",
    "intent": "image_generation",
    "metadata": {
      "feature": "image_generation",
      "version": "1.0",
      "timestamp": "2025-12-14T11:00:00Z",
      "task_id": "abc123",
      "aspect_ratio": "16:9",
      "processing_time": 3.5
    },
    "created_at": "2025-12-14T11:00:00Z",
    "deleted_at": null
  }
}
```

---

### 3. Get Single Image

**Endpoint:** `GET /v1/gallery/{image_id}`

**Description:** Retrieves details of a specific image.

**URL Parameters:**
- `image_id` (UUID, required) - Image ID

**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "user_id": "user123",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/13c09135.png",
    "prompt": "A breathtaking sunset over mountains",
    "intent": "image_generation",
    "metadata": {
      "feature": "image_generation",
      "version": "1.0",
      "timestamp": "2025-12-14T10:32:15Z",
      "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
      "aspect_ratio": "16:9",
      "processing_time": 3.5
    },
    "created_at": "2025-12-14T10:32:15Z",
    "deleted_at": null
  }
}
```

**Example (cURL):**
```bash
curl "http://localhost:9999/v1/gallery/1"
```

---

### 4. Delete Image

**Endpoint:** `DELETE /v1/gallery/{image_id}`

**Description:** Soft deletes an image (marks as deleted, doesn't remove from Cloudinary). The image can be restored later.

**URL Parameters:**
- `image_id` (UUID, required) - Image ID

**Response:**
```json
{
  "code": 1000,
  "message": "Image deleted successfully",
  "result": {}
}
```

**Example (cURL):**
```bash
curl -X DELETE "http://localhost:9999/v1/gallery/cf5bdd40-c8b2-49a6-83e4-f2917919648c"
```

**Example (JavaScript):**
```javascript
const deleteImage = async (imageId) => {
  const response = await fetch(`http://localhost:9999/v1/gallery/${imageId}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    console.log('Image deleted successfully');
    // Remove from UI
    document.getElementById(`img-${imageId}`).remove();
  }
};

// Usage
await deleteImage('cf5bdd40-c8b2-49a6-83e4-f2917919648c');
```

---

### 5. List Deleted Images

**Endpoint:** `GET /v1/gallery/deleted`

**Description:** Retrieves all soft-deleted images for a user. Useful for implementing a "trash" or "recycle bin" feature.

**Query Parameters:**
- `user_id` (string, required) - User identifier

**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": [
    {
      "id": "cf5bdd40-c8b2-49a6-83e4-f2917919648c",
      "user_id": "user123",
      "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/abc123.png",
      "prompt": "A sunset over mountains",
      "intent": "image_generation",
      "metadata": {
        "feature": "image_generation",
        "task_id": "abc123",
        "aspect_ratio": "16:9"
      },
      "created_at": "2025-12-18T10:00:00Z",
      "deleted_at": "2025-12-18T15:30:00Z"
    }
  ]
}
```

**Example (cURL):**
```bash
curl "http://localhost:9999/v1/gallery/deleted?user_id=user123"
```

**Example (JavaScript):**
```javascript
const getDeletedImages = async (userId) => {
  const response = await fetch(`http://localhost:9999/v1/gallery/deleted?user_id=${userId}`);
  const { result: images } = await response.json();
  
  console.log(`Found ${images.length} deleted images`);
  images.forEach(img => {
    console.log(`Deleted: ${img.prompt} at ${img.deleted_at}`);
  });
  
  return images;
};

// Usage
const deletedImages = await getDeletedImages('user123');
```

---

### 6. Restore Deleted Image

**Endpoint:** `POST /v1/gallery/{image_id}/restore`

**Description:** Restores a soft-deleted image, making it visible in the main gallery again.

**URL Parameters:**
- `image_id` (UUID, required) - Image ID to restore

**Response:**
```json
{
  "code": 1000,
  "message": "Image restored successfully",
  "result": {
    "id": "cf5bdd40-c8b2-49a6-83e4-f2917919648c",
    "user_id": "user123",
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/v1765695826/file-service/abc123.png",
    "prompt": "A sunset over mountains",
    "intent": "image_generation",
    "metadata": {
      "feature": "image_generation",
      "task_id": "abc123"
    },
    "created_at": "2025-12-18T10:00:00Z",
    "deleted_at": null
  }
}
```

**Error Response (Image Not Deleted):**
```json
{
  "code": 9999,
  "message": "Image is not deleted",
  "errors": null
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:9999/v1/gallery/cf5bdd40-c8b2-49a6-83e4-f2917919648c/restore"
```

**Example (JavaScript):**
```javascript
const restoreImage = async (imageId) => {
  const response = await fetch(
    `http://localhost:9999/v1/gallery/${imageId}/restore`,
    { method: 'POST' }
  );
  
  const data = await response.json();
  
  if (data.code === 1000) {
    console.log('Image restored successfully');
    return data.result;
  } else {
    console.error('Restore failed:', data.message);
    throw new Error(data.message);
  }
};

// Usage
await restoreImage('cf5bdd40-c8b2-49a6-83e4-f2917919648c');
```

---

### 7. Permanent Delete

**Endpoint:** `DELETE /v1/gallery/{image_id}/permanent`

**Description:** Permanently deletes an image from the database. **This action cannot be undone.** The image will be removed from the database but NOT from Cloudinary.

**⚠️ Warning:** This is a destructive operation. Consider using soft delete (endpoint #4) instead.

**URL Parameters:**
- `image_id` (UUID, required) - Image ID

**Response:**
```json
{
  "code": 1000,
  "message": "Image permanently deleted",
  "result": {}
}
```

**Example (cURL):**
```bash
curl -X DELETE "http://localhost:9999/v1/gallery/cf5bdd40-c8b2-49a6-83e4-f2917919648c/permanent"
```

**Example (JavaScript):**
```javascript
const permanentlyDeleteImage = async (imageId) => {
  // Show confirmation dialog
  if (!confirm('Are you sure? This action cannot be undone!')) {
    return;
  }
  
  const response = await fetch(
    `http://localhost:9999/v1/gallery/${imageId}/permanent`,
    { method: 'DELETE' }
  );
  
  if (response.ok) {
    console.log('Image permanently deleted');
    // Remove from UI completely
    document.getElementById(`img-${imageId}`).remove();
  }
};

// Usage
await permanentlyDeleteImage('cf5bdd40-c8b2-49a6-83e4-f2917919648c');
```

---

## Image Gallery Complete Workflow

### Trash/Recycle Bin Implementation

Here's a complete example of implementing a trash bin feature:

```javascript
class GalleryWithTrash {
  constructor(baseUrl = 'http://localhost:9999/v1') {
    this.baseUrl = baseUrl;
  }
  
  // Get active images
  async getActiveImages(userId) {
    const response = await fetch(`${this.baseUrl}/gallery?user_id=${userId}`);
    const { result } = await response.json();
    return result;
  }
  
  // Get deleted images (trash)
  async getDeletedImages(userId) {
    const response = await fetch(`${this.baseUrl}/gallery/deleted?user_id=${userId}`);
    const { result } = await response.json();
    return result;
  }
  
  // Soft delete (move to trash)
  async moveToTrash(imageId) {
    const response = await fetch(`${this.baseUrl}/gallery/${imageId}`, {
      method: 'DELETE'
    });
    return response.ok;
  }
  
  // Restore from trash
  async restoreFromTrash(imageId) {
    const response = await fetch(`${this.baseUrl}/gallery/${imageId}/restore`, {
      method: 'POST'
    });
    const data = await response.json();
    return data.code === 1000;
  }
  
  // Empty trash (permanent delete all)
  async emptyTrash(userId) {
    const deletedImages = await this.getDeletedImages(userId);
    
    const deletePromises = deletedImages.map(img =>
      fetch(`${this.baseUrl}/gallery/${img.id}/permanent`, {
        method: 'DELETE'
      })
    );
    
    await Promise.all(deletePromises);
    console.log(`Permanently deleted ${deletedImages.length} images`);
  }
  
  // Render gallery with trash support
  renderGallery(containerId, images, isTrash = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    images.forEach(img => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.id = `img-${img.id}`;
      
      if (isTrash) {
        card.innerHTML = `
          <img src="${img.image_url}" alt="${img.prompt || 'Image'}">
          <div class="info">
            <p>${img.prompt || 'No prompt'}</p>
            <small>Deleted: ${new Date(img.deleted_at).toLocaleString()}</small>
          </div>
          <button onclick="gallery.restoreFromTrash('${img.id}')">Restore</button>
          <button onclick="gallery.permanentDelete('${img.id}')">Delete Forever</button>
        `;
      } else {
        card.innerHTML = `
          <img src="${img.image_url}" alt="${img.prompt || 'Image'}">
          <div class="info">
            <p>${img.prompt || 'No prompt'}</p>
            <small>${new Date(img.created_at).toLocaleString()}</small>
          </div>
          <button onclick="gallery.moveToTrash('${img.id}')">Delete</button>
        `;
      }
      
      container.appendChild(card);
    });
  }
}

// Usage
const gallery = new GalleryWithTrash();

// Load active gallery
const activeImages = await gallery.getActiveImages('user123');
gallery.renderGallery('gallery-container', activeImages, false);

// Load trash
const deletedImages = await gallery.getDeletedImages('user123');
gallery.renderGallery('trash-container', deletedImages, true);
```

---

## Gallery API Summary

| Endpoint | Method | Description | Soft Delete Safe? |
|----------|--------|-------------|-------------------|
| `/v1/gallery` | GET | List active images | ✅ Yes |
| `/v1/gallery` | POST | Create image entry | N/A |
| `/v1/gallery/{id}` | GET | Get single image | ✅ Yes (if not deleted) |
| `/v1/gallery/{id}` | DELETE | Soft delete image | ✅ Yes (reversible) |
| `/v1/gallery/deleted` | GET | List deleted images | ✅ Shows deleted only |
| `/v1/gallery/{id}/restore` | POST | Restore deleted image | ✅ Yes |
| `/v1/gallery/{id}/permanent` | DELETE | Permanent delete | ❌ No (irreversible) |

---

## Error Handling

---

## Standardized Metadata Structure

All AI feature responses include a standardized `metadata` object created by the `MetadataBuilder` class. This ensures consistency across all features.

### Base Metadata Fields

Every metadata object includes these core fields:

| Field | Type | Description |
|-------|------|-------------|
| `feature` | string | Feature name: "image_generation", "upscale", "remove_background", "relight", "style_transfer", "reimagine", "image_expand" |
| `version` | string | Feature version (default: "1.0") |
| `timestamp` | string | ISO 8601 timestamp when processing started |
| `task_id` | string | Unique identifier for the task |
| `processing_time` | float | Time taken in seconds (optional) |

### Feature-Specific Fields

Each feature adds its own specific fields to the base metadata:

#### Image Generation
```json
{
  "feature": "image_generation",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 3.5,
  "aspect_ratio": "16:9",
  "num_images": 1,
  "seed": 42,
  "style": "photorealistic"
}
```

#### Upscale
```json
{
  "feature": "upscale",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 2.1,
  "scale_factor": 2,
  "upscaling_type": "conservative"
}
```

#### Remove Background
```json
{
  "feature": "remove_background",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 1.8,
  "input_source": "url"
}
```

#### Relight
```json
{
  "feature": "relight",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 2.5,
  "light_direction": "top-right",
  "intensity": 0.8
}
```

#### Style Transfer
```json
{
  "feature": "style_transfer",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 3.2,
  "style_name": "van_gogh",
  "strength": 0.75
}
```

#### Reimagine
```json
{
  "feature": "reimagine",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 3.8,
  "creativity_level": "medium",
  "reference_image_url": "https://..."
}
```

#### Image Expand
```json
{
  "feature": "image_expand",
  "version": "1.0",
  "timestamp": "2025-12-18T10:00:00Z",
  "task_id": "abc123",
  "processing_time": 2.9,
  "expand_direction": "all",
  "expand_pixels": 100,
  "prompt": "seamless continuation of the scene"
}
```

### Using Metadata in Frontend

**TypeScript Interface Example:**
```typescript
interface BaseMetadata {
  feature: string;
  version: string;
  timestamp: string;
  task_id: string;
  processing_time?: number;
}

interface ImageGenerationMetadata extends BaseMetadata {
  feature: 'image_generation';
  aspect_ratio: string;
  num_images: number;
  seed?: number;
  style?: string;
}

interface RemoveBackgroundMetadata extends BaseMetadata {
  feature: 'remove_background';
  input_source: 'url' | 'base64' | 'file';
}

// Usage
const handleImageGeneration = (response: any) => {
  const metadata: ImageGenerationMetadata = response.result.metadata;
  
  console.log(`Feature: ${metadata.feature}`);
  console.log(`Took ${metadata.processing_time}s`);
  console.log(`Aspect ratio: ${metadata.aspect_ratio}`);
  
  // Display in UI
  displayProcessingInfo(metadata);
};
```

**JavaScript Example:**
```javascript
const displayMetadata = (metadata) => {
  const info = {
    'Feature': metadata.feature,
    'Processing Time': `${metadata.processing_time}s`,
    'Task ID': metadata.task_id,
    'Timestamp': new Date(metadata.timestamp).toLocaleString()
  };
  
  // Add feature-specific fields
  if (metadata.feature === 'image_generation') {
    info['Aspect Ratio'] = metadata.aspect_ratio;
    info['Style'] = metadata.style;
  } else if (metadata.feature === 'remove_background') {
    info['Input Source'] = metadata.input_source;
  }
  
  console.table(info);
};

// Usage
fetch('http://localhost:9999/v1/gallery/1/')
  .then(res => res.json())
  .then(({ result }) => {
    displayMetadata(result.metadata);
  });
```

---

### Common Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 1000 | Success | Request completed successfully |
| 4000 | Validation Error | Invalid input parameters |
| 4001 | Missing Required Field | Required field not provided |
| 4004 | Not Found | Resource does not exist |
| 5000 | Internal Server Error | Unexpected server error |
| 9999 | General Error | General error (check message) |

### Error Response Examples

**Validation Error:**
```json
{
  "code": 9999,
  "message": "Validation failed",
  "errors": {
    "prompt": ["This field is required."],
    "aspect_ratio": ["Invalid choice. Must be one of: 1:1, 16:9, 9:16"]
  }
}
```

**Insufficient Tokens:**
```json
{
  "code": 9999,
  "message": "Insufficient tokens",
  "errors": "Required: 10 tokens, Available: 5 tokens"
}
```

**Image Processing Failed:**
```json
{
  "code": 9999,
  "message": "Background removal failed",
  "errors": "Removal failed: 400 Client Error: Bad Request"
}
```

### Error Handling Best Practices

**JavaScript Example:**
```javascript
try {
  const response = await fetch('http://localhost:9999/v1/features/image-generate/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'A sunset',
      user_id: 'user123'
    })
  });
  
  const data = await response.json();
  
  if (data.code !== 1000) {
    // Handle error
    console.error('API Error:', data.message);
    if (data.errors) {
      console.error('Details:', data.errors);
    }
    return;
  }
  
  // Success
  console.log('Task created:', data.result.task_id);
  
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Testing

### Using the Test Script

The backend includes a comprehensive test script for all features:

```bash
cd /path/to/backendAI
./test_direct_ai_features.sh
```

This script tests:
- Image generation (with polling)
- Remove background (synchronous)
- Gallery operations

**Test Output Example:**
```
======================================
🧪 Testing All AI Features (Direct)
======================================
Session ID: direct_test_1765696107

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Image Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 Request: Generate a beautiful sunset over mountains
{
  "code": 1000,
  "message": "Image generation started.",
  "result": {
    "task_id": "0a83d2ae-472e-484b-9c2b-3ae774907280",
    "status": "CREATED"
  }
}

   📊 Polling task: 0a83d2ae-472e-484b-9c2b-3ae774907280
   Attempt 1/40: Status=IN_PROGRESS
   Attempt 2/40: Status=IN_PROGRESS
   Attempt 3/40: Status=COMPLETED
✓ Task completed!
{
  "result": {
    "image_url": "https://res.cloudinary.com/derwtva4p/image/upload/..."
  }
}
✓ TEST 1 PASSED
```

### Manual Testing with cURL

See individual endpoint sections for cURL examples.

### Frontend Integration Checklist

- [ ] Implement token check before requests
- [ ] Handle async tasks with polling (image generation)
- [ ] Support all three image input formats
- [ ] Display loading states during processing
- [ ] Handle error responses gracefully
- [ ] Implement gallery pagination (if needed)
- [ ] Add image preview before processing
- [ ] Store task_id for status tracking
- [ ] Implement automatic retry on network errors
- [ ] Add timeout handling for long-running tasks

---

## Appendix: Full Workflow Examples

### Example 1: Complete Image Generation Flow

```javascript
class ImageGenerator {
  constructor(baseUrl = 'http://localhost:9999/v1') {
    this.baseUrl = baseUrl;
  }
  
  async generate(prompt, userId, options = {}) {
    // 1. Create task
    const createRes = await fetch(`${this.baseUrl}/features/image-generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        user_id: userId,
        aspect_ratio: options.aspectRatio || '1:1',
        num_images: options.numImages || 1,
        styling: { style: options.style || 'photorealistic' }
      })
    });
    
    const { result: task } = await createRes.json();
    console.log('Task created:', task.task_id);
    console.log('Refined prompt:', task.refined_prompt);
    
    // 2. Poll until complete
    return this.pollTask(task.task_id, userId);
  }
  
  async pollTask(taskId, userId, maxAttempts = 40) {
    for (let i = 0; i < maxAttempts; i++) {
      const statusRes = await fetch(
        `${this.baseUrl}/features/image-generate/status/${taskId}/?user_id=${userId}`
      );
      const { result: status } = await statusRes.json();
      
      console.log(`Attempt ${i+1}/${maxAttempts}: ${status.status}`);
      
      if (status.status === 'COMPLETED') {
        return status.image_url;
      } else if (status.status === 'FAILED') {
        throw new Error('Generation failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    throw new Error('Timeout: Generation took too long');
  }
}

// Usage
const generator = new ImageGenerator();
const imageUrl = await generator.generate(
  'A beautiful sunset over mountains',
  'user123',
  { aspectRatio: '16:9', style: 'photorealistic' }
);
console.log('Generated image:', imageUrl);
```

### Example 2: Gallery Management UI

```javascript
class GalleryManager {
  constructor(baseUrl = 'http://localhost:9999/v1') {
    this.baseUrl = baseUrl;
  }
  
  async loadGallery(userId) {
    const response = await fetch(`${this.baseUrl}/gallery?user_id=${userId}`);
    const { result: images } = await response.json();
    return images;
  }
  
  async deleteImage(imageId) {
    const response = await fetch(`${this.baseUrl}/gallery/${imageId}`, {
      method: 'DELETE'
    });
    return response.ok;
  }
  
  renderGallery(containerId, images) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    images.forEach(img => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = `
        <img src="${img.image_url}" alt="${img.prompt || 'Image'}">
        <div class="info">
          <p>${img.prompt || 'No prompt'}</p>
          <small>${new Date(img.created_at).toLocaleString()}</small>
        </div>
        <button onclick="galleryManager.deleteImage(${img.id})">Delete</button>
      `;
      container.appendChild(card);
    });
  }
}

// Usage
const galleryManager = new GalleryManager();
const images = await galleryManager.loadGallery('user123');
galleryManager.renderGallery('gallery-container', images);
```

---

**For more information or support, contact the development team.**
