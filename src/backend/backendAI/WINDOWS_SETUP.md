# WINDOWS INSTALLATION GUIDE

## Vấn đề thường gặp trên Windows

### 1. Celery trên Windows
Celery có vấn đề với Windows. Cần cài thêm:
```bash
pip install eventlet
```

Chạy Celery với eventlet:
```bash
celery -A backendAI worker --loglevel=info --pool=eventlet
```

HOẶC chạy với gevent:
```bash
pip install gevent
celery -A backendAI worker --loglevel=info --pool=gevent
```

### 2. Cài đặt từng bước (Windows)

#### Bước 1: Cài đặt Python 3.11 hoặc 3.12
Download từ: https://www.python.org/downloads/

#### Bước 2: Tạo Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate
```

#### Bước 3: Upgrade pip
```bash
python -m pip install --upgrade pip
```

#### Bước 4: Cài đặt requirements (chọn 1 trong 3)

**Option A: Full (có thể bị lỗi)**
```bash
pip install -r requirements.txt
```

**Option B: Windows specific (khuyến nghị)**
```bash
pip install -r requirements-windows.txt
```

**Option C: Minimal (nếu vẫn lỗi)**
```bash
pip install -r requirements-minimal.txt
```

#### Bước 5: Cài PyTorch riêng (nếu cần)
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

#### Bước 6: Cài OpenCV (nếu cần)
```bash
pip install opencv-python-headless
```

### 3. Chạy ứng dụng

#### Django Server
```bash
python manage.py runserver 0.0.0.0:9999
```

#### Celery Worker (Windows)
```bash
# Cài eventlet trước
pip install eventlet

# Chạy celery
celery -A backendAI worker --loglevel=info --pool=eventlet
```

#### Redis (cần cho Celery)
Download Redis for Windows:
- https://github.com/microsoftarchive/redis/releases
- hoặc dùng WSL: `wsl --install` rồi `sudo apt install redis-server`

### 4. Docker trên Windows

#### Yêu cầu
- Docker Desktop for Windows
- WSL 2 enabled

#### Build Docker
```bash
docker build -t backendai:latest .
```

#### Run Docker
```bash
docker-compose up -d
```

### 5. Xử lý lỗi thường gặp

#### Lỗi: Microsoft Visual C++ required
- Tải và cài Visual Studio Build Tools:
  https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

#### Lỗi: torch không tìm thấy
```bash
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

#### Lỗi: Celery timeout hoặc không chạy
```bash
pip install eventlet
celery -A backendAI worker --loglevel=info --pool=eventlet --concurrency=4
```

#### Lỗi: psycopg2 không build được
```bash
pip uninstall psycopg2 psycopg2-binary
pip install psycopg2-binary
```

#### Lỗi: OpenCV ImportError
```bash
pip uninstall opencv-python opencv-contrib-python
pip install opencv-python-headless
```

### 6. Kiểm tra cài đặt

```bash
python -c "import django; print(django.VERSION)"
python -c "import celery; print(celery.__version__)"
python -c "import torch; print(torch.__version__)"
python -c "import PIL; print(PIL.__version__)"
```

### 7. Chạy trong Docker (Khuyến nghị cho Windows)

Docker tránh được hầu hết vấn đề về dependencies trên Windows:

```bash
# Build
docker build -t backendai .

# Run with docker-compose
docker-compose up
```

## Troubleshooting

### Celery không chạy trên Windows
Windows không hỗ trợ `fork()` nên celery worker cần dùng:
- `--pool=solo` (đơn giản nhất, chậm nhất)
- `--pool=eventlet` (khuyến nghị)
- `--pool=gevent` (thay thế)

### Permission denied errors
Chạy Command Prompt hoặc PowerShell as Administrator

### ModuleNotFoundError
Đảm bảo virtual environment đã được activate:
```bash
venv\Scripts\activate
```
