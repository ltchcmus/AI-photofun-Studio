# ============================================================================
# API TESTING COMMANDS - COPY & PASTE
# Base URL: http://localhost:9999
# ============================================================================

# ============================================================================
# 1. CONVERSATION FLOW (Chat to Generate Image)
# ============================================================================

# Step 1: Create conversation session
curl -X POST http://localhost:9999/api/conversation/sessions/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}' | python3 -m json.tool

# Save session_id from response above, then use it below:
# Example: SESSION_ID="67ac123e-1234-5678-90ab-cdef12345678"

# Step 2: Send chat message (replace SESSION_ID)
curl -X POST http://localhost:9999/api/conversation/sessions/SESSION_ID/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "tạo cho tôi một bức ảnh về hoàng hôn trên núi"}' | python3 -m json.tool

# Save task_id from response, then poll status:

# Step 3: Check task status (replace TASK_ID)
curl -X GET http://localhost:9999/api/image-generation/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 2. DIRECT IMAGE GENERATION (No Conversation)
# ============================================================================

# Generate image directly
curl -X POST http://localhost:9999/api/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains with vibrant colors",
    "user_id": "test_user_direct",
    "model": "realism",
    "aspect_ratio": "square_1_1",
    "resolution": "2k"
}' | python3 -m json.tool

# Save task_id, then check status:
curl -X GET http://localhost:9999/api/image-generation/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 3. UPSCALE
# ============================================================================

curl -X POST http://localhost:9999/api/upscale/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "user_id": "test_upscale_user",
    "sharpen": 0.5,
    "smart_grain": 0.0,
    "ultra_detail": 0.0
}' | python3 -m json.tool

# Check status:
curl -X GET http://localhost:9999/api/upscale/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 4. REMOVE BACKGROUND (Synchronous - Returns Immediately)
# ============================================================================

curl -X POST http://localhost:9999/api/remove-background/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "user_id": "test_rmbg_user"
}' | python3 -m json.tool

# ============================================================================
# 5. RELIGHT
# ============================================================================

curl -X POST http://localhost:9999/api/relight/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "prompt": "add warm sunset lighting",
    "user_id": "test_relight_user",
    "style": "standard",
    "light_transfer_strength": 0.8
}' | python3 -m json.tool

# Check status:
curl -X GET http://localhost:9999/api/relight/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 6. REIMAGINE
# ============================================================================

curl -X POST http://localhost:9999/api/reimagine/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "prompt": "make it more vibrant and colorful",
    "user_id": "test_reimagine_user",
    "imagination": "subtle",
    "aspect_ratio": "square_1_1"
}' | python3 -m json.tool

# Check status:
curl -X GET http://localhost:9999/api/reimagine/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 7. IMAGE EXPAND
# ============================================================================

curl -X POST http://localhost:9999/api/image-expand/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "prompt": "extend with more mountains and sky",
    "user_id": "test_expand_user",
    "left": 100,
    "right": 100,
    "top": 50,
    "bottom": 50
}' | python3 -m json.tool

# Check status:
curl -X GET http://localhost:9999/api/image-expand/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 8. STYLE TRANSFER
# ============================================================================

curl -X POST http://localhost:9999/api/style-transfer/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "reference_image": "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400",
    "user_id": "test_style_user",
    "style_strength": 0.75,
    "structure_strength": 0.75
}' | python3 -m json.tool

# Check status:
curl -X GET http://localhost:9999/api/style-transfer/tasks/TASK_ID/ | python3 -m json.tool

# ============================================================================
# 9. CHECK IMAGE GALLERY
# ============================================================================

# Get user's gallery (replace USER_ID)
curl -X GET "http://localhost:9999/api/image-gallery/?user_id=test_user_123&limit=10" | python3 -m json.tool

# Filter by intent
curl -X GET "http://localhost:9999/api/image-gallery/?user_id=test_user_123&intent=image_generate&limit=10" | python3 -m json.tool

# ============================================================================
# TIPS:
# ============================================================================
# 1. Always save task_id or session_id from responses
# 2. Replace SESSION_ID, TASK_ID, USER_ID with actual values
# 3. Use python3 -m json.tool for pretty JSON output
# 4. For async operations (generation, upscale, etc), poll status endpoint
# 5. Remove background is synchronous - returns immediately
