# API Testing Scripts

## Prerequisites

1. **Start Django Server**
   ```bash
   cd /home/imdeeslt/Study/HCMUS/3.1Term_25-26/Intro2SE/Projects/AI-photofun-Studio/src/backend/backendAI
   python manage.py runserver 0.0.0.0:9999
   ```

2. **Open new terminal** for running tests

## Test Scripts

### 1. Test Conversation Flow API
Tests conversation service with session creation and chat interactions.

**Run:**
```bash
cd /home/imdeeslt/Study/HCMUS/3.1Term_25-26/Intro2SE/Projects/AI-photofun-Studio/src/backend/backendAI
./test_conversation_api.sh
```

**What it tests:**
- ✅ Create conversation session
- ✅ Send chat message (image generation intent)
- ✅ Get session history
- ✅ Send another message (upscale intent)

**Output:**
- Prints each request and response in formatted JSON
- Pauses between steps for manual inspection
- Shows extracted key information (session_id, intent, task_id)

---

### 2. Test Image Generation API
Tests direct image generation feature without conversation.

**Run:**
```bash
cd /home/imdeeslt/Study/HCMUS/3.1Term_25-26/Intro2SE/Projects/AI-photofun-Studio/src/backend/backendAI
./test_image_generation_api.sh
```

**What it tests:**
- ✅ Generate image via Mystic API
- ✅ Poll task status (if async)
- ✅ Check image saved in gallery
- ✅ Verify image URL

**Output:**
- Shows generation request and response
- Polls for completion with status updates
- Displays uploaded image URLs
- Verifies gallery database entry

---

## Manual Testing with curl

### Create Session
```bash
curl -X POST http://localhost:9999/api/v1/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test_user_123"}' | jq '.'
```

### Send Chat Message
```bash
# Replace SESSION_ID with actual session ID
curl -X POST http://localhost:9999/api/v1/chat/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"test_user_123",
    "message":"tạo ảnh sunset over mountains"
  }' | jq '.'
```

### Generate Image Directly
```bash
curl -X POST http://localhost:9999/v1/features/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"a beautiful cat sitting on a couch",
    "user_id":"test_user_123",
    "aspect_ratio":"square_1_1",
    "model":"realism",
    "resolution":"2k"
  }' | jq '.'
```

### Check Gallery
```bash
curl -X GET "http://localhost:9999/v1/gallery/?user_id=test_user_123&intent=image_generate" | jq '.'
```

### Poll Task Status
```bash
# Replace TASK_ID with actual task ID
curl -X GET http://localhost:9999/v1/features/image-generation/status/TASK_ID/ | jq '.'
```

---

## Expected Response Formats

### Session Creation Response
```json
{
  "session_id": "uuid",
  "user_id": "test_user_123",
  "created_at": "timestamp"
}
```

### Chat Response
```json
{
  "message_id": "uuid",
  "intent": "image_generate",
  "refined_prompt": "Detailed refined prompt...",
  "task_id": "uuid",
  "status": "CREATED",
  "uploaded_urls": []
}
```

### Image Generation Response
```json
{
  "task_id": "uuid",
  "status": "COMPLETED",
  "uploaded_urls": [
    "https://file-service-cdal.onrender.com/images/uuid.jpg"
  ],
  "original_prompt": "...",
  "refined_prompt": "...",
  "model": "realism",
  "aspect_ratio": "square_1_1"
}
```

### Gallery Response
```json
{
  "results": [
    {
      "image_id": "uuid",
      "user_id": "test_user_123",
      "image_url": "https://...",
      "refined_prompt": "...",
      "intent": "image_generate",
      "metadata": {...},
      "created_at": "timestamp"
    }
  ],
  "count": 1
}
```

---

## Troubleshooting

### Server not responding
```bash
# Check if server is running
curl http://localhost:9999/

# Check server logs
```

### jq command not found
```bash
# Install jq for JSON formatting
sudo apt install jq  # Ubuntu/Debian
brew install jq      # macOS
```

### Database connection errors
Check `.env` file has correct Supabase credentials:
```
DB_NAME=postgres
DB_USER=postgres.rbwqlqiedfqnqxnfzkcr
DB_PASSWORD=aiphotofunstudio
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
```

### API returns 404
Verify Django server is running on port 9999 and URLs are correct.

---

## Notes

- Scripts pause between steps - press Enter to continue
- All responses are formatted with `jq` for readability
- Session IDs and Task IDs are auto-extracted for next steps
- User IDs are generated with timestamp to avoid conflicts
- Image generation may take 30-60 seconds (async processing)

---

## Quick Test Commands

**Test everything quickly:**
```bash
# Terminal 1: Start server
python manage.py runserver 0.0.0.0:9999

# Terminal 2: Run tests
./test_conversation_api.sh
./test_image_generation_api.sh
```

**Single request test:**
```bash
# Quick health check
curl http://localhost:9999/ | jq '.'

# Quick generation test
curl -X POST http://localhost:9999/api/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","user_id":"test"}' | jq '.'
```
