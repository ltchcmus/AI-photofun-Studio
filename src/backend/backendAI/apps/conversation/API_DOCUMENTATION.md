# Conversation API Documentation

API cho quản lý conversations (chat sessions) giữa user và chatbot.

## Base URL
```
/api/v1/conversation/
```

## Endpoints

### 1. List & Create Sessions

#### GET `/api/v1/conversation/`
Lấy danh sách tất cả conversation sessions (không bao gồm messages).

**Query Parameters:**
- `limit` (optional, default=50, max=100): Số lượng sessions trả về
- `skip` (optional, default=0): Số lượng sessions bỏ qua (cho pagination)

**Response 200:**
```json
{
  "count": 10,
  "limit": 50,
  "skip": 0,
  "results": [
    {
      "session_id": "user-123-session-1",
      "created_at": "2025-11-05T10:30:00Z"
    }
  ]
}
```

#### POST `/api/v1/conversation/`
Tạo một conversation session mới.

**Request Body:**
```json
{
  "session_id": "unique-session-id"
}
```

**Response 201:**
```json
{
  "session_id": "unique-session-id",
  "messages": [],
  "created_at": "2025-11-05T10:30:00Z"
}
```

---

### 2. Get Conversation Details

#### GET `/api/v1/conversation/{session_id}/`
Lấy toàn bộ conversation bao gồm tất cả messages.

**Response 200:**
```json
{
  "session_id": "user-123-session-1",
  "messages": [
    {
      "message_id": "uuid-123",
      "role": "user",
      "content": "Hello chatbot",
      "created_at": "2025-11-05T10:31:00Z"
    },
    {
      "message_id": "uuid-456",
      "role": "assistant",
      "content": "Hi! How can I help you?",
      "created_at": "2025-11-05T10:31:02Z"
    }
  ],
  "created_at": "2025-11-05T10:30:00Z"
}
```

**Response 404:**
```json
{
  "error": "Conversation not found"
}
```

---

### 3. Add Message to Conversation

#### POST `/api/v1/conversation/{session_id}/message/`
Thêm một message mới vào conversation.

**Request Body:**
```json
{
  "role": "user",
  "content": "Generate a futuristic cat image",
  "image_url": "https://example.com/image.jpg",  // optional
  "selected_prompts": ["prompt1", "prompt2"],    // optional
  "metadata": {"key": "value"}                   // optional
}
```

**Field Descriptions:**
- `role` (required): `"user"` hoặc `"assistant"`
- `content` (optional): Nội dung text của message
- `image_url` (optional): URL của hình ảnh đính kèm
- `selected_prompts` (optional): Danh sách prompt IDs đã chọn
- `metadata` (optional): Thông tin bổ sung (dict/object)
- `message_id` (auto-generated): UUID được tạo tự động nếu không cung cấp

**Note:** User messages phải có `content` HOẶC `image_url` (ít nhất một trong hai).

**Response 201:**
```json
{
  "message_id": "auto-generated-uuid",
  "role": "user",
  "content": "Generate a futuristic cat image",
  "created_at": "2025-11-05T10:35:00Z"
}
```

**Response 400 (Validation Error):**
```json
{
  "role": ["This field is required."],
  "content": ["user messages require content or image_url"]
}
```

---

### 4. Edit Message

#### PATCH `/api/v1/conversation/{session_id}/messages/{message_id}/`
Chỉnh sửa một message cụ thể.

**Request Body:**
```json
{
  "content": "Updated message text",
  "metadata": {"edited": true}
}
```

**Response 200:**
```json
{
  "session_id": "user-123-session-1",
  "messages": [...],  // toàn bộ conversation sau khi edit
  "created_at": "2025-11-05T10:30:00Z"
}
```

**Response 404:**
```json
{
  "error": "Message or conversation not found"
}
```

---

### 5. Delete Message

#### DELETE `/api/v1/conversation/{session_id}/messages/{message_id}/`
Xóa một message khỏi conversation.

**Response 200:**
```json
{
  "session_id": "user-123-session-1",
  "messages": [...],  // toàn bộ conversation sau khi xóa
  "created_at": "2025-11-05T10:30:00Z"
}
```

**Response 404:**
```json
{
  "error": "Message or conversation not found"
}
```

---

## Error Responses

Tất cả endpoints có thể trả về các lỗi sau:

**400 Bad Request:**
```json
{
  "error": "Invalid JSON"
}
```

**404 Not Found:**
```json
{
  "error": "Conversation not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Data Models

### Message
```json
{
  "message_id": "uuid",
  "role": "user | assistant",
  "content": "string (optional)",
  "image_url": "url (optional)",
  "selected_prompts": ["string"] (optional),
  "metadata": {} (optional),
  "created_at": "ISO datetime (auto-generated)"
}
```

### Conversation
```json
{
  "session_id": "string",
  "messages": [Message],
  "created_at": "ISO datetime"
}
```

---

## Usage Examples

### Curl Examples

**Tạo session mới:**
```bash
curl -X POST http://localhost:8000/api/v1/conversation/ \
  -H "Content-Type: application/json" \
  -d '{"session_id": "user-123-chat-1"}'
```

**Thêm message:**
```bash
curl -X POST http://localhost:8000/api/v1/conversation/user-123-chat-1/message/ \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello!"}'
```

**Lấy conversation:**
```bash
curl http://localhost:8000/api/v1/conversation/user-123-chat-1/
```

**List sessions với pagination:**
```bash
curl "http://localhost:8000/api/v1/conversation/?limit=20&skip=0"
```

**Edit message:**
```bash
curl -X PATCH http://localhost:8000/api/v1/conversation/user-123-chat-1/messages/msg-uuid/ \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated text"}'
```

**Delete message:**
```bash
curl -X DELETE http://localhost:8000/api/v1/conversation/user-123-chat-1/messages/msg-uuid/
```

---

## Notes

- Tất cả datetime fields sử dụng UTC timezone và format ISO 8601
- `message_id` được auto-generate (UUID) nếu không cung cấp
- `created_at` được tự động thêm server-side
- MongoDB `_id` fields được tự động loại bỏ trong responses
- Session creation sử dụng atomic upsert (không duplicate nếu session đã tồn tại)
