# PHÂN TÍCH THƯ VIỆN REQUIREMENTS

## ❌ ĐÃ BỎ - Không cần thiết

### Thư viện AI/ML nặng (KHÔNG SỬ DỤNG trong code):
- ❌ `torch` - Không có import torch trong code
- ❌ `torchvision` - Không có import torchvision
- ❌ `numpy` - Không có import numpy
- ❌ `opencv-python` - Không có import cv2
- ❌ `opencv-contrib-python` - Không sử dụng
- ❌ `scipy` - Không sử dụng
- ❌ `scikit-image` - Không sử dụng

### Thư viện không bắt buộc:
- ❌ `flower` - Chỉ dùng để monitor Celery (optional)
- ❌ `urllib3` - Đã có requests và httpx
- ❌ `marshmallow` - Có pydantic rồi
- ❌ `imageio` - Không sử dụng
- ❌ `tqdm` - Progress bar (optional)
- ❌ `uvicorn` - Không dùng async
- ❌ `ipython`, `jupyter` - Dev tools

### Testing & Code Quality (chỉ cần khi dev):
- ❌ `pytest`, `pytest-django`, `pytest-cov`
- ❌ `factory-boy`, `faker`
- ❌ `black`, `flake8`, `isort`, `pylint`

## ✅ GIỮ LẠI - Cần thiết

### Core Framework:
- ✅ `Django` - Framework chính
- ✅ `djangorestframework` - API
- ✅ `django-cors-headers` - CORS
- ✅ `django-filter` - Filtering
- ✅ `drf-yasg` - API docs

### Database:
- ✅ `pymongo` - MongoDB cho conversations
- ✅ `psycopg2-binary` - PostgreSQL cho image_gallery

### Authentication:
- ✅ `djangorestframework-simplejwt` - JWT auth
- ✅ `PyJWT` - JWT processing
- ✅ `python-decouple` - Config management

### Image Processing:
- ✅ `Pillow` - **BẮT BUỘC** (dùng trong core/file_handler.py)

### Async Tasks:
- ✅ `celery` - Background tasks
- ✅ `redis` - Celery broker
- ✅ `eventlet` - **BẮT BUỘC cho Windows**
- ✅ `django-celery-beat` - Scheduled tasks

### HTTP Clients:
- ✅ `requests` - HTTP requests
- ✅ `httpx` - Async HTTP (nếu cần)

### Validation & Utils:
- ✅ `pydantic` - Data validation
- ✅ `python-dotenv` - Environment variables

### Production:
- ✅ `gunicorn` - Production server (Linux/Mac)
- ✅ `waitress` - Production server (Windows)
- ✅ `whitenoise` - Static files

## 📊 So sánh kích thước

### Requirements CŨ (đầy đủ):
- ~70+ packages
- Kích thước: **~5-7 GB** (với torch)
- Build time: **15-30 phút**

### Requirements MỚI (tối ưu):
- ~20 packages (bắt buộc)
- Kích thước: **~500 MB - 1 GB**
- Build time: **3-5 phút**

## 🐳 DOCKERFILE

**CÓ, Dockerfile tự động tải requirements:**

```dockerfile
# Dòng 29: Copy requirements.txt
COPY requirements.txt .

# Dòng 32-36: Tự động install
RUN pip install --prefix=/install --no-warn-script-location \
    -r requirements.txt gunicorn
```

### Quy trình:
1. Copy `requirements.txt` vào image
2. Chạy `pip install -r requirements.txt`
3. Install thành công → build xong
4. Nếu lỗi → retry với `--no-deps` (fallback)

## 💡 KHUYẾN NGHỊ

### Cho Windows:
```bash
pip install -r requirements-minimal.txt
pip install eventlet
celery -A backendAI worker --pool=eventlet
```

### Cho Docker:
```bash
docker build -t backendai .
# Dockerfile sẽ tự động install requirements.txt
```

### Nếu cần thêm packages sau:
Chỉ cài khi thực sự cần:
- `torch` - Nếu thêm tính năng ML
- `opencv-python` - Nếu xử lý video
- `pytest` - Khi chạy tests
- `black` - Khi format code
