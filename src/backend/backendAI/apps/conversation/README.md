# 💬 Conversation Service

User-chatbot conversation management service sử dụng MongoDB.

## Features

- ✅ Create/Get conversation sessions
- ✅ Add messages (user & assistant)
- ✅ Edit & delete messages
- ✅ List all sessions with pagination
- ✅ MongoDB storage (no SQL database required)
- ✅ Server-side message ID & timestamp generation
- ✅ Atomic operations (upsert, concurrent-safe)
- ✅ Clean JSON API responses

## Quick Start

### 1. Install Dependencies

```bash
pip install pymongo
```

### 2. Configure MongoDB

Add to `.env`:
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ai_photofun_studio
```

### 3. Register App

Already configured in:
- ✅ `backendAI/settings.py` → `INSTALLED_APPS`
- ✅ `backendAI/urls.py` → `path('api/v1/conversation/', ...)`

### 4. Start Server

```bash
cd src/backend/backendAI
python manage.py runserver
```

### 5. Test with Chat Interface

Open `apps/conversation/chat_test.html` in your browser or:

```bash
cd apps/conversation
python -m http.server 8080
# Open http://localhost:8080/chat_test.html
```

## API Endpoints

```
GET    /api/v1/conversation/                           # List sessions
POST   /api/v1/conversation/                           # Create session
GET    /api/v1/conversation/{session_id}/              # Get conversation
POST   /api/v1/conversation/{session_id}/message/      # Add message
PATCH  /api/v1/conversation/{session_id}/messages/{id}/ # Edit message
DELETE /api/v1/conversation/{session_id}/messages/{id}/ # Delete message
```

## Files

- `models.py` - MongoDB collection helper
- `mongo_client.py` - Lazy MongoDB client
- `serializers.py` - DRF serializers for validation
- `service.py` - Business logic (CRUD operations)
- `views.py` - Django class-based views
- `urls.py` - URL routing
- `chat_test.html` - Test UI interface
- `API_DOCUMENTATION.md` - Full API docs
- `TESTING.md` - Testing guide

## Example Usage

```bash
# Create session
curl -X POST http://localhost:8000/api/v1/conversation/ \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123"}'

# Send message
curl -X POST http://localhost:8000/api/v1/conversation/test-123/message/ \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello!"}'

# Get conversation
curl http://localhost:8000/api/v1/conversation/test-123/
```

## Architecture

```
Frontend (chat_test.html)
    ↓
Django Views (views.py)
    ↓
Service Layer (service.py)
    ↓
MongoDB Client (mongo_client.py)
    ↓
MongoDB Database
```

## Tech Stack

- **Framework**: Django 5.x
- **Validation**: Django REST Framework serializers
- **Database**: MongoDB (via pymongo)
- **Storage Pattern**: Document-based (no SQL migrations)
- **API Style**: RESTful JSON

## Notes

- No Django ORM/migrations required (MongoDB)
- Lazy MongoDB connection (no settings on import)
- Atomic upsert operations for thread-safety
- Auto-generated UUIDs for message IDs
- Server-side timestamps (UTC)

## Next Steps

- [ ] Add authentication/authorization
- [ ] Integrate with AI services for bot responses
- [ ] Add WebSocket support for real-time chat
- [ ] Add rate limiting
- [ ] Write unit tests
