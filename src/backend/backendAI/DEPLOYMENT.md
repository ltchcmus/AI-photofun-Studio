# AI PhotoFun Studio Backend - Deployment Guide

Complete guide for setting up and deploying the AI PhotoFun Studio backend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Local Development)](#quick-start-local-development)
3. [Docker Deployment](#docker-deployment)
4. [Manual Setup](#manual-setup)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [API Testing](#api-testing)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

- **Python 3.12+**
- **Docker & Docker Compose** (for containerized deployment)
- **MongoDB 6+** (for conversation storage)
- **PostgreSQL 15+** (for image gallery)
- **Redis 7+** (for Celery task queue)

### Required API Keys

1. **Freepik API Key** - Get from: https://www.freepik.com/api/sign-up
2. **Google Gemini API Key** - Get from: https://ai.google.dev/

---

## Quick Start (Local Development)

### 1. Clone and Setup

```bash
cd src/backend/backendAI

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### 2. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Configure Environment

Edit `.env` file:
```bash
# Add your API keys
FREEPIK_API_KEY=your-freepik-key-here
GEMINI_API_KEY=your-gemini-key-here

# Database settings (defaults work for local dev)
MONGO_URI=mongodb://localhost:27017
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=postgres
REDIS_URL=redis://localhost:6379/0
```

### 4. Start Databases

**Option A: Using Docker (Recommended)**
```bash
# Start only databases
docker-compose up -d mongo postgres redis
```

**Option B: Local Installation**
- Install MongoDB, PostgreSQL, and Redis locally
- Ensure they're running on default ports

### 5. Initialize Database

```bash
# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
# Terminal 1: Django server
python manage.py runserver 0.0.0.0:9999

# Terminal 2: Celery worker
celery -A backendAI worker --loglevel=info --concurrency=4
```

### 7. Test the API

```bash
# Check server health
curl http://localhost:9999/health/

# Run test script
./test_direct_ai_features.sh
```

**✅ Done!** Your backend is now running at `http://localhost:9999`

---

## Docker Deployment

### Full Stack Deployment

#### 1. Configure Environment

```bash
cd src/backend/backendAI

# Create .env file
cp .env.example .env

# Edit with your API keys
nano .env
```

Required variables in `.env`:
```env
FREEPIK_API_KEY=your-freepik-key
GEMINI_API_KEY=your-gemini-key
POSTGRES_PASSWORD=your-secure-password
DJANGO_SECRET_KEY=your-django-secret-key
```

#### 2. Build and Start Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backendAI
```

#### 3. Initialize Database

```bash
# Run migrations
docker-compose exec backendAI python manage.py migrate

# Create superuser (optional)
docker-compose exec backendAI python manage.py createsuperuser
```

#### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# Test API
curl http://localhost:9999/health/

# Check logs
docker-compose logs -f
```

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| `backendAI` | 9999 | Main Django API server |
| `celery_worker` | - | Background task processor |
| `redis` | 6379 | Task queue & cache |
| `mongo` | 27017 | Conversation storage |
| `postgres` | 5432 | Image gallery database |
| `flower` | 5555 | Celery monitoring (optional) |

### Useful Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart backendAI

# Execute command in container
docker-compose exec backendAI python manage.py shell

# View running containers
docker-compose ps

# Clean up everything (⚠️ DELETES DATA)
docker-compose down -v
```

### Enable Monitoring (Flower)

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Access Flower UI
open http://localhost:5555
```

---

## Manual Setup

### 1. Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
    python3.12 python3.12-venv python3-pip \
    build-essential libpq-dev \
    libgl1-mesa-glx libglib2.0-0 \
    mongodb postgresql redis-server
```

**macOS:**
```bash
brew install python@3.12 mongodb-community postgresql redis
brew services start mongodb-community
brew services start postgresql
brew services start redis
```

### 2. Setup Python Environment

```bash
cd src/backend/backendAI

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Databases

**PostgreSQL:**
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE ai_photofun_gallery;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_photofun_gallery TO postgres;"
```

**MongoDB:**
```bash
# MongoDB auto-creates database on first use
# No manual setup needed
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env  # Add your API keys and settings
```

### 5. Run Migrations

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 6. Start Services

```bash
# Terminal 1: Django
python manage.py runserver 0.0.0.0:9999

# Terminal 2: Celery Worker
celery -A backendAI worker --loglevel=info --concurrency=4

# Terminal 3: Celery Beat (for scheduled tasks)
celery -A backendAI beat --loglevel=info
```

---

## Configuration

### Environment Variables

Full list of configuration options:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | Yes | - | Django secret key (generate with `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`) |
| `DJANGO_DEBUG` | No | `0` | Enable debug mode (use `1` for development) |
| `DJANGO_ALLOWED_HOSTS` | No | `localhost` | Comma-separated list of allowed hosts |
| `MONGO_URI` | Yes | - | MongoDB connection string |
| `MONGO_DB_NAME` | Yes | - | MongoDB database name |
| `POSTGRES_HOST` | Yes | - | PostgreSQL host |
| `POSTGRES_PORT` | No | `5432` | PostgreSQL port |
| `POSTGRES_DB` | Yes | - | PostgreSQL database name |
| `POSTGRES_USER` | Yes | - | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | - | PostgreSQL password |
| `REDIS_URL` | Yes | - | Redis connection URL |
| `FREEPIK_API_KEY` | Yes | - | Freepik API key for AI features |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key for prompt refinement |
| `FILE_SERVICE_URL` | No | - | External file upload service URL |

### Generate Django Secret Key

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

---

## Database Setup

### PostgreSQL

**Create database manually:**
```bash
psql -U postgres -h localhost
```

```sql
CREATE DATABASE ai_photofun_gallery;
GRANT ALL PRIVILEGES ON DATABASE ai_photofun_gallery TO postgres;
\q
```

**Run migrations:**
```bash
python manage.py migrate
```

### MongoDB

MongoDB automatically creates the database on first connection. No manual setup needed.

**Verify connection:**
```bash
mongosh
use ai_photofun_studio
show collections
```

---

## Running the Application

### Development Mode

```bash
# Activate virtual environment
source venv/bin/activate

# Run Django development server
python manage.py runserver 0.0.0.0:9999

# In another terminal: Run Celery worker
celery -A backendAI worker --loglevel=info --concurrency=4
```

### Production Mode (Gunicorn)

```bash
# Install gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn backendAI.wsgi:application \
    --bind 0.0.0.0:9999 \
    --workers 4 \
    --timeout 120 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log
```

### Using Systemd (Linux Production)

Create service files:

**`/etc/systemd/system/backendai.service`:**
```ini
[Unit]
Description=AI PhotoFun Studio Backend
After=network.target postgresql.service mongodb.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/backendAI
Environment="PATH=/var/www/backendAI/venv/bin"
ExecStart=/var/www/backendAI/venv/bin/gunicorn backendAI.wsgi:application \
    --bind 0.0.0.0:9999 \
    --workers 4 \
    --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/backendai-celery.service`:**
```ini
[Unit]
Description=AI PhotoFun Studio Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/var/www/backendAI
Environment="PATH=/var/www/backendAI/venv/bin"
ExecStart=/var/www/backendAI/venv/bin/celery -A backendAI worker \
    --loglevel=info \
    --concurrency=4 \
    --detach
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable backendai backendai-celery
sudo systemctl start backendai backendai-celery
sudo systemctl status backendai
```

---

## API Testing

### Using the Test Script

```bash
# Make executable
chmod +x test_direct_ai_features.sh

# Run tests
./test_direct_ai_features.sh
```

### Manual Testing with cURL

**1. Create conversation session:**
```bash
curl -X POST http://localhost:9999/v1/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}'
```

**2. Generate image:**
```bash
curl -X POST http://localhost:9999/v1/features/image-generate/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "user_id": "test_user_123",
    "aspect_ratio": "16:9",
    "num_images": 1,
    "styling": {"style": "photorealistic"}
  }'
```

**3. Remove background:**
```bash
curl -X POST http://localhost:9999/v1/features/remove-background/ \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800",
    "user_id": "test_user_123"
  }'
```

**4. Get gallery:**
```bash
curl "http://localhost:9999/v1/gallery/?user_id=test_user_123"
```

---

## Troubleshooting

### Common Issues

#### 1. "Connection refused" errors

**Problem:** Cannot connect to databases

**Solution:**
```bash
# Check service status
docker-compose ps  # If using Docker

# Or check local services
sudo systemctl status mongodb
sudo systemctl status postgresql
sudo systemctl status redis

# Restart services
docker-compose restart mongo postgres redis
```

#### 2. "Import Error" or "Module not found"

**Problem:** Missing dependencies

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### 3. Celery tasks not processing

**Problem:** Celery worker not running or connected

**Solution:**
```bash
# Check Redis connection
redis-cli ping  # Should return "PONG"

# Restart Celery worker
docker-compose restart celery_worker  # Docker
# Or
pkill -f celery  # Kill existing
celery -A backendAI worker --loglevel=info --concurrency=4  # Restart
```

#### 4. "Freepik API error: 401"

**Problem:** Invalid or missing Freepik API key

**Solution:**
```bash
# Verify API key in .env
cat .env | grep FREEPIK_API_KEY

# Test API key
curl -H "x-freepik-api-key: YOUR_KEY" https://api.freepik.com/v1/ai
```

#### 5. Database migration errors

**Problem:** Database schema out of sync

**Solution:**
```bash
# Reset migrations (⚠️ DELETES DATA)
python manage.py migrate --fake image_gallery zero
python manage.py migrate image_gallery

# Or fresh start
docker-compose down -v  # Deletes volumes
docker-compose up -d
docker-compose exec backendAI python manage.py migrate
```

#### 6. Port already in use

**Problem:** Port 9999 is occupied

**Solution:**
```bash
# Find process using port
lsof -i :9999  # macOS/Linux
netstat -ano | findstr :9999  # Windows

# Kill process
kill -9 <PID>

# Or use different port
python manage.py runserver 0.0.0.0:8000
```

### Viewing Logs

**Docker:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backendAI
docker-compose logs -f celery_worker
```

**Local:**
```bash
# Django logs
tail -f logs/debug.log

# Celery logs
tail -f logs/celery.log
```

### Health Checks

```bash
# API health
curl http://localhost:9999/health/

# Database connections
docker-compose exec backendAI python manage.py check --database default

# Redis connection
docker-compose exec backendAI python -c "import redis; r = redis.from_url('redis://redis:6379/0'); print(r.ping())"
```

---

## Production Deployment

### Security Checklist

- [ ] Set `DJANGO_DEBUG=0`
- [ ] Use strong `DJANGO_SECRET_KEY`
- [ ] Change default database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (only expose necessary ports)
- [ ] Set `DJANGO_ALLOWED_HOSTS` to specific domains
- [ ] Use environment-specific `.env` files
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure log rotation
- [ ] Enable database backups
- [ ] Use Redis password authentication

### Performance Optimization

**Gunicorn workers:**
```bash
# Formula: (2 x CPU cores) + 1
gunicorn backendAI.wsgi:application \
    --workers $((2 * $(nproc) + 1)) \
    --worker-class gevent \
    --timeout 120
```

**Celery concurrency:**
```bash
# Adjust based on CPU cores and task type
celery -A backendAI worker --concurrency=8
```

**PostgreSQL tuning:**
```sql
-- Adjust in postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
max_connections = 200
```

### Nginx Reverse Proxy

**`/etc/nginx/sites-available/backendai`:**
```nginx
upstream backendai {
    server 127.0.0.1:9999;
}

server {
    listen 80;
    server_name api.aiphotofun.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://backendai;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /static/ {
        alias /var/www/backendAI/staticfiles/;
    }

    location /media/ {
        alias /var/www/backendAI/media/;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/backendai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.aiphotofun.com
sudo systemctl reload nginx
```

---

## Support & Resources

- **API Documentation:** See `API_DOCUMENTATION.md`
- **Test Script:** `test_direct_ai_features.sh`
- **Environment Template:** `.env.example`

---

**Last Updated:** December 2025  
**Version:** 1.0.0
