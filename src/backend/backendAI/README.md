# 🤖 Backend AI - AI Photo Studio

Backend API cho ứng dụng chỉnh sửa ảnh bằng AI, hỗ trợ các tính năng như face swap, background removal, object removal, style transfer và image enhancement.

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Cấu Trúc Project](#cấu-trúc-project)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cài Đặt](#cài-đặt)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [AI Features](#ai-features)
- [Development Guide](#development-guide)

---

## 🎯 Tổng Quan

Backend AI cung cấp RESTful API để xử lý ảnh với các tính năng AI:

- ✅ **Image Processing**: Resize, crop, rotate, filter
- ✅ **Face Swap**: Hoán đổi khuôn mặt giữa 2 ảnh
- ✅ **Background Removal**: Xóa phông nền tự động
- 🚧 **Object Removal**: Xóa đối tượng không mong muốn (Coming soon)
- 🚧 **Style Transfer**: Chuyển đổi phong cách nghệ thuật (Coming soon)
- 🚧 **Image Enhancement**: Nâng cao chất lượng ảnh với AI (Coming soon)

---

## 📁 Cấu Trúc Project

```
backendAI/
├── manage.py                      # Django management script
├── requirements.txt               # Python dependencies
├── Dockerfile                     # Multi-stage Docker build
├── .env.example                   # Environment variables template
├── pyproject.toml                 # Python tooling config
│
├── backendAI/                     # 🔧 Project Configuration
│   ├── settings.py                # Main Django settings
│   ├── urls.py                    # Main URL routing
│   ├── wsgi.py                    # WSGI entry point
│   ├── asgi.py                    # ASGI entry point
│   └── README.md                  # Configuration docs
│
├── apps/                          # 📱 Django Applications
│   ├── image_processing/          # Basic image operations
│   │   ├── models.py              # Database models
│   │   ├── views.py               # API endpoints
│   │   ├── serializers.py         # Request/response serializers
│   │   ├── services.py            # Business logic
│   │   ├── urls.py                # App URL routing
│   │   └── admin.py               # Django admin config
│   │
│   ├── face_swap/                 # Face swapping AI
│   ├── background_removal/        # Background removal AI
│   ├── object_removal/            # Object inpainting AI
│   ├── style_transfer/            # Neural style transfer
│   └── image_enhancement/         # Super resolution AI
│
├── core/                          # 🛠️ Shared Utilities
│   ├── model_manager.py           # AI model loading & caching
│   ├── file_handler.py            # File validation & handling
│   ├── response_utils.py          # Standardized API responses
│   ├── middleware.py              # Custom middleware
│   ├── exceptions.py              # Exception handlers
│   └── README.md                  # Core utilities docs
│
├── media/                         # 📸 Uploaded & processed images
├── ml_models/                     # 🧠 AI model files (.pth, .onnx)
├── logs/                          # 📝 Application logs
└── staticfiles/                   # 🎨 Static files (CSS, JS)
```

---

## 🚀 Công Nghệ Sử Dụng

### Backend Framework
- **Django 5.2.7** - Web framework
- **Django REST Framework 3.15** - RESTful API
- **PostgreSQL** - Primary database
- **Redis** - Caching & Celery broker

### AI/ML Libraries
- **PyTorch 2.5** - Deep learning framework
- **OpenCV 4.10** - Computer vision
- **Pillow 11.0** - Image processing
- **NumPy & SciPy** - Scientific computing

### Specific AI Models (Planned)
- **InsightFace** - Face detection & swap
- **U2-Net / Rembg** - Background removal
- **LaMa** - Image inpainting
- **Real-ESRGAN** - Super resolution

### DevOps
- **Docker** - Containerization (CPU & GPU support)
- **Celery** - Async task processing
- **Gunicorn** - WSGI server
- **Nginx** - Reverse proxy (in production)

---

## 💻 Cài Đặt

### Prerequisites

- Python 3.11+
- PostgreSQL 14+ (hoặc SQLite cho development)
- Redis (cho Celery)
- CUDA 12.1+ (optional, cho GPU)

### 1. Clone Repository

```bash
git clone <repository-url>
cd src/backend/backendAI
```

### 2. Create Virtual Environment

```bash
# Using venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Or using conda
conda create -n backendai python=3.11
conda activate backendai
```

### 3. Install Dependencies

```bash
# Install all dependencies
pip install -r requirements.txt

# For GPU support (PyTorch with CUDA)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

### 4. Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Important variables**:
```env
DEBUG=True
USE_SQLITE=True  # Set False for PostgreSQL
SECRET_KEY=your-secret-key-here

# Database (if using PostgreSQL)
DB_NAME=backendai_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# AI Configuration
USE_GPU=False  # Set True if you have CUDA-capable GPU
```

### 5. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# (Optional) Load sample data
python manage.py loaddata fixtures/sample_data.json
```

---

## 🏃 Chạy Ứng Dụng

### Development Mode

```bash
# Start Django development server
python manage.py runserver

# Access at: http://localhost:8000
# Admin panel: http://localhost:8000/admin
# API docs: http://localhost:8000/swagger/
```

### With Celery (Background Tasks)

```bash
# Terminal 1: Start Django
python manage.py runserver

# Terminal 2: Start Redis (if not running)
redis-server

# Terminal 3: Start Celery worker
celery -A backendAI worker -l info

# Terminal 4: Start Celery beat (scheduled tasks)
celery -A backendAI beat -l info
```

### Using Docker

```bash
# Build and run (development)
docker build --target development -t backendai:dev .
docker run -p 8000:8000 backendai:dev

# Build and run (production)
docker build --target production -t backendai:prod .
docker run -p 8000:8000 backendai:prod

# Build GPU-enabled image
docker build --target gpu -t backendai:gpu .
docker run --gpus all -p 8000:8000 backendai:gpu
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📚 API Documentation

### Interactive Documentation

Sau khi chạy server, truy cập:

- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

### API Endpoints Overview

#### 1. Image Processing
```
POST   /api/v1/image-processing/process/
GET    /api/v1/image-processing/
GET    /api/v1/image-processing/{id}/
```

#### 2. Face Swap
```
POST   /api/v1/face-swap/swap/
GET    /api/v1/face-swap/
GET    /api/v1/face-swap/{id}/
```

#### 3. Background Removal
```
POST   /api/v1/background-removal/remove/
GET    /api/v1/background-removal/
GET    /api/v1/background-removal/{id}/
```

### Example Request

```bash
# Face Swap Example
curl -X POST http://localhost:8000/api/v1/face-swap/swap/ \
  -F "source_image=@face1.jpg" \
  -F "target_image=@face2.jpg" \
  -F "blend_ratio=0.8"
```

### Response Format

**Success Response**:
```json
{
  "success": true,
  "message": "Face swap completed",
  "data": {
    "id": 1,
    "result_image": "/media/face_swap/result/2025/01/26/faceswap_1.png",
    "status": "completed",
    "processing_time": 2.45
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Face swap failed",
  "errors": {
    "detail": "No face detected in source image"
  }
}
```

---

## 🧠 AI Features

### 1. Image Processing

**Endpoint**: `/api/v1/image-processing/process/`

**Operations**:
- `resize` - Thay đổi kích thước
- `crop` - Cắt ảnh
- `rotate` - Xoay ảnh
- `filter` - Áp dụng filter (blur, sharpen, brightness, contrast)
- `compress` - Nén ảnh

**Example**:
```python
{
  "image": <file>,
  "operation_type": "resize",
  "parameters": {
    "width": 800,
    "height": 600,
    "maintain_aspect": true
  }
}
```

### 2. Face Swap

**Endpoint**: `/api/v1/face-swap/swap/`

**Features**:
- Detect faces automatically
- Swap faces between 2 images
- Adjustable blend ratio
- GPU acceleration support

**Parameters**:
- `source_image` - Ảnh chứa khuôn mặt nguồn
- `target_image` - Ảnh đích để swap
- `blend_ratio` - Tỷ lệ pha trộn (0.0 - 1.0)
- `use_gpu` - Sử dụng GPU (true/false)

### 3. Background Removal

**Endpoint**: `/api/v1/background-removal/remove/`

**Features**:
- Automatic background segmentation
- Transparent or custom background color
- Optional mask output
- High-quality edge detection

**Parameters**:
- `image` - Ảnh cần xóa phông
- `return_mask` - Trả về mask (true/false)
- `background_color` - Màu nền ('transparent', 'white', 'black', '#hex')

---

## 👨‍💻 Development Guide

### Adding a New Feature

1. **Create Django app**:
```bash
python manage.py startapp new_feature
mv new_feature apps/
```

2. **Add to settings.py**:
```python
INSTALLED_APPS = [
    ...
    'apps.new_feature',
]
```

3. **Create models, serializers, views**:
- Follow existing app structure
- Use `core` utilities for common tasks

4. **Add URL routing**:
```python
# In backendAI/urls.py
path('api/v1/new-feature/', include('apps.new_feature.urls')),
```

### Code Style

```bash
# Format code
black .

# Sort imports
isort .

# Lint
flake8 .
pylint apps/ core/
```

### Testing

```bash
# Run all tests
pytest

# Run specific app tests
pytest apps/image_processing/tests.py

# With coverage
pytest --cov=apps --cov-report=html
```

### Database Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migrations
python manage.py showmigrations
```

---

## 🔐 Security Notes

### Production Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Set `DEBUG=False`
- [ ] Update `ALLOWED_HOSTS`
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Use strong database password
- [ ] Set up proper file upload limits
- [ ] Enable rate limiting
- [ ] Regular security updates

---

## 📦 AI Models Setup

AI models không được include trong repository (quá lớn). Bạn cần download riêng:

### Download Models

```bash
# Create models directory
mkdir -p ml_models

# Face Swap Model (InsightFace)
# wget <model-url> -O ml_models/face_swap/

# Background Removal Model (U2-Net)
# wget <model-url> -O ml_models/background_removal/

# Or use Python script
python scripts/download_models.py
```

### Model Configuration

Models được config trong `settings.py`:

```python
AI_MODEL_CONFIGS = {
    'face_swap': {
        'model_path': ML_MODELS_DIR / 'face_swap',
        'use_gpu': True,
        'max_image_size': 2048,
    },
    ...
}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Import errors after creating new app**
```bash
# Solution: Make sure __init__.py exists
touch apps/new_app/__init__.py
```

**2. Database connection error**
```bash
# Solution: Check PostgreSQL is running
sudo systemctl status postgresql

# Or use SQLite in development
# Set USE_SQLITE=True in .env
```

**3. CUDA/GPU errors**
```bash
# Solution: Check CUDA installation
nvidia-smi

# Or disable GPU
# Set USE_GPU=False in .env
```

**4. Module not found errors**
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

## 📞 Contact & Support

- **Project Repository**: [GitHub Link]
- **Team**: Backend AI Team
- **Issues**: [GitHub Issues]

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

- Django & DRF communities
- AI model authors (InsightFace, U2-Net, etc.)
- Open source contributors

---

**Happy Coding! 🚀**
