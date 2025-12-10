# Image Gallery App - PostgreSQL Setup Guide

## Overview
This app manages user-generated images stored on Cloudinary, persisting metadata in PostgreSQL (Supabase). Images use UUIDs extracted from Cloudinary URLs as primary keys.

## Features
- ✅ CRUD operations for image metadata
- ✅ Soft delete with restore capability
- ✅ Permanent delete option
- ✅ User-based filtering
- ✅ Cloudinary UUID extraction from URLs
- ✅ Metadata storage (JSON field for flexible attributes)

## Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to https://app.supabase.com
2. Create a new project
3. Wait for database provisioning (2-3 minutes)

### 2. Get Connection Details
1. Navigate to: `Settings` → `Database`
2. Find "Connection string" section
3. Copy the connection parameters:
   - **Host**: `db.xxxxxxxxxxxxx.supabase.co`
   - **Database**: `postgres` (default)
   - **Port**: `5432` (default)
   - **User**: `postgres` (default)
   - **Password**: Your project password

### 3. Configure Environment Variables
Update your `.env` file with Supabase credentials:

```bash
# PostgreSQL (Supabase) Configuration
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-actual-password-here
SUPABASE_DB_HOST=db.xxxxxxxxxxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_SSLMODE=require
```

### 4. Install PostgreSQL Driver
```bash
pip install psycopg2-binary==2.9.10
```

### 5. Run Migrations
```bash
# Create migration files
python manage.py makemigrations image_gallery

# Apply migrations to PostgreSQL
python manage.py migrate
```

## API Endpoints

Base URL: `http://localhost:9999/v1/gallery/`

### 1. List Images (GET)
**Endpoint**: `GET /v1/gallery/`

**Query Parameters**:
- `user_id` (optional): Filter by user ID

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "image_id": "8d76bd3a-053e-4bb5-a2ab-ce147e53f40c",
      "user_id": "user123",
      "image_url": "https://res.cloudinary.com/.../8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg",
      "refined_prompt": "Refined prompt by Gemini",
      "intent": "generate",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Images retrieved successfully"
}
```

### 2. Create Image (POST)
**Endpoint**: `POST /v1/gallery/`

**Request Body**:
```json
{
  "user_id": "user123",
  "image_url": "https://res.cloudinary.com/.../8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg",
  "refined_prompt": "Create a vibrant sunset landscape with mountains",
  "intent": "generate",
  "metadata": {
    "model": "gemini-pro",
    "generation_time": 3.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "image_id": "8d76bd3a-053e-4bb5-a2ab-ce147e53f40c",
    "user_id": "user123",
    "image_url": "https://res.cloudinary.com/.../8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Image created successfully"
}
```

### 3. Get Image Detail (GET)
**Endpoint**: `GET /v1/gallery/{image_id}/`

**Response**: Same format as create response

### 4. Soft Delete (DELETE)
**Endpoint**: `DELETE /v1/gallery/{image_id}/`

Marks image as deleted (sets `deleted_at` timestamp). Image can be restored later.

### 5. List Deleted Images (GET)
**Endpoint**: `GET /v1/gallery/deleted/`

**Query Parameters**:
- `user_id` (optional): Filter by user ID

Returns images where `deleted_at` is not null.

### 6. Restore Image (POST)
**Endpoint**: `POST /v1/gallery/{image_id}/restore/`

Restores a soft-deleted image (sets `deleted_at` to null).

### 7. Permanent Delete (DELETE)
**Endpoint**: `DELETE /v1/gallery/{image_id}/permanent/`

**⚠️ Warning**: This permanently removes the record from the database. Cannot be undone.

## Model Schema

### ImageGallery
| Field | Type | Description |
|-------|------|-------------|
| `image_id` | UUID (PK) | Extracted from Cloudinary URL |
| `user_id` | CharField | User identifier (indexed) |
| `image_url` | URLField | Full Cloudinary image URL |
| `refined_prompt` | TextField | AI-refined prompt used for generation (nullable) |
| `intent` | CharField | Intent classification (nullable) |
| `metadata` | JSONField | Flexible metadata storage |
| `created_at` | DateTimeField | Auto-generated creation timestamp |
| `updated_at` | DateTimeField | Auto-updated modification timestamp |
| `deleted_at` | DateTimeField | Soft delete timestamp (nullable) |

**Indexes**:
- `(user_id, -created_at)`: Fast user image listing
- `(user_id, deleted_at)`: Fast deleted image queries

## UUID Extraction

The app automatically extracts UUIDs from Cloudinary URLs using regex:

```python
# Example Cloudinary URL:
# https://res.cloudinary.com/demo/image/upload/8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg

# Extracted UUID:
# 8d76bd3a-053e-4bb5-a2ab-ce147e53f40c
```

This ensures idempotent image creation - posting the same image URL multiple times won't create duplicates.

## Integration with Conversation Pipeline

To automatically save images generated from conversations:

```python
# In finalize_conversation_task (apps/conversation/celery_tasks.py)
from apps.image_gallery.models import ImageGallery

def finalize_conversation_task(session_id, message_id, refined_prompt, image_url, intent):
    # ... existing code ...
    
    # Save to image gallery
    if image_url:
        ImageGallery.objects.create(
            user_id=session.user_id,  # Add user_id to session model
            image_url=image_url,
            refined_prompt=refined_prompt,
            intent=intent,
            metadata={
                'session_id': str(session_id),
                'message_id': str(message_id),
            }
        )
```

## Testing

### Example cURL Commands

**Create Image**:
```bash
curl -X POST http://localhost:9999/v1/gallery/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "image_url": "https://res.cloudinary.com/demo/image/upload/8d76bd3a-053e-4bb5-a2ab-ce147e53f40c.jpg",
    "refined_prompt": "Test image with vibrant colors",
    "intent": "generate"
  }'
```

**List Images**:
```bash
curl http://localhost:9999/v1/gallery/?user_id=test_user
```

**Soft Delete**:
```bash
curl -X DELETE http://localhost:9999/v1/gallery/8d76bd3a-053e-4bb5-a2ab-ce147e53f40c/
```

**Restore**:
```bash
curl -X POST http://localhost:9999/v1/gallery/8d76bd3a-053e-4bb5-a2ab-ce147e53f40c/restore/
```

## Troubleshooting

### Connection Refused
- Verify Supabase credentials in `.env`
- Check Supabase project is running (not paused)
- Ensure SSL mode is set to `require`

### UUID Not Found
- Verify Cloudinary URL format matches expected pattern
- Check `extract_uuid_from_cloudinary_url()` regex in `models.py`

### Permission Denied
- Verify Supabase user has table creation permissions
- Check RLS (Row Level Security) policies if enabled

## Architecture Notes

### Hybrid Database Approach
This app uses **PostgreSQL** while other apps use **MongoDB**:
- **MongoDB**: Conversation sessions, messages (flexible schema, fast writes)
- **PostgreSQL**: Image gallery (relational queries, transactions, UUID primary keys)

### Why PostgreSQL for Images?
1. **Relational integrity**: User relationships, foreign keys
2. **Advanced queries**: Complex filtering, aggregations, joins
3. **ACID transactions**: Data consistency for billing/analytics
4. **UUID primary keys**: Idempotent operations, distributed-friendly
5. **Soft deletes**: Audit trail, data recovery

## Future Enhancements
- [ ] Add image tags/categories
- [ ] Implement image sharing/permissions
- [ ] Add image statistics (views, downloads)
- [ ] Integrate with payment system (image usage tracking)
- [ ] Add batch operations (delete multiple, restore multiple)
