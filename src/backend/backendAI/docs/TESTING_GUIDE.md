# 🧪 Testing Guide - AI PhotoFun Studio Backend

Hướng dẫn test toàn bộ backend architecture với các bước chi tiết.

## 📋 Kiến Trúc Được Test

```
apps/
├── prompt_refinement/      # ✅ Standalone Service - Refine prompts
├── image_generation/       # ✅ Standalone Service - Generate images
├── face_swap/             # ✅ Standalone Service - Face swapping
├── background_removal/    # ✅ Standalone Service - Remove background
└── ai_gateway/            # ✅ Pure Orchestrator - Routes requests
    ├── pipeline.py        # Orchestration logic
    └── services/
        ├── intent_classification.py  # Classify user intent
        └── response_handler.py       # Format responses
```

## 🚀 Bước 1: Setup Environment

### 1.1. Cài Đặt Dependencies

```bash
cd src/backend/backendAI

# Cài đặt Python packages
pip install django djangorestframework pillow numpy

# Cài đặt tools để test HTTP API
sudo apt-get install curl jq  # Ubuntu/Debian
# hoặc
brew install curl jq  # macOS
```

### 1.2. Chạy Migrations

```bash
# Tạo migrations cho các apps mới
python manage.py makemigrations prompt_refinement
python manage.py makemigrations image_generation
python manage.py makemigrations face_swap
python manage.py makemigrations background_removal

# Apply migrations
python manage.py migrate

# Tạo superuser (optional, để truy cập admin)
python manage.py createsuperuser
```

## 🧪 Bước 2: Test Với Python Script (Internal Testing)

Script này test **trực tiếp** các services mà KHÔNG qua HTTP.

### 2.1. Chạy Test Script

```bash
python test_api_flow.py
```

### 2.2. Các Test Cases

Script sẽ test theo thứ tự:

#### **Bước 1: Intent Classification**
```
Test: Phân loại intent từ user message
✅ "Create a sunset" → image_generation
✅ "Remove background" → background_removal
✅ "Swap faces" → face_swap
```

#### **Bước 2: Prompt Refinement Service**
```
Test: Refine user prompts
Input:  "a cat"
Output: "a cat, high quality, detailed, masterpiece, 8k, sharp focus"
```

#### **Bước 3: Image Generation Service**
```
Test: Generate images from prompts
✅ Test với different parameters (width, height, steps)
✅ Validate output (image bytes, metadata)
```

#### **Bước 4: AI Gateway - Full Pipeline**
```
Test: Toàn bộ flow từ đầu đến cuối
User message → Intent → Refine → Generate → Response
✅ Kiểm tra pipeline metadata
✅ Kiểm tra timing của từng bước
```

#### **Bước 5: Parameter Validation**
```
Test: Validate input parameters
✅ Valid params → Pass
❌ Invalid width → Reject
❌ Invalid steps → Reject
```

#### **Bước 6: Service Integration**
```
Test: Services gọi lẫn nhau
Prompt Refinement → Image Generation
✅ Verify services communicate correctly
```

### 2.3. Expected Output

```
================================================================================
BƯỚC 1: Test Intent Classification Service
================================================================================

📝 Test case 1: 'Create a beautiful sunset landscape'
   Has image: False
✅ Intent detected: image_generation
✅ Confidence: 0.85
✅ Expected: image_generation
   ✅ PASS - Intent classification correct!

...

================================================================================
📊 TEST SUMMARY
================================================================================
  ✅ PASS  Intent Classification
  ✅ PASS  Prompt Refinement Service
  ✅ PASS  Image Generation Service
  ✅ PASS  AI Gateway Full Pipeline
  ✅ PASS  Parameter Validation
  ✅ PASS  Service Integration
================================================================================
```

## 🌐 Bước 3: Test Với HTTP API (External Testing)

Test qua **REST API** như frontend sẽ gọi.

### 3.1. Khởi Động Server

```bash
# Terminal 1: Start Django server
python manage.py runserver
```

Server sẽ chạy tại: `http://localhost:8000`

### 3.2. Chạy HTTP Test Script

```bash
# Terminal 2: Run HTTP tests
chmod +x test_http_api.sh
./test_http_api.sh
```

### 3.3. Các API Endpoints Được Test

#### **1. Prompt Refinement Service**
```bash
# Endpoint: POST /api/v1/prompt-refinement/refine/
curl -X POST http://localhost:8000/api/v1/prompt-refinement/refine/ \
  -H "Content-Type: application/json" \
  -d '{
    "original_prompt": "a cat",
    "context": {"style": "realistic"},
    "method": "rule_based"
  }'
```

**Expected Response:**
```json
{
  "refined_prompt": "a cat, high quality, detailed, masterpiece...",
  "confidence_score": 0.75,
  "method_used": "rule_based",
  "suggestions": ["Add lighting details", "Specify camera angle"],
  "processing_time": 0.023
}
```

#### **2. Validate Prompt**
```bash
# Endpoint: POST /api/v1/prompt-refinement/validate/
curl -X POST http://localhost:8000/api/v1/prompt-refinement/validate/ \
  -H "Content-Type: application/json" \
  -d '{"prompt": "beautiful sunset"}'
```

**Expected Response:**
```json
{
  "is_valid": true,
  "issues": [],
  "suggestions": ["Consider adding time of day"]
}
```

#### **3. Extract Negative Prompt**
```bash
# Endpoint: POST /api/v1/prompt-refinement/extract-negative/
curl -X POST http://localhost:8000/api/v1/prompt-refinement/extract-negative/ \
  -H "Content-Type: application/json" \
  -d '{"prompt": "beautiful cat, NOT blurry, WITHOUT watermark"}'
```

**Expected Response:**
```json
{
  "positive_prompt": "beautiful cat",
  "negative_prompt": "blurry, watermark"
}
```

#### **4. Get Prompt Templates**
```bash
# Endpoint: GET /api/v1/prompt-refinement/templates/
curl http://localhost:8000/api/v1/prompt-refinement/templates/?category=portrait
```

#### **5. Image Generation Service**
```bash
# Endpoint: POST /api/v1/image-generation/generate/
curl -X POST http://localhost:8000/api/v1/image-generation/generate/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "sunset over mountains, high quality, 8k",
    "negative_prompt": "blurry, low quality",
    "width": 512,
    "height": 512,
    "num_inference_steps": 30,
    "guidance_scale": 7.5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "image_url": "/media/generated/...",
  "request_id": "abc123...",
  "metadata": {
    "width": 512,
    "height": 512,
    "processing_time": 1.234
  }
}
```

#### **6. AI Gateway - Full Pipeline**
```bash
# Endpoint: POST /api/v1/ai-gateway/chat/
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate a beautiful sunset landscape",
    "session_id": "test-session-001",
    "context": {"style": "realistic", "quality": "high"}
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "type": "image",
    "image_url": "/media/generated/...",
    "metadata": {...}
  },
  "pipeline_metadata": {
    "pipeline_id": "abc123",
    "intent": "image_generation",
    "intent_confidence": 0.95,
    "total_processing_time": 2.456
  }
}
```

## 🔍 Bước 4: Manual Testing với cURL

### 4.1. Test Flow: User Message → Image Generation

**Step 1: Refine Prompt**
```bash
curl -X POST http://localhost:8000/api/v1/prompt-refinement/refine/ \
  -H "Content-Type: application/json" \
  -d '{
    "original_prompt": "a cat sitting on a chair"
  }' | jq '.'
```

**Step 2: Use Refined Prompt for Generation**
```bash
# Copy refined_prompt từ response trên
curl -X POST http://localhost:8000/api/v1/image-generation/generate/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "<refined_prompt_here>",
    "negative_prompt": "blurry, low quality"
  }' | jq '.'
```

**Step 3: Check Generation Status**
```bash
# Copy request_id từ response trên
curl http://localhost:8000/api/v1/image-generation/status/<request_id>/ | jq '.'
```

### 4.2. Test Full Pipeline (Through AI Gateway)

**One-Step Process:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a portrait of a warrior, fantasy style",
    "session_id": "my-session"
  }' | jq '.'
```

## 📊 Bước 5: Verify Architecture

### 5.1. Check Services Structure

```bash
# Verify ai_gateway/services only has orchestration files
ls -la apps/ai_gateway/services/

# Should only contain:
# - __init__.py
# - intent_classification.py
# - response_handler.py
```

### 5.2. Check Standalone Services

```bash
# Each standalone service should have:
ls -la apps/prompt_refinement/
# - models.py
# - service.py
# - views.py
# - serializers.py
# - urls.py
# - admin.py

ls -la apps/image_generation/
# - models.py
# - service.py
# - views.py
# - serializers.py
# - urls.py
# - admin.py
```

### 5.3. Verify No Duplicate Code

```bash
# Should NOT exist (deleted):
# - apps/ai_gateway/services/prompt_refinement.py
# - apps/ai_gateway/services/image_generation.py

# Verify:
find apps/ai_gateway/services -name "prompt_refinement.py"  # Should return nothing
find apps/ai_gateway/services -name "image_generation.py"   # Should return nothing
```

## 🐛 Troubleshooting

### Issue 1: Import Errors
```
Error: No module named 'apps.prompt_refinement'
```

**Fix:**
```bash
# Make sure you're in the right directory
cd src/backend/backendAI

# Check INSTALLED_APPS in settings.py
python manage.py shell
>>> from django.conf import settings
>>> print(settings.INSTALLED_APPS)
```

### Issue 2: Migration Errors
```
Error: No migrations to apply
```

**Fix:**
```bash
python manage.py makemigrations --dry-run  # Check what will be created
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

### Issue 3: Server Won't Start
```
Error: Port 8000 already in use
```

**Fix:**
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port
python manage.py runserver 8001
```

## ✅ Success Criteria

Hệ thống hoạt động đúng khi:

1. ✅ **All Python tests pass** - `test_api_flow.py` runs without errors
2. ✅ **All HTTP tests pass** - `test_http_api.sh` shows all green checks
3. ✅ **Clean architecture** - No duplicate code in ai_gateway/services
4. ✅ **Services are independent** - Each service can be called directly
5. ✅ **AI Gateway orchestrates** - Gateway routes to correct services
6. ✅ **Database records** - Requests are saved (when save_to_db=True)

## 📚 Next Steps

1. **Integrate Real AI Models**
   - Replace placeholders in `image_generation/service.py`
   - Add Stable Diffusion pipeline
   - Add LLM for prompt refinement

2. **Add Authentication**
   - User authentication
   - API key management
   - Rate limiting

3. **Production Setup**
   - Configure PostgreSQL
   - Setup Redis for caching
   - Deploy to cloud

4. **Frontend Integration**
   - Connect React frontend
   - WebSocket for real-time updates
   - Image upload handling

## 📞 Support

Nếu có lỗi, check:
1. Django logs: Terminal running `runserver`
2. Test output: Look for ❌ FAIL messages
3. Database: `python manage.py dbshell`
4. Admin panel: `http://localhost:8000/admin/`
