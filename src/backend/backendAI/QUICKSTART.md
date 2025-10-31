# 🚀 Quick Start - Backend AI

## Setup trong 5 phút

### 1. Activate Environment
```bash
source ~/Study/common_env/bin/activate
cd src/backend/backendAI
```

### 2. Run Server
```bash
USE_SQLITE=True python manage.py runserver
```

Server chạy tại: `http://localhost:8000`

## 🧪 Test Nhanh

### Test Internal (Python)
```bash
USE_SQLITE=True python test_api_flow.py
```

### Test External (HTTP)
```bash
chmod +x test_http_api.sh
./test_http_api.sh
```

## 📡 API Endpoints

### 1. AI Gateway (Main Entry)
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate a beautiful sunset landscape",
    "session_id": "test-001"
  }'
```

### 2. Prompt Refinement (Direct)
```bash
curl -X POST http://localhost:8000/api/v1/prompt-refinement/refine/ \
  -H "Content-Type: application/json" \
  -d '{
    "original_prompt": "a cat",
    "context": {"style": "realistic"}
  }'
```

### 3. Image Generation (Direct)
```bash
curl -X POST http://localhost:8000/api/v1/image-generation/generate/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "sunset over mountains, 8k, detailed",
    "width": 512,
    "height": 512
  }'
```

## 📊 Architecture Verification

### Check Services Structure
```bash
# Should only have 2 files:
ls apps/ai_gateway/services/
# → intent_classification.py
# → response_handler.py
```

### Check Standalone Services
```bash
ls apps/ | grep -E "(prompt|image_generation)"
# → prompt_refinement/
# → image_generation/
```

## 🐛 Troubleshooting

### Server won't start?
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Try different port
USE_SQLITE=True python manage.py runserver 8001
```

### Import errors?
```bash
# Check installed packages
pip list | grep -i django

# Reinstall if needed
pip install Django==5.2.7 djangorestframework
```

### Database errors?
```bash
# Reset database
rm db.sqlite3
USE_SQLITE=True python manage.py migrate
```

## ✅ Success Indicators

Kiến trúc hoạt động đúng khi:

1. ✅ `test_api_flow.py` → ALL PASS
2. ✅ Server starts without errors
3. ✅ `/api/v1/ai-gateway/chat/` responds
4. ✅ No duplicate code in `ai_gateway/services/`

## 📚 Full Documentation

- `ARCHITECTURE_COMPLETE.md` - Complete overview
- `CLEAN_ARCHITECTURE.md` - Detailed architecture (91KB)
- `TESTING_GUIDE.md` - Testing instructions

## 🎯 Common Tasks

### Create Superuser
```bash
USE_SQLITE=True python manage.py createsuperuser
```

### Access Admin
```
http://localhost:8000/admin/
```

### View API Docs
```
http://localhost:8000/api/docs/  # If drf-yasg installed
```

### Run Specific Test
```python
# In test_api_flow.py, comment out tests you don't want
```

## 💡 Pro Tips

1. **Always use `USE_SQLITE=True`** for local development
2. **Check logs** in terminal running `runserver`
3. **Use `save_to_db=False`** in services when testing
4. **Admin panel** is great for debugging: `/admin/`

## 🚀 Next: Add AI Models

1. Install AI libraries:
```bash
pip install torch diffusers transformers
```

2. Update `service.py` files to use real models
3. See `CLEAN_ARCHITECTURE.md` for integration guide

---

**Quick Help**: Run `python test_api_flow.py` để verify everything works!
