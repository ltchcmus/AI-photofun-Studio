# AI Gateway API Documentation

## Overview

The AI Gateway is the unified interface for all AI-powered features in the AI Photo Studio. It provides a chat-based interface where users can interact naturally with the AI system.

## Architecture

```
Frontend Chat → AI Gateway → Pipeline Controller
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓              ↓               ↓
            Intent Classifier  Prompt Refiner  Response Handler
                    ↓
            ┌───────┴────────┐
            ↓                ↓
    Image Generation   Face Swap   Background Removal   ...
```

## API Endpoints

### Base URL
```
/api/v1/ai-gateway/
```

### 1. Process Chat Message

**Endpoint:** `POST /api/v1/ai-gateway/chat/`

**Description:** Process a chat message through the AI pipeline

**Request:**

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `message` (string, required): User's message/prompt
- `session_id` (string, optional): Chat session ID for continuing conversation
- `image` (file, optional): Image file for processing (required for face swap, background removal, etc.)
- `context` (object, optional): Additional context data

**Example Request (JSON):**
```json
{
  "message": "Create a fantasy landscape with mountains and a castle",
  "session_id": "abc123",
  "context": {
    "style": "fantasy",
    "quality": "high"
  }
}
```

**Example Request (FormData with Image):**
```javascript
const formData = new FormData();
formData.append('message', 'Remove background from this image');
formData.append('image', imageFile);
formData.append('session_id', 'abc123');
```

**Response:**
```json
{
  "session_id": "abc123-def456",
  "message_id": "msg-789",
  "message": "I've generated your fantasy landscape! Here's the result:",
  "type": "image",
  "data": {
    "image_url": "/media/generated/image_123.png",
    "prompt": "fantasy landscape with majestic mountains and medieval castle, dramatic lighting, detailed, high quality",
    "metadata": {
      "width": 1024,
      "height": 768,
      "steps": 50,
      "guidance_scale": 7.5,
      "generation_time": 8.5
    }
  },
  "actions": [
    {
      "id": "download",
      "label": "Download Image",
      "type": "download",
      "data": {
        "url": "/media/generated/image_123.png"
      }
    },
    {
      "id": "regenerate",
      "label": "Generate Again",
      "type": "regenerate"
    }
  ],
  "suggestions": [
    "Generate variations of this image",
    "Change the time of day to sunset",
    "Add more details to the castle"
  ],
  "metadata": {
    "intent": "image_generation",
    "confidence": 0.95
  },
  "pipeline_metadata": {
    "pipeline_id": "pip-xyz",
    "total_processing_time": 10.2,
    "intent": "image_generation",
    "intent_confidence": 0.95,
    "refine_confidence": 0.88
  }
}
```

---

### 2. List Sessions

**Endpoint:** `GET /api/v1/ai-gateway/sessions/`

**Description:** Get list of all chat sessions

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "session-123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:45:00Z",
      "message_count": 12,
      "last_message": "That looks great! Can you make the colors more vibrant?",
      "metadata": {}
    }
  ],
  "total": 1
}
```

---

### 3. Get Session Details

**Endpoint:** `GET /api/v1/ai-gateway/sessions/{session_id}/`

**Description:** Get session details with all messages

**Response:**
```json
{
  "session_id": "session-123",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z",
  "metadata": {},
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Create a portrait of a cat",
      "created_at": "2024-01-15T10:30:00Z",
      "metadata": {}
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "I've generated your cat portrait!",
      "created_at": "2024-01-15T10:30:15Z",
      "image_url": "/media/generated/cat_123.png",
      "metadata": {
        "intent": "image_generation"
      }
    }
  ]
}
```

---

### 4. Delete Session

**Endpoint:** `DELETE /api/v1/ai-gateway/sessions/{session_id}/`

**Description:** Delete a chat session and all its messages

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

---

### 5. Get Capabilities

**Endpoint:** `GET /api/v1/ai-gateway/capabilities/`

**Description:** Get list of available AI capabilities

**Response:**
```json
{
  "capabilities": [
    {
      "id": "image_generation",
      "name": "Image Generation",
      "description": "Generate images from text descriptions",
      "requires_image": false,
      "example": "Create a portrait of a cat wearing a crown"
    },
    {
      "id": "face_swap",
      "name": "Face Swap",
      "description": "Swap faces between two images",
      "requires_image": true,
      "example": "Swap my face with this photo"
    }
  ]
}
```

---

## Intent Classification

The AI Gateway automatically classifies user intent into the following categories:

### 1. Image Generation
**Keywords:** create, generate, make, draw, paint, imagine
**Example:** "Create a sunset over the ocean"
**Requires Image:** No

### 2. Face Swap
**Keywords:** swap face, change face, replace face
**Example:** "Swap my face with this celebrity photo"
**Requires Image:** Yes

### 3. Background Removal
**Keywords:** remove background, cut out, transparent background
**Example:** "Remove the background from this photo"
**Requires Image:** Yes

### 4. Image Edit
**Keywords:** edit, modify, adjust, change, fix, enhance
**Example:** "Make this image brighter and more colorful"
**Requires Image:** Yes

### 5. Style Transfer
**Keywords:** style, artistic, painting style, van gogh, picasso
**Example:** "Apply impressionist style to this photo"
**Requires Image:** Yes

### 6. General
**Keywords:** help, what can you do, capabilities
**Example:** "What can you help me with?"
**Requires Image:** No

---

## Prompt Refinement

The AI Gateway automatically enhances user prompts for better results:

### Rule-Based Enhancement

**Original:** "a cat"
**Refined:** "a cat, detailed, high quality"

**Original:** "portrait"
**Refined:** "portrait, professional lighting, sharp focus, high resolution"

### Quality Parameters Injection

- Adds quality terms: `detailed`, `high quality`, `sharp focus`
- Adds technical terms: `8k`, `4k resolution`, `professional`
- Adds style descriptors: `photorealistic`, `artistic`, `cinematic`

### Negative Prompt Extraction

**Input:** "a beautiful landscape, no people, no buildings"
**Positive Prompt:** "a beautiful landscape"
**Negative Prompt:** "people, buildings"

---

## Response Types

### 1. Image Response
```json
{
  "type": "image",
  "data": {
    "image_url": "/media/generated/image.png",
    "prompt": "...",
    "metadata": {...}
  },
  "actions": [...],
  "suggestions": [...]
}
```

### 2. Text Response
```json
{
  "type": "text",
  "message": "I can help you with...",
  "metadata": {}
}
```

### 3. Error Response
```json
{
  "type": "error",
  "message": "An error occurred",
  "error_code": "SERVICE_ERROR",
  "suggestions": [
    "Try rephrasing your message",
    "Check if you need to upload an image"
  ]
}
```

### 4. Processing Response
```json
{
  "type": "processing",
  "message": "Processing your image...",
  "progress": 45,
  "estimated_time": 15
}
```

---

## Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `SERVICE_ERROR` - Service processing error
- `PIPELINE_ERROR` - Pipeline execution error
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required

---

## Usage Examples

### Example 1: Generate Image

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a futuristic city at night with neon lights"
  }'
```

**Response:**
```json
{
  "session_id": "new-session-123",
  "type": "image",
  "message": "I've generated your futuristic city!",
  "data": {
    "image_url": "/media/generated/city_456.png"
  }
}
```

---

### Example 2: Remove Background

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -F "message=Remove background from this image" \
  -F "image=@photo.jpg"
```

**Response:**
```json
{
  "session_id": "session-789",
  "type": "image",
  "message": "Background removed successfully!",
  "data": {
    "image_url": "/media/processed/nobg_789.png"
  }
}
```

---

### Example 3: Continue Conversation

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Make it more colorful",
    "session_id": "session-789"
  }'
```

---

## Frontend Integration

### React Example

```javascript
import { useState } from 'react';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  
  const sendMessage = async (message, imageFile = null) => {
    const formData = new FormData();
    formData.append('message', message);
    if (sessionId) formData.append('session_id', sessionId);
    if (imageFile) formData.append('image', imageFile);
    
    const response = await fetch('/api/v1/ai-gateway/chat/', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!sessionId) {
      setSessionId(data.session_id);
    }
    
    setMessages([...messages, {
      role: 'user',
      content: message,
    }, {
      role: 'assistant',
      content: data.message,
      data: data.data,
      type: data.type,
    }]);
  };
  
  return (
    <div className="chat-interface">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <p>{msg.content}</p>
          {msg.type === 'image' && (
            <img src={msg.data.image_url} alt="Generated" />
          )}
        </div>
      ))}
      <input 
        type="text" 
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
```

---

## Pipeline Flow

```
1. User Message
   └─> Intent Classification
       ├─> image_generation → Prompt Refinement → Image Generator
       ├─> face_swap → Validate Image → Face Swap Service
       ├─> background_removal → Validate Image → Background Removal
       └─> general → Generate Helpful Response

2. Service Processing
   └─> Execute AI Model
       └─> Generate Result

3. Response Formatting
   └─> Format based on type (image/text/error)
       └─> Add suggestions and actions
           └─> Return to frontend
```

---

## Performance

- **Image Generation:** ~10-15 seconds (GPU) / ~30-60 seconds (CPU)
- **Face Swap:** ~3-5 seconds
- **Background Removal:** ~2-3 seconds
- **Intent Classification:** <100ms
- **Prompt Refinement:** <200ms

---

## Rate Limiting

- Max 10 requests per minute per session
- Max 100 requests per hour per user
- Max file size: 10MB

---

## Best Practices

1. **Always provide session_id** for continuing conversations
2. **Be specific** in prompts for better results
3. **Include context** when modifying previous results
4. **Use negative prompts** to exclude unwanted elements
5. **Check capabilities** endpoint for supported features

---

## Troubleshooting

### Issue: "Service error occurred"
**Solution:** Check if the required service is running and models are loaded

### Issue: "Invalid request"
**Solution:** Ensure required fields are provided (message, image when needed)

### Issue: "Session not found"
**Solution:** Session may have expired, start a new session

---

## Model Integration Status

- ✅ Intent Classification: Rule-based (ready for NLP model)
- ✅ Prompt Refinement: Rule-based (ready for LLM)
- ⏳ Image Generation: Placeholder (integrate Stable Diffusion)
- ⏳ Face Swap: Placeholder (integrate InsightFace)
- ⏳ Background Removal: Placeholder (integrate U2-Net)

---

## Future Enhancements

- [ ] Multi-image generation
- [ ] Image variations
- [ ] Image upscaling
- [ ] Video processing
- [ ] Voice input support
- [ ] Real-time processing status
- [ ] Batch processing
- [ ] Template library
