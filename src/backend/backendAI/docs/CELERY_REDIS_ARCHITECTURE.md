# Backend AI - Celery + Redis Architecture

## 🎯 Overview

Backend AI sử dụng **Celery + Redis** để xử lý async tasks, cho phép:
- ✅ Xử lý nhiều requests đồng thời
- ✅ Non-blocking API responses
- ✅ Task queuing và retry mechanism
- ✅ Progress tracking
- ✅ Scalable workers

---

## 🏗️ Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────┐
│                   Frontend                          │
│  • Upload image                                     │
│  • Send prompt                                      │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP POST
                    ▼
┌─────────────────────────────────────────────────────┐
│              Django REST API                        │
│  POST /api/v1/tasks/create/                         │
│  {                                                  │
│    "prompt": "beautiful sunset",                    │
│    "image": <file>,                                 │
│    "task_type": "image_generation"                  │
│  }                                                  │
└───────────────────┬─────────────────────────────────┘
                    │ 1. Save to DB (task_id)
                    │ 2. Queue Celery task
                    ▼
┌─────────────────────────────────────────────────────┐
│                  Redis Queue                        │
│  • Task queue                                       │
│  • Result backend                                   │
│  • Progress tracking                                │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              Celery Workers (Multiple)              │
│  Worker 1: Processing task_id_001                   │
│  Worker 2: Processing task_id_002                   │
│  Worker 3: Processing task_id_003                   │
│  ...                                                │
└───────────────────┬─────────────────────────────────┘
                    │ Process AI task
                    ▼
┌─────────────────────────────────────────────────────┐
│              AI Services                            │
│  • Image Generation                                 │
│  • Face Swap                                        │
│  • Background Removal                               │
│  • Prompt Refinement                                │
└───────────────────┬─────────────────────────────────┘
                    │ Save result
                    ▼
┌─────────────────────────────────────────────────────┐
│          PostgreSQL / SQLite                        │
│  • Task metadata                                    │
│  • Task status                                      │
│  • Result URLs                                      │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│                  Frontend                           │
│  GET /api/v1/tasks/{task_id}/status/                │
│  GET /api/v1/tasks/{task_id}/result/                │
└─────────────────────────────────────────────────────┘
```

---

## 📡 API Flow

### 1. Create Task (Submit Job)

**Request:**
```http
POST /api/v1/tasks/create/
Content-Type: multipart/form-data

prompt: "beautiful sunset over mountains"
image: <binary file data> (optional)
task_type: "image_generation"
parameters: {"width": 512, "height": 512}
```

**Response (Immediate):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "message": "Task queued successfully",
  "created_at": "2025-10-27T10:30:00Z"
}
```

### 2. Check Status (Polling)

**Request:**
```http
GET /api/v1/tasks/{task_id}/status/
```

**Response (Processing):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "progress": 45,
  "message": "Generating image...",
  "updated_at": "2025-10-27T10:30:15Z"
}
```

**Response (Success):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS",
  "progress": 100,
  "result_url": "/api/v1/tasks/{task_id}/result/",
  "completed_at": "2025-10-27T10:30:30Z"
}
```

**Response (Failed):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "FAILURE",
  "error": "Out of memory",
  "failed_at": "2025-10-27T10:30:20Z"
}
```

### 3. Get Result

**Request:**
```http
GET /api/v1/tasks/{task_id}/result/
```

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS",
  "result": {
    "image_url": "https://example.com/media/results/image_123.png",
    "prompt_used": "beautiful sunset over mountains, highly detailed, 8k",
    "processing_time": 25.5,
    "metadata": {
      "model": "stable-diffusion-v1.5",
      "seed": 42,
      "steps": 30
    }
  }
}
```

---

## 🗄️ Database Models

### Task Model

```python
# apps/tasks/models.py

from django.db import models
import uuid

class AITask(models.Model):
    """Track AI processing tasks"""
    
    TASK_TYPES = (
        ('image_generation', 'Image Generation'),
        ('face_swap', 'Face Swap'),
        ('background_removal', 'Background Removal'),
        ('style_transfer', 'Style Transfer'),
        ('image_enhancement', 'Image Enhancement'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILURE', 'Failure'),
        ('RETRY', 'Retry'),
    )
    
    # Identity
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    celery_task_id = models.CharField(max_length=255, unique=True, null=True)
    
    # Task info
    task_type = models.CharField(max_length=50, choices=TASK_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Input
    prompt = models.TextField()
    input_image = models.ImageField(upload_to='tasks/input/%Y/%m/%d/', null=True, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    
    # Output
    result_image = models.ImageField(upload_to='tasks/output/%Y/%m/%d/', null=True, blank=True)
    result_data = models.JSONField(null=True, blank=True)
    
    # Progress
    progress = models.IntegerField(default=0)  # 0-100
    
    # Error handling
    error_message = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    processing_time = models.FloatField(null=True, blank=True)  # seconds
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['celery_task_id']),
        ]
    
    def __str__(self):
        return f"{self.task_type} - {self.status} ({self.id})"
```

---

## ⚙️ Celery Configuration

### Settings

```python
# backendAI/settings.py

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Task settings
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True

# Task time limits
CELERY_TASK_TIME_LIMIT = 600  # 10 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 540  # 9 minutes

# Task retry
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True

# Result backend
CELERY_RESULT_EXPIRES = 3600  # 1 hour

# Worker
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 100

# Routes
CELERY_TASK_ROUTES = {
    'apps.tasks.tasks.process_image_generation': {'queue': 'gpu'},
    'apps.tasks.tasks.process_face_swap': {'queue': 'gpu'},
    'apps.tasks.tasks.process_background_removal': {'queue': 'cpu'},
}
```

### Celery App

```python
# backendAI/celery.py

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')

app = Celery('backendAI')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
```

```python
# backendAI/__init__.py

from .celery import app as celery_app

__all__ = ('celery_app',)
```

---

## 🔧 Celery Tasks

### Main Task Handler

```python
# apps/tasks/tasks.py

from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.files.base import ContentFile
from .models import AITask
import time

logger = get_task_logger(__name__)


@shared_task(bind=True, max_retries=3)
def process_ai_task(self, task_id):
    """
    Main task processor that routes to specific AI services
    
    Args:
        task_id: UUID of AITask
    """
    try:
        # Get task
        task = AITask.objects.get(id=task_id)
        task.celery_task_id = self.request.id
        task.status = 'PROCESSING'
        task.started_at = timezone.now()
        task.save()
        
        logger.info(f"Processing task {task_id} - Type: {task.task_type}")
        
        # Route to appropriate service
        if task.task_type == 'image_generation':
            result = process_image_generation(task)
        elif task.task_type == 'face_swap':
            result = process_face_swap(task)
        elif task.task_type == 'background_removal':
            result = process_background_removal(task)
        else:
            raise ValueError(f"Unknown task type: {task.task_type}")
        
        # Save result
        task.status = 'SUCCESS'
        task.progress = 100
        task.result_data = result
        task.completed_at = timezone.now()
        task.processing_time = (task.completed_at - task.started_at).total_seconds()
        task.save()
        
        logger.info(f"Task {task_id} completed successfully")
        return {'status': 'success', 'task_id': str(task_id)}
        
    except Exception as exc:
        logger.error(f"Task {task_id} failed: {str(exc)}")
        
        # Update task status
        task = AITask.objects.get(id=task_id)
        task.status = 'FAILURE'
        task.error_message = str(exc)
        task.save()
        
        # Retry logic
        if task.retry_count < task.max_retries:
            task.retry_count += 1
            task.status = 'RETRY'
            task.save()
            
            # Exponential backoff: 60s, 120s, 240s
            countdown = 60 * (2 ** task.retry_count)
            raise self.retry(exc=exc, countdown=countdown)
        
        raise


def process_image_generation(task):
    """Process image generation task"""
    from apps.image_generation.service import get_service
    
    # Update progress
    task.progress = 10
    task.save()
    
    # Refine prompt
    from apps.prompt_refinement.service import get_service as get_prompt_service
    prompt_service = get_prompt_service()
    refined_result = prompt_service.refine_prompt(task.prompt)
    
    task.progress = 30
    task.save()
    
    # Generate image
    service = get_service()
    params = task.parameters or {}
    result = service.generate_image(
        prompt=refined_result['refined_prompt'],
        negative_prompt=refined_result.get('negative_prompt', ''),
        width=params.get('width', 512),
        height=params.get('height', 512),
        num_inference_steps=params.get('num_inference_steps', 30),
        guidance_scale=params.get('guidance_scale', 7.5),
    )
    
    task.progress = 90
    task.save()
    
    # Save image
    if result['success'] and result.get('image_bytes'):
        image_file = ContentFile(result['image_bytes'])
        task.result_image.save(f"{task.id}.png", image_file)
    
    return {
        'image_url': task.result_image.url if task.result_image else None,
        'prompt_used': refined_result['refined_prompt'],
        'metadata': result.get('metadata', {})
    }


def process_face_swap(task):
    """Process face swap task"""
    from apps.face_swap.services import FaceSwapService
    
    service = FaceSwapService()
    
    # Read input image
    input_image_path = task.input_image.path
    
    task.progress = 25
    task.save()
    
    # Process (mock for now)
    result_image_path = service.swap_faces(
        source_image=input_image_path,
        target_image=input_image_path,  # Should be from params
        blend_ratio=task.parameters.get('blend_ratio', 0.8)
    )
    
    task.progress = 90
    task.save()
    
    # Save result
    with open(result_image_path, 'rb') as f:
        task.result_image.save(f"{task.id}.png", ContentFile(f.read()))
    
    return {
        'image_url': task.result_image.url,
        'processing_details': 'Face swap completed'
    }


def process_background_removal(task):
    """Process background removal task"""
    from apps.background_removal.services import BackgroundRemovalService
    
    service = BackgroundRemovalService()
    
    input_image_path = task.input_image.path
    
    task.progress = 40
    task.save()
    
    # Remove background
    result_image_path = service.remove_background(
        image_path=input_image_path,
        return_mask=task.parameters.get('return_mask', False)
    )
    
    task.progress = 90
    task.save()
    
    # Save result
    with open(result_image_path, 'rb') as f:
        task.result_image.save(f"{task.id}.png", ContentFile(f.read()))
    
    return {
        'image_url': task.result_image.url,
        'processing_details': 'Background removed'
    }
```

---

## 📡 API Endpoints

### Views

```python
# apps/tasks/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AITask
from .tasks import process_ai_task
from .serializers import (
    TaskCreateSerializer,
    TaskStatusSerializer,
    TaskResultSerializer
)


class TaskCreateView(APIView):
    """Create new AI task"""
    
    def post(self, request):
        """
        POST /api/v1/tasks/create/
        
        Body (multipart/form-data):
        - prompt: str (required)
        - task_type: str (required)
        - image: file (optional)
        - parameters: json (optional)
        """
        serializer = TaskCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid input', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create task
        task = serializer.save()
        
        # Queue Celery task
        process_ai_task.delay(str(task.id))
        
        return Response({
            'task_id': str(task.id),
            'status': task.status,
            'message': 'Task queued successfully',
            'created_at': task.created_at
        }, status=status.HTTP_201_CREATED)


class TaskStatusView(APIView):
    """Get task status"""
    
    def get(self, request, task_id):
        """GET /api/v1/tasks/{task_id}/status/"""
        try:
            task = AITask.objects.get(id=task_id)
            serializer = TaskStatusSerializer(task)
            return Response(serializer.data)
        except AITask.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TaskResultView(APIView):
    """Get task result"""
    
    def get(self, request, task_id):
        """GET /api/v1/tasks/{task_id}/result/"""
        try:
            task = AITask.objects.get(id=task_id)
            
            if task.status != 'SUCCESS':
                return Response(
                    {'error': f'Task not completed. Status: {task.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = TaskResultSerializer(task)
            return Response(serializer.data)
        except AITask.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TaskCancelView(APIView):
    """Cancel running task"""
    
    def post(self, request, task_id):
        """POST /api/v1/tasks/{task_id}/cancel/"""
        try:
            task = AITask.objects.get(id=task_id)
            
            if task.status in ['SUCCESS', 'FAILURE']:
                return Response(
                    {'error': 'Task already completed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Revoke Celery task
            from celery import current_app
            if task.celery_task_id:
                current_app.control.revoke(task.celery_task_id, terminate=True)
            
            task.status = 'FAILURE'
            task.error_message = 'Cancelled by user'
            task.save()
            
            return Response({'message': 'Task cancelled'})
        except AITask.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
```

### URLs

```python
# apps/tasks/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.TaskCreateView.as_view(), name='task-create'),
    path('<uuid:task_id>/status/', views.TaskStatusView.as_view(), name='task-status'),
    path('<uuid:task_id>/result/', views.TaskResultView.as_view(), name='task-result'),
    path('<uuid:task_id>/cancel/', views.TaskCancelView.as_view(), name='task-cancel'),
]
```

```python
# backendAI/urls.py

urlpatterns = [
    # ...
    path('api/v1/tasks/', include('apps.tasks.urls')),
]
```

---

## 🔧 Serializers

```python
# apps/tasks/serializers.py

from rest_framework import serializers
from .models import AITask


class TaskCreateSerializer(serializers.Serializer):
    """Create task request"""
    
    prompt = serializers.CharField(required=True, max_length=5000)
    task_type = serializers.ChoiceField(
        choices=['image_generation', 'face_swap', 'background_removal', 
                 'style_transfer', 'image_enhancement']
    )
    image = serializers.ImageField(required=False, allow_null=True)
    parameters = serializers.JSONField(required=False, default=dict)
    
    def create(self, validated_data):
        return AITask.objects.create(**validated_data)


class TaskStatusSerializer(serializers.ModelSerializer):
    """Task status response"""
    
    class Meta:
        model = AITask
        fields = [
            'id', 'task_type', 'status', 'progress',
            'created_at', 'started_at', 'completed_at',
            'processing_time', 'error_message'
        ]


class TaskResultSerializer(serializers.ModelSerializer):
    """Task result response"""
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AITask
        fields = [
            'id', 'task_type', 'status', 'prompt',
            'image_url', 'result_data', 'processing_time',
            'completed_at'
        ]
    
    def get_image_url(self, obj):
        if obj.result_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.result_image.url)
            return obj.result_image.url
        return None
```

---

## 🐳 Docker Setup

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: backendai_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Django Web Server
  web:
    build: .
    command: gunicorn backendAI.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - .:/app
      - media_files:/app/media
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/backendai_db
    depends_on:
      - db
      - redis

  # Celery Worker (CPU tasks)
  celery_worker_cpu:
    build: .
    command: celery -A backendAI worker -Q cpu --loglevel=info --concurrency=4
    volumes:
      - .:/app
      - media_files:/app/media
    env_file:
      - .env
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis
      - db

  # Celery Worker (GPU tasks)
  celery_worker_gpu:
    build: .
    command: celery -A backendAI worker -Q gpu --loglevel=info --concurrency=2
    volumes:
      - .:/app
      - media_files:/app/media
    env_file:
      - .env
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis
      - db
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Celery Beat (Scheduled tasks)
  celery_beat:
    build: .
    command: celery -A backendAI beat --loglevel=info
    volumes:
      - .:/app
    env_file:
      - .env
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis

  # Flower (Celery monitoring)
  flower:
    build: .
    command: celery -A backendAI flower --port=5555
    ports:
      - "5555:5555"
    env_file:
      - .env
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis
      - celery_worker_cpu
      - celery_worker_gpu

volumes:
  postgres_data:
  redis_data:
  media_files:
```

---

## 📦 Requirements

```txt
# requirements.txt

Django==5.1.4
djangorestframework==3.15.2
django-cors-headers==4.5.0
django-filter==24.3

# Database
psycopg2-binary==2.9.9

# Celery
celery==5.4.0
redis==5.0.1
flower==2.0.1

# Image processing
Pillow==10.4.0
opencv-python==4.10.0.84

# AI/ML
torch==2.1.0
diffusers==0.24.0
transformers==4.35.0

# Utils
python-dotenv==1.0.0
gunicorn==21.2.0
```

---

## 🚀 Running the System

### Local Development

```bash
# 1. Start Redis
redis-server

# 2. Run Django
python manage.py runserver

# 3. Run Celery Worker (CPU)
celery -A backendAI worker -Q cpu --loglevel=info

# 4. Run Celery Worker (GPU)
celery -A backendAI worker -Q gpu --loglevel=info

# 5. Run Flower (monitoring)
celery -A backendAI flower
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f celery_worker_cpu
docker-compose logs -f celery_worker_gpu

# Scale workers
docker-compose up -d --scale celery_worker_cpu=4 --scale celery_worker_gpu=2

# Stop all
docker-compose down
```

---

## 📊 Monitoring

### Flower Dashboard

Access at: `http://localhost:5555`

Features:
- ✅ Active tasks
- ✅ Worker status
- ✅ Task history
- ✅ Task statistics
- ✅ Worker pools

### Redis CLI

```bash
# Connect to Redis
redis-cli

# Check queue size
LLEN celery

# View keys
KEYS celery*

# Monitor commands
MONITOR
```

---

## 🎯 Frontend Integration Example

```javascript
// React/Vue/Angular example

async function submitAITask(prompt, image, taskType) {
  // 1. Create task
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('task_type', taskType);
  if (image) {
    formData.append('image', image);
  }
  
  const createResponse = await fetch('/api/v1/tasks/create/', {
    method: 'POST',
    body: formData
  });
  
  const { task_id } = await createResponse.json();
  console.log('Task created:', task_id);
  
  // 2. Poll for status
  return pollTaskStatus(task_id);
}

async function pollTaskStatus(taskId) {
  const maxAttempts = 60; // 5 minutes with 5s interval
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    const response = await fetch(`/api/v1/tasks/${taskId}/status/`);
    const data = await response.json();
    
    console.log(`Status: ${data.status}, Progress: ${data.progress}%`);
    
    if (data.status === 'SUCCESS') {
      // Get result
      const resultResponse = await fetch(`/api/v1/tasks/${taskId}/result/`);
      return await resultResponse.json();
    }
    
    if (data.status === 'FAILURE') {
      throw new Error(data.error_message);
    }
    
    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempt++;
  }
  
  throw new Error('Task timeout');
}

// Usage
try {
  const result = await submitAITask(
    'beautiful sunset over mountains',
    imageFile,
    'image_generation'
  );
  
  console.log('Result:', result);
  document.getElementById('result-image').src = result.result.image_url;
} catch (error) {
  console.error('Error:', error);
}
```

---

## 📈 Performance & Scaling

### Recommended Configuration

**Small Scale (1-10 concurrent users):**
- 1 Web server
- 2 CPU workers
- 1 GPU worker
- 1 Redis instance

**Medium Scale (10-100 concurrent users):**
- 2-3 Web servers (load balanced)
- 4-6 CPU workers
- 2-3 GPU workers
- 1 Redis instance (with persistence)

**Large Scale (100+ concurrent users):**
- 5+ Web servers (load balanced)
- 10+ CPU workers
- 5+ GPU workers
- Redis Cluster
- PostgreSQL with read replicas

---

**Architecture hoàn chỉnh với Celery + Redis! 🚀**
