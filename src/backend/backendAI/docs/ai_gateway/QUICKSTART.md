# AI Gateway - Quick Start Guide

## 🚀 Setup in 5 Minutes

### 1. Install Dependencies

```bash
cd src/backend/backendAI
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 4. Start Development Server

```bash
python manage.py runserver
```

Server will start at: `http://localhost:8000`

---

## 🎯 Test Your First Request

### Open your terminal or use Postman:

```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a beautiful sunset over mountains"
  }'
```

### Expected Response:

```json
{
  "session_id": "abc-123-def",
  "message_id": "msg-456",
  "message": "I've generated your sunset image!",
  "type": "image",
  "data": {
    "image_url": "/media/generated/sunset_789.png",
    "prompt": "beautiful sunset over mountains, detailed, cinematic, high quality",
    "metadata": {
      "width": 1024,
      "height": 768,
      "generation_time": 10.5
    }
  },
  "suggestions": [
    "Generate variations of this image",
    "Change the time of day",
    "Add more details"
  ]
}
```

---

## 📝 All Available Endpoints

### 1. Chat (Main Endpoint)
```bash
POST /api/v1/ai-gateway/chat/
```

**Send text prompt:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a cyberpunk city"}'
```

**Upload image for processing:**
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -F "message=Remove background from this image" \
  -F "image=@myimage.jpg"
```

### 2. List Sessions
```bash
GET /api/v1/ai-gateway/sessions/

curl http://localhost:8000/api/v1/ai-gateway/sessions/
```

### 3. Get Session Details
```bash
GET /api/v1/ai-gateway/sessions/{session_id}/

curl http://localhost:8000/api/v1/ai-gateway/sessions/abc-123/
```

### 4. Delete Session
```bash
DELETE /api/v1/ai-gateway/sessions/{session_id}/

curl -X DELETE http://localhost:8000/api/v1/ai-gateway/sessions/abc-123/
```

### 5. Get Capabilities
```bash
GET /api/v1/ai-gateway/capabilities/

curl http://localhost:8000/api/v1/ai-gateway/capabilities/
```

---

## 🎨 Example Use Cases

### Use Case 1: Generate Fantasy Art
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a fantasy dragon flying over a medieval castle"
  }'
```

### Use Case 2: Remove Background
```bash
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -F "message=Remove the background" \
  -F "image=@portrait.jpg"
```

### Use Case 3: Continue Conversation
```bash
# First message
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a cat portrait"}'

# Response includes: "session_id": "session-abc-123"

# Second message (continuing conversation)
curl -X POST http://localhost:8000/api/v1/ai-gateway/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Make it more colorful",
    "session_id": "session-abc-123"
  }'
```

---

## 🌐 API Documentation

Once the server is running, visit:

- **Swagger UI:** http://localhost:8000/swagger/
- **ReDoc:** http://localhost:8000/redoc/
- **Admin Panel:** http://localhost:8000/admin/

---

## 🧪 Frontend Integration (React Example)

```javascript
// ChatComponent.jsx
import { useState } from 'react';

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  
  const sendMessage = async () => {
    const formData = new FormData();
    formData.append('message', input);
    if (sessionId) formData.append('session_id', sessionId);
    
    const response = await fetch('http://localhost:8000/api/v1/ai-gateway/chat/', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    // Save session ID
    if (!sessionId) setSessionId(data.session_id);
    
    // Add messages
    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: data.message, data: data.data, type: data.type }
    ]);
    
    setInput('');
  };
  
  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.type === 'image' && (
              <img src={msg.data.image_url} alt="Generated" />
            )}
          </div>
        ))}
      </div>
      
      <div className="input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatComponent;
```

---

## 💡 Tips

### 1. Writing Good Prompts
- ✅ **Good:** "Create a portrait of a woman with red hair, detailed, professional lighting"
- ❌ **Bad:** "woman"

### 2. Using Negative Prompts
```json
{
  "message": "Create a landscape, no people, no buildings"
}
```
AI Gateway automatically extracts:
- **Positive:** "Create a landscape"
- **Negative:** "people, buildings"

### 3. Session Management
- Sessions auto-expire after 24 hours
- Always include `session_id` for context-aware responses
- Delete old sessions to free up storage

### 4. Image Upload Requirements
- Max file size: 10MB
- Supported formats: JPG, PNG, WebP
- Required for: face swap, background removal, image editing

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` file:
```bash
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379/0
```

### Settings Customization

Edit `backendAI/settings.py`:

```python
# AI Model Configurations
AI_MODEL_CONFIGS = {
    'stable_diffusion': {
        'model_path': 'models/stable-diffusion-v1-5',
        'device': 'cuda',  # or 'cpu'
        'dtype': 'float16',
    },
    'image_generation': {
        'default_width': 1024,
        'default_height': 768,
        'default_steps': 50,
        'max_steps': 100,
    }
}
```

---

## 🐛 Troubleshooting

### Error: "Module not found"
```bash
pip install -r requirements.txt
```

### Error: "No such table"
```bash
python manage.py migrate
```

### Error: "CSRF verification failed"
Add CORS headers:
```javascript
fetch('/api/v1/ai-gateway/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({...})
})
```

### Slow Response Times
- Use GPU for image generation
- Enable Redis caching
- Preload AI models on startup

---

## 📚 Next Steps

1. **Read Full Documentation:** `apps/ai_gateway/README.md`
2. **API Reference:** `apps/ai_gateway/API_DOCUMENTATION.md`
3. **Integrate AI Models:** Replace placeholder services with actual models
4. **Frontend Integration:** Connect your React/Vue/Angular app
5. **Deploy:** Use Docker, configure production settings

---

## 🎉 You're Ready!

The AI Gateway is now running and ready to process requests. Start building your AI-powered photo studio! 🚀

For questions or issues, check the full documentation or enable DEBUG mode for detailed error messages.
