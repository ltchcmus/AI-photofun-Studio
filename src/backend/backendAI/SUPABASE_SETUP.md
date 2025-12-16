# Supabase Setup Guide

## 🎯 Overview

Backend sử dụng **Supabase PostgreSQL** cho Image Gallery thay vì local PostgreSQL để:
- ✅ Không cần cài database local
- ✅ Free tier với 500MB storage
- ✅ Auto backup & scaling
- ✅ Production-ready ngay

---

## 📝 Setup Supabase (5 phút)

### 1. Tạo tài khoản Supabase

1. Truy cập: https://supabase.com
2. Click **"Start your project"**
3. Sign up với GitHub (recommended) hoặc email
4. Free tier: Không cần credit card ✅

### 2. Tạo project mới

1. Click **"New Project"**
2. Điền thông tin:
   - **Name:** `ai-photofun-studio`
   - **Database Password:** Tạo password mạnh (lưu lại!)
   - **Region:** `Southeast Asia (Singapore)` (gần VN nhất)
3. Click **"Create new project"**
4. Chờ ~2 phút để khởi tạo

### 3. Lấy thông tin kết nối

1. Vào project vừa tạo
2. Click **Settings** (biểu tượng bánh răng) → **Database**
3. Scroll xuống phần **"Connection string"**
4. Chọn tab **"URI"** hoặc **"Connection parameters"**

**Connection parameters:**
```
Host: db.xxxxxxxxxxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres.xxxxxxxxxxxxx
Password: [your-password]
```

### 4. Cập nhật file .env

Update thông tin trong file `.env` (đã có trong repo):

```bash
# Supabase PostgreSQL
SUPABASE_DB_HOST=db.xxxxxxxxxxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xxxxxxxxxxxxx
SUPABASE_DB_PASSWORD=your-password-here
SUPABASE_DB_SSLMODE=require
```

**⚠️ Important:** 
- Replace `xxxxxxxxxxxxx` với project ref của bạn
- Replace `your-password-here` với password bạn đã tạo

### 5. Test kết nối

```bash
# Activate virtual environment
source venv/bin/activate  # hoặc: actenv

# Test connection
python manage.py check --database default

# Run migrations
python manage.py migrate

# Should see:
# Running migrations:
#   Applying image_gallery.0001_initial... OK
#   ...
```

---

## 🚀 Sử dụng với Docker

### Cách 1: Environment variables trong .env

```bash
# File: .env
SUPABASE_DB_HOST=db.xxxxxxxxxxxxx.supabase.co
SUPABASE_DB_USER=postgres.xxxxxxxxxxxxx
SUPABASE_DB_PASSWORD=your-password
```

```bash
# Build và chạy
docker compose build
docker compose up -d

# Run migrations
docker compose exec backendAI python manage.py migrate
```

### Cách 2: Inline trong docker-compose.yml

Nếu không muốn dùng .env file, edit trực tiếp `docker-compose.yml`:

```yaml
services:
  backendAI:
    environment:
      SUPABASE_DB_HOST: "db.xxxxxxxxxxxxx.supabase.co"
      SUPABASE_DB_USER: "postgres.xxxxxxxxxxxxx"
      SUPABASE_DB_PASSWORD: "your-password"
```

---

## 🔍 Verify Setup

### 1. Kiểm tra database đã tạo tables chưa

**Cách 1: Supabase Dashboard**
1. Vào project → **Table Editor**
2. Nên thấy table: `image_gallery_imagegallery`

**Cách 2: Django Shell**
```bash
python manage.py shell
```

```python
from apps.image_gallery.models import ImageGallery
ImageGallery.objects.count()  # Should return 0 (empty but connected)
```

### 2. Test create image

```bash
curl -X POST http://localhost:9999/v1/gallery/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "image_url": "https://example.com/test.jpg",
    "prompt": "Test image"
  }'
```

### 3. Xem trong Supabase

1. Supabase Dashboard → **Table Editor**
2. Select table: `image_gallery_imagegallery`
3. Nên thấy record vừa tạo

---

## 🔧 Connection Pooler (Optional - Tăng performance)

Supabase cung cấp **Connection Pooler** cho production:

### Khi nào dùng?
- ✅ Production deployment
- ✅ Nhiều workers (Gunicorn/Celery)
- ✅ High traffic

### Setup:

```bash
# File: .env (production)
SUPABASE_DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
SUPABASE_DB_PORT=6543  # Note: different port!
```

**Lấy connection pooler URL:**
1. Supabase Dashboard → Settings → Database
2. Scroll đến **"Connection Pooler"**
3. Copy **"Connection string"** với mode **"Transaction"**

---

## 📊 Free Tier Limits

| Resource | Free Tier | Enough? |
|----------|-----------|---------|
| Storage | 500 MB | ✅ Đủ cho hàng nghìn images (chỉ lưu metadata + URL) |
| Bandwidth | 5 GB | ✅ Đủ cho development |
| Database Size | 500 MB | ✅ Image chỉ lưu URL, không lưu binary |
| API Requests | Unlimited | ✅ |

**Note:** Ảnh thực tế lưu trên **Cloudinary**, Supabase chỉ lưu:
- Image URL (string)
- Prompt (text)
- Metadata (JSON)
- Timestamps

→ **500MB = ~500,000 images** (metadata only)

---

## 🆚 So sánh: Local PostgreSQL vs Supabase

| Tiêu chí | Local PostgreSQL | Supabase |
|----------|------------------|----------|
| **Setup** | Phải cài PostgreSQL | Chỉ cần copy .env |
| **Port conflicts** | Có thể conflict 5432 | Không có |
| **Backup** | Phải setup manually | Auto backup |
| **Remote access** | Khó config | Sẵn sàng |
| **Production ready** | Phải migrate DB | Dùng luôn |
| **Cost** | Free (local) | Free 500MB |
| **Team sharing** | Khó | Dễ (share .env) |

---

## 🐛 Troubleshooting

### Error: "connection refused"

**Nguyên nhân:** Sai thông tin kết nối

**Fix:**
```bash
# Verify lại thông tin trong .env
cat .env | grep SUPABASE

# Check project status tại Supabase dashboard
# Project phải ở trạng thái "Active"
```

### Error: "SSL connection required"

**Nguyên nhân:** Thiếu SSL mode

**Fix:**
```bash
# Thêm vào .env
SUPABASE_DB_SSLMODE=require
```

### Error: "password authentication failed"

**Nguyên nhân:** Sai password hoặc username

**Fix:**
1. Check lại password (có đúng không có space/special chars?)
2. Verify username format: `postgres.xxxxxxxxxxxxx` (có dấu chấm)
3. Reset password tại Supabase Dashboard → Database → Reset password

### Error: "too many connections"

**Nguyên nhân:** Vượt quá connection limit (free tier: 60 connections)

**Fix:**
```python
# settings.py
DATABASES = {
    'default': {
        # ...
        'CONN_MAX_AGE': 60,  # Reuse connections
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

Hoặc dùng **Connection Pooler** (xem phần trên)

---

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs/guides/database
- **Connection Pooler:** https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- **Django + Supabase:** https://supabase.com/docs/guides/integrations/django

---

## ✅ Checklist

- [ ] Tạo Supabase project
- [ ] Lấy connection string
- [ ] Update file .env
- [ ] Test connection: `python manage.py check --database default`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Verify tables tạo được trong Supabase Dashboard
- [ ] Test API: Create image qua `/v1/gallery/`
- [ ] (Optional) Setup Connection Pooler cho production

**Done!** Backend của bạn giờ đã dùng Supabase PostgreSQL 🎉
