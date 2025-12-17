# QUICK FIX CHO WINDOWS

## Vấn đề: Celery không chạy trên Windows

### Giải pháp nhanh:

1. **Cài eventlet:**
```bash
pip install eventlet
```

2. **Chạy Celery với eventlet:**
```bash
celery -A backendAI worker --loglevel=info --pool=eventlet
```

HOẶC dùng script có sẵn:
```bash
run_celery_windows.bat
```

## Vấn đề: Requirements.txt bị lỗi

### Giải pháp:

**Option 1: Dùng requirements-windows.txt**
```bash
pip install -r requirements-windows.txt
```

**Option 2: Dùng requirements-minimal.txt (cơ bản nhất)**
```bash
pip install -r requirements-minimal.txt
```

**Option 3: Cài từng cái một**
```bash
pip install Django djangorestframework django-cors-headers
pip install pymongo psycopg2-binary
pip install djangorestframework-simplejwt PyJWT python-decouple
pip install celery redis
pip install Pillow numpy
pip install requests pydantic python-dotenv
```

## Vấn đề: Docker không build được

### Sửa Dockerfile:
- Đã bỏ libgl1 (gây lỗi)
- Thêm fallback với --no-deps

### Build lại:
```bash
docker build -t backendai .
```

Hoặc dùng docker-compose cho Windows:
```bash
docker-compose -f docker-compose.windows.yml up
```

## Chi tiết đầy đủ

Xem file: **WINDOWS_SETUP.md**
