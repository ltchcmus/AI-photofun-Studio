# Backend AI with Celery + Redis (NO DATABASE)

## 🎯 Architecture Overview

**Simplified stateless architecture:**
- ✅ Redis: Task queue + Result storage
- ✅ Celery: Async task processing
- ❌ No SQL database needed
- ❌ No models, no migrations

---

## 🏗️ Simple Architecture

```
Frontend → Django API → Redis Queue → Celery Workers → AI Services
                          ↓
                     Store results in Redis
                     (Auto-expire after 1 hour)
                          ↓
Frontend polls → Django API → Get from Redis
```

---

## ⚙️ Setup

### 1. Install Dependencies

```bash
pip install celery redis
```

### 2. Celery Configuration

```python
# backendAI/celery.py

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')

app = Celery('backendAI')

# Redis config
app.conf.update(
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    result_expires=3600,  # Results expire after 1 hour
)

app.autodiscover_tasks()
```

```python
# backendAI/__init__.py
from .celery import app as celery_app

__all__ = ('celery_app',)
```

---

## 📝 Task Definition

```python
# apps/ai_tasks/tasks.py

from celery import shared_task
from celery.utils.log import get_task_logger
import time
import base64

logger = get_task_logger(__name__)


@shared_task(bind=True, name='process_image_generation')
def process_image_generation(self, prompt, parameters=None):
    """
    Generate image from prompt
    
    Args:
        prompt: Text prompt
        parameters: Dict with width, height, etc.
    
    Returns:
        Dict with image_data (base64) and metadata
    """
    try:
        logger.info(f"Task {self.request.id}: Generating image for prompt: {prompt}")
        
        # Update progress
        self.update_state(state='PROCESSING', meta={'progress': 10})
        
        # 1. Refine prompt
        from apps.prompt_refinement.service import get_service as get_prompt_service
        prompt_service = get_prompt_service()
        refined = prompt_service.refine_prompt(prompt)
        
        self.update_state(state='PROCESSING', meta={'progress': 30})
        
        # 2. Generate image
        from apps.image_generation.service import get_service as get_image_service
        image_service = get_image_service()
        
        params = parameters or {}
        result = image_service.generate_image(
            prompt=refined['refined_prompt'],
            negative_prompt=refined.get('negative_prompt', ''),
            width=params.get('width', 512),
            height=params.get('height', 512),
            num_inference_steps=params.get('steps', 30),
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90})
        
        # 3. Encode image to base64
        if result['success'] and result.get('image_bytes'):
            image_b64 = base64.b64encode(result['image_bytes']).decode('utf-8')
        else:
            raise Exception("Image generation failed")
        
        logger.info(f"Task {self.request.id}: Completed successfully")
        
        return {
            'status': 'SUCCESS',
            'image_data': image_b64,
            'prompt_used': refined['refined_prompt'],
            'metadata': result.get('metadata', {})
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed with error: {str(exc)}")
        self.update_state(state='FAILURE', meta={'error': str(exc)})
        raise


@shared_task(bind=True, name='process_face_swap')
def process_face_swap(self, source_image_b64, target_image_b64, parameters=None):
    """Face swap task"""
    try:
        logger.info(f"Task {self.request.id}: Processing face swap")
        
        self.update_state(state='PROCESSING', meta={'progress': 20})
        
        # Decode images
        import base64
        from io import BytesIO
        source_bytes = base64.b64decode(source_image_b64)
        target_bytes = base64.b64decode(target_image_b64)
        
        self.update_state(state='PROCESSING', meta={'progress': 50})
        
        # Process (mock for now)
        time.sleep(2)  # Simulate processing
        
        self.update_state(state='PROCESSING', meta={'progress': 90})
        
        # Return result (using source image as placeholder)
        result_b64 = source_image_b64
        
        return {
            'status': 'SUCCESS',
            'image_data': result_b64,
            'metadata': {'processing': 'face_swap_completed'}
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed: {str(exc)}")
        self.update_state(state='FAILURE', meta={'error': str(exc)})
        raise


@shared_task(bind=True, name='process_background_removal')
def process_background_removal(self, image_b64, parameters=None):
    """Background removal task"""
    try:
        logger.info(f"Task {self.request.id}: Removing background")
        
        self.update_state(state='PROCESSING', meta={'progress': 30})
        
        # Decode image
        import base64
        image_bytes = base64.b64decode(image_b64)
        
        self.update_state(state='PROCESSING', meta={'progress': 60})
        
        # Process (mock for now)
        time.sleep(2)
        
        self.update_state(state='PROCESSING', meta={'progress': 90})
        
        # Return result
        result_b64 = image_b64  # Placeholder
        
        return {
            'status': 'SUCCESS',
            'image_data': result_b64,
            'metadata': {'processing': 'background_removed'}
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed: {str(exc)}")
        self.update_state(state='FAILURE', meta={'error': str(exc)})
        raise
```

---

## 📡 API Views (No Database)

```python
# apps/ai_tasks/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from celery.result import AsyncResult
from .tasks import (
    process_image_generation,
    process_face_swap,
    process_background_removal
)
import base64


class TaskSubmitView(APIView):
    """Submit new task"""
    
    def post(self, request):
        """
        POST /api/v1/tasks/submit/
        
        Body:
        {
            "task_type": "image_generation",
            "prompt": "beautiful sunset",
            "image": "<base64_encoded_image>",  // optional
            "parameters": {"width": 512, "height": 512}
        }
        """
        task_type = request.data.get('task_type')
        
        if not task_type:
            return Response(
                {'error': 'task_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Route to appropriate task
        if task_type == 'image_generation':
            prompt = request.data.get('prompt')
            if not prompt:
                return Response(
                    {'error': 'prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            parameters = request.data.get('parameters', {})
            task = process_image_generation.delay(prompt, parameters)
        
        elif task_type == 'face_swap':
            source_image = request.data.get('source_image')
            target_image = request.data.get('target_image')
            
            if not source_image or not target_image:
                return Response(
                    {'error': 'source_image and target_image are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            parameters = request.data.get('parameters', {})
            task = process_face_swap.delay(source_image, target_image, parameters)
        
        elif task_type == 'background_removal':
            image = request.data.get('image')
            if not image:
                return Response(
                    {'error': 'image is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            parameters = request.data.get('parameters', {})
            task = process_background_removal.delay(image, parameters)
        
        else:
            return Response(
                {'error': f'Unknown task_type: {task_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'task_id': task.id,
            'status': 'PENDING',
            'message': 'Task submitted successfully'
        }, status=status.HTTP_202_ACCEPTED)


class TaskStatusView(APIView):
    """Check task status"""
    
    def get(self, request, task_id):
        """
        GET /api/v1/tasks/{task_id}/status/
        """
        result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': result.state,
        }
        
        if result.state == 'PENDING':
            response_data['message'] = 'Task is waiting in queue'
        
        elif result.state == 'PROCESSING':
            # Get progress from task meta
            response_data['progress'] = result.info.get('progress', 0)
            response_data['message'] = 'Task is processing'
        
        elif result.state == 'SUCCESS':
            response_data['message'] = 'Task completed successfully'
            response_data['result_available'] = True
        
        elif result.state == 'FAILURE':
            response_data['error'] = str(result.info)
            response_data['message'] = 'Task failed'
        
        return Response(response_data)


class TaskResultView(APIView):
    """Get task result"""
    
    def get(self, request, task_id):
        """
        GET /api/v1/tasks/{task_id}/result/
        """
        result = AsyncResult(task_id)
        
        if result.state == 'SUCCESS':
            return Response({
                'task_id': task_id,
                'status': 'SUCCESS',
                'result': result.result
            })
        
        elif result.state == 'FAILURE':
            return Response({
                'task_id': task_id,
                'status': 'FAILURE',
                'error': str(result.info)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            return Response({
                'task_id': task_id,
                'status': result.state,
                'message': 'Task not completed yet'
            }, status=status.HTTP_202_ACCEPTED)


class TaskCancelView(APIView):
    """Cancel task"""
    
    def post(self, request, task_id):
        """
        POST /api/v1/tasks/{task_id}/cancel/
        """
        result = AsyncResult(task_id)
        
        if result.state in ['SUCCESS', 'FAILURE']:
            return Response({
                'message': 'Task already completed, cannot cancel'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Revoke task
        result.revoke(terminate=True)
        
        return Response({
            'task_id': task_id,
            'message': 'Task cancelled successfully'
        })
```

---

## 🔗 URLs

```python
# apps/ai_tasks/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('submit/', views.TaskSubmitView.as_view(), name='task-submit'),
    path('<str:task_id>/status/', views.TaskStatusView.as_view(), name='task-status'),
    path('<str:task_id>/result/', views.TaskResultView.as_view(), name='task-result'),
    path('<str:task_id>/cancel/', views.TaskCancelView.as_view(), name='task-cancel'),
]
```

```python
# backendAI/urls.py

urlpatterns = [
    # ...
    path('api/v1/tasks/', include('apps.ai_tasks.urls')),
]
```

---

## 🚀 Running

### 1. Start Redis

```bash
# Ubuntu/Debian
sudo apt install redis
redis-server

# macOS
brew install redis
redis-server

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Start Django

```bash
python manage.py runserver
```

### 3. Start Celery Worker

```bash
# Single worker
celery -A backendAI worker --loglevel=info

# Multiple workers
celery -A backendAI worker --loglevel=info --concurrency=4
```

### 4. (Optional) Start Flower for monitoring

```bash
pip install flower
celery -A backendAI flower
# Access at http://localhost:5555
```

---

## 🧪 Testing

### Test với curl

```bash
# 1. Submit task
curl -X POST http://localhost:8000/api/v1/tasks/submit/ \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "image_generation",
    "prompt": "beautiful sunset over mountains",
    "parameters": {"width": 512, "height": 512}
  }'

# Response: {"task_id": "abc-123", "status": "PENDING"}

# 2. Check status
curl http://localhost:8000/api/v1/tasks/abc-123/status/

# Response: {"task_id": "abc-123", "status": "PROCESSING", "progress": 50}

# 3. Get result (when done)
curl http://localhost:8000/api/v1/tasks/abc-123/result/

# Response: {"task_id": "abc-123", "status": "SUCCESS", "result": {...}}
```

### Test với Python

```python
import requests
import time

# Submit task
response = requests.post('http://localhost:8000/api/v1/tasks/submit/', json={
    'task_type': 'image_generation',
    'prompt': 'beautiful sunset',
    'parameters': {'width': 512, 'height': 512}
})

task_id = response.json()['task_id']
print(f"Task submitted: {task_id}")

# Poll for status
while True:
    status_response = requests.get(f'http://localhost:8000/api/v1/tasks/{task_id}/status/')
    data = status_response.json()
    
    print(f"Status: {data['status']}, Progress: {data.get('progress', 0)}%")
    
    if data['status'] == 'SUCCESS':
        # Get result
        result_response = requests.get(f'http://localhost:8000/api/v1/tasks/{task_id}/result/')
        result = result_response.json()
        
        print("Result:", result['result'])
        break
    
    elif data['status'] == 'FAILURE':
        print("Task failed:", data.get('error'))
        break
    
    time.sleep(2)
```

---

## 🐳 Docker Compose (Simple)

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis

  celery_worker:
    build: .
    command: celery -A backendAI worker --loglevel=info
    volumes:
      - .:/app
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis

  flower:
    build: .
    command: celery -A backendAI flower
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis
```

---

## ✅ Advantages

- ✅ **No SQL Database**: Không cần PostgreSQL, MySQL, SQLite
- ✅ **Simple Setup**: Chỉ cần Redis
- ✅ **Stateless**: Hoàn toàn stateless
- ✅ **Fast**: Redis rất nhanh
- ✅ **Auto Cleanup**: Results tự động expire sau 1 giờ

## ⚠️ Limitations

- ❌ **No History**: Không lưu lịch sử tasks lâu dài
- ❌ **No Analytics**: Không thể query/analyze tasks
- ❌ **Result Expires**: Kết quả tự động xóa sau 1 giờ

---

## 📊 When to Use SQL

Nếu bạn cần:
- ✅ Lưu lịch sử tasks lâu dài
- ✅ Analytics và reporting
- ✅ User task history
- ✅ Billing/payment tracking

→ Thì nên dùng **Option 2: Redis + SQLite**

Nhưng cho **MVP/simple use case** → **Redis only** là đủ!

---

**Không cần SQL, chỉ cần Redis! 🚀**
