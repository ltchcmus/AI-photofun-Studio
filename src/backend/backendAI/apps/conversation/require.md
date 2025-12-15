📄 AI PhotoFun Studio - Conversation & Prompt/Image Services Design
🎯 Goal

Hoàn thiện hệ thống Conversation service và thiết kế thêm 2 service mới:

Prompt Service – refine prompt, phân tích intent, tách thành service riêng. Kết nối với API Gemini.

Image Generation Service (mock) – nhận prompt đã refine → mock generate → trả về base64 + metadata.

Tích hợp Media Service đã có (upload ảnh, trả về image_url).

📌 Tổng quan Kiến trúc
graph LR
A[Conversation API] --> B[Prompt Service]
B -->|Refined Prompt + Intent| A
A --> C[Image Gen Service]
C -->|Base64 Image| D[Media Service]
D -->|image_url| A
A --> MongoDB

🧱 Conversation Service (hiện có)

Chức năng chính: quản lý session, messages, gọi các external services.

Đang sử dụng: MongoDB, httpx, Django View, Async, MessageSerializer.

Cần cải thiện:

✔️ Thêm xử lý intent sau khi user gửi message
✔️ Chuyển logic Prompt & Image sang celery task async (không xử lý trực tiếp trong HTTP request)
✔️ Thêm các trường intent, request_id, image_url, status vào message.

🆕 Prompt Service (new app)
🎯 Mục tiêu

Nhận đầu vào từ conversation: topic, style, lang, raw_prompt, image_url.

Gọi Google Gemini API để:

Refine/nâng cấp prompt

Phân tích intent (generateImage, styleTransfer, editBackground, …)

Tách keywords (optional)

🛠 Output JSON chuẩn:
{
  "refined_prompt": "ultra realistic portrait of a cat wearing glasses, 8k, studio light",
  "intent": "generateImage",
  "keywords": ["cat", "glasses", "portrait", "photo"],
  "metadata": {
    "model": "Gemini 1.5 Flash",
    "processing_time": 1.25
  }
}

📁 Gợi ý cấu trúc apps/prompt:
prompt_service/
 ├── views.py
 ├── services.py
 ├── serializers.py
 ├── urls.py
 └── celery.py

✨ API mẫu:

POST /v1/prompt/refine

{
  "prompt": "I want a cute girl on the beach",
  "style": "anime",
  "lang": "en",
  "topic": "girl beach"
}


Response
(API Gemini xử lý trong background Celery cũng được)

{
  "refined_prompt": "cute anime girl standing at beach, golden sunset, soft lighting",
  "intent": "generateImage"
}

🆕 Image Generation Service (mock version)
🎯 Mục tiêu

Nhận refined_prompt

Mô phỏng sinh ảnh (trả về base64 hoặc URL mock).

Sau này sẽ tích hợp real model (Stable Diffusion, Midjourney API, etc).

Sau khi generate → gửi ảnh sang Media Service.

📁 Cấu trúc gợi ý:
image_service/
 ├── views.py
 ├── serializers.py
 ├── services.py
 ├── urls.py
 └── celery.py

🧪 Mock API sample

POST /v1/image/generate

{
  "refined_prompt": "ultra realistic cat with sunglasses, studio light"
}


Response

{
  "request_id": "89adq-9102-faka1",
  "image_base64": "<mocked_base64_string>",
  "metadata": {
    "processing_time": 1.7,
    "model": "MockGenerator v1",
    "size": "1024x1024"
  }
}

📦 Media Service (đã có)

Dùng để upload ảnh sinh ra từ image-service.

API: POST /api/v1/file/uploads
Trả về:

{
  "file_url": "https://media-service/files/a123.jpg"
}

⚙️ Celery Integration (cho cả Prompt & Image)
Cấu trúc Celery Task:
from celery import shared_task
import httpx

@shared_task
def process_prompt_task(payload):
    # Call Gemini API
    pass

@shared_task
def generate_image_task(refined_prompt):
    # Call mock image gen OR real API
    pass


Từ conversation service:

task_id = generate_image_task.delay(refined_prompt)

🎯 Conversation Service – version mới phải hỗ trợ:
Field	Type	Source
intent	string	Prompt service
refined_prompt	string	Prompt service
image_base64 or image_url	string	Image/Media service
status	enum (PROCESSING, DONE)	Celery task
request_id	string	Celery task.id
📄 Suggested Docs Section titles

Overall Architecture

Conversation API Responsibilities

Prompt Service Design & Integration

Intent Detection Flow

Image Generation Mock Service

Media Service Usage

Celery Task Workflow

API Contracts and Data Schemas

Future Enhancements (Stable Diffusion, Real Image Model)

✍️ Notes for Copilot

Generate Django apps with minimal API endpoints (POST JSON)

Allow async calls using httpx.AsyncClient

Use .env for external URLs: PROMPT_SERVICE_URL, IMAGE_SERVICE_URL, MEDIA_SERVICE_URL

Add Celery for heavy tasks (prompt call, image gen)

Return minimal, consistent JSON format across services