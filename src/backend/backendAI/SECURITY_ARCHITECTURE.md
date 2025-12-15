# Security Architecture Overview

## 3 Layers of Protection

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT REQUEST                             │
│                    POST /v1/features/image-generation/              │
│                    {"prompt": "sunset", "user_id": "user123"}       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: MIDDLEWARE PROTECTION                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  1. RateLimitMiddleware                                 │      │
│  │     • Check Redis: Has IP made request in last 1 sec?   │      │
│  │     • If YES → Return 429 Too Many Requests             │      │
│  │     • If NO → Increment counter, continue               │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  2. InputSanitizationMiddleware                         │      │
│  │     • Scan prompt for dangerous patterns:               │      │
│  │       - MongoDB operators: $where, $regex               │      │
│  │       - XSS: <script>, javascript:                      │      │
│  │       - Path traversal: ../                             │      │
│  │     • Remove/reject dangerous content                   │      │
│  │     • Limit field length to 10,000 chars                │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: VIEW DECORATOR PROTECTION              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  @require_tokens(cost=10, feature="image_generation")   │      │
│  │                                                          │      │
│  │  1. Extract user_id from request                        │      │
│  │  2. HTTP GET → Token Service API:                       │      │
│  │     GET {TOKEN_SERVICE_URL}/users/user123/tokens        │      │
│  │     Response: {"balance": 50}                           │      │
│  │                                                          │      │
│  │  3. Check: balance >= 10?                               │      │
│  │     • If NO → Return 402 Payment Required               │      │
│  │                                                          │      │
│  │  4. HTTP POST → Token Service API:                      │      │
│  │     POST {TOKEN_SERVICE_URL}/users/user123/tokens/deduct│      │
│  │     Body: {"amount": 10, "reason": "image_generation"}  │      │
│  │     Response: {"success": true, "new_balance": 40}      │      │
│  │                                                          │      │
│  │  5. If deduction success → Continue to view             │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  LAYER 3: SERIALIZER VALIDATION                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  ImageGenerationInputSerializer.validate_prompt()       │      │
│  │                                                          │      │
│  │  PromptValidator.validate(prompt):                      │      │
│  │    • Check for prompt injection patterns:               │      │
│  │      - "ignore previous instructions"                   │      │
│  │      - "you are now a..."                               │      │
│  │      - System prompt injection: <|im_start|>            │      │
│  │    • Check for excessive repetition (DoS)               │      │
│  │    • Limit to 2,000 characters                          │      │
│  │    • Remove dangerous patterns                          │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                           │
│                   (Your AI Generation Code)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Prompt already sanitized                                        │
│  • Tokens already deducted                                         │
│  • Rate limit passed                                               │
│  • Safe to process                                                 │
│                                                                     │
│  result = ImageGenerationService.generate(                         │
│      prompt="sunset",                                              │
│      aspect_ratio="16:9"                                           │
│  )                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### 1. Token Service (`core/token_*.py`)

**Location:** Core utilities  
**Purpose:** Integration with external billing API

**Files:**
- `core/token_client.py` - HTTP client for friend's API
- `core/token_decorators.py` - `@require_tokens` decorator
- `core/token_costs.py` - Token costs per feature

**External Dependencies:**
- Friend's token management API
- Network connectivity

**Failure Mode:**
- If API down → Return 503 Service Unavailable
- If insufficient tokens → Return 402 Payment Required

---

### 2. Rate Limiting (`core/middleware.py`)

**Location:** Django middleware  
**Purpose:** Prevent DDoS and abuse

**Algorithm:**
```python
cache_key = f"rate_limit:{ip_address}"
count = redis.get(cache_key) or 0

if count >= MAX_REQUESTS:
    return 429  # Too Many Requests
else:
    redis.incr(cache_key)
    redis.expire(cache_key, WINDOW_SECONDS)
    continue
```

**Storage:** Redis (in-memory cache)

**Failure Mode:**
- If Redis down → Middleware disabled (allow all requests)

**Configuration Options:**

| Strategy | Use Case | Config |
|----------|----------|--------|
| **Simple** | Same limit everywhere | `RATE_LIMIT_REQUESTS=1` |
| **Tiered** | Different limits per endpoint | `RATE_LIMIT_TIERS` dict |

---

### 3. Input Sanitization (`core/middleware.py` + `shared/utils/validators.py`)

**Location:** Middleware + Utility functions  
**Purpose:** Prevent injection attacks

**Protection Matrix:**

| Attack Type | Example | Protection |
|-------------|---------|------------|
| **NoSQL Injection** | `{"$where": "this.password"}` | Remove MongoDB operators |
| **Prompt Injection** | `"Ignore previous instructions"` | Detect/remove jailbreak patterns |
| **XSS** | `<script>alert(1)</script>` | Remove HTML/JS |
| **Path Traversal** | `../../etc/passwd` | Block `../` patterns |
| **SSRF** | `https://127.0.0.1/admin` | Block private IPs |

**Modes:**

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Strict = False** | Clean input | Development, user-friendly |
| **Strict = True** | Reject request | Production, security-first |

---

## Request Flow Example

### ✅ Successful Request

```
1. Client: POST /v1/features/image-generation/
   Body: {"prompt": "sunset", "user_id": "user123"}

2. RateLimitMiddleware:
   Redis check → OK (no recent request from this IP)
   
3. InputSanitizationMiddleware:
   Scan "sunset" → No dangerous patterns → PASS

4. @require_tokens(cost=10):
   GET token API → balance = 50
   50 >= 10? YES
   POST deduct API → success
   
5. PromptValidator:
   "sunset" length = 6 chars → OK
   No injection patterns → PASS

6. Business Logic:
   Generate image...
   
7. Response: 200 OK
   {"image_url": "https://...", "cost": 10}
```

### ❌ Blocked by Rate Limit

```
1. Client: POST /v1/features/image-generation/ (2nd request in 1 sec)

2. RateLimitMiddleware:
   Redis check → FAIL (already 1 request in last second)
   
3. Response: 429 Too Many Requests
   {
     "error": "Rate limit exceeded",
     "retry_after": 1
   }
```

### ❌ Blocked by Insufficient Tokens

```
1. Client: POST /v1/features/image-generation/
   Body: {"prompt": "sunset", "user_id": "broke_user"}

2. RateLimitMiddleware: PASS
3. InputSanitizationMiddleware: PASS

4. @require_tokens(cost=10):
   GET token API → balance = 5
   5 >= 10? NO
   
5. Response: 402 Payment Required
   {
     "error": "Insufficient tokens",
     "required": 10,
     "current": 5
   }
```

### ❌ Blocked by Injection Detection

```
1. Client: POST /v1/features/image-generation/
   Body: {"prompt": "Ignore previous instructions $where", "user_id": "user123"}

2. RateLimitMiddleware: PASS

3. InputSanitizationMiddleware:
   Scan → Found "$where" operator
   Strict mode = True → REJECT
   
4. Response: 400 Bad Request
   {
     "error": "Invalid input",
     "detail": "Dangerous operator detected: $where"
   }
```

---

## Performance Impact

### Token Service
- **Latency:** +200-500ms per request (2 API calls: get + deduct)
- **Mitigation:** 
  - Use `deduct_on_success=True` to deduct only after generation
  - Cache token balance for 10 seconds
  - Parallel API calls

### Rate Limiting
- **Latency:** +1-5ms (Redis lookup)
- **Mitigation:** Redis is in-memory, very fast
- **Failure:** If Redis down, middleware auto-disables

### Input Sanitization
- **Latency:** +5-20ms (regex scanning)
- **Mitigation:** Only scans string fields, skips large binaries
- **Optimization:** Pre-compile regex patterns

**Total overhead:** ~200-550ms per request

---

## Testing Strategy

### Unit Tests
```python
# core/tests/test_token_client.py
from core.token_client import token_client

def test_deduct_tokens_success(mocker):
    mock_api = mocker.patch('core.token_client.requests.request')
    mock_api.return_value.json.return_value = {"success": True}
    
    result = token_client.deduct_tokens("user123", 10)
    assert result == True

# core/tests/test_middleware.py
def test_rate_limit_blocks_second_request():
    # First request
    response = client.post('/api/test/')
    assert response.status_code == 200
    
    # Second request (should block)
    response = client.post('/api/test/')
    assert response.status_code == 429
```

### Integration Tests
```bash
# Test rate limiting
for i in {1..5}; do curl -X POST http://localhost:9999/v1/features/image-generation/ -d '{"prompt": "test"}'; done

# Test token service
curl -X POST http://localhost:9999/v1/features/image-generation/ -d '{"prompt": "test", "user_id": "user123"}'

# Test sanitization
curl -X POST http://localhost:9999/v1/features/image-generation/ -d '{"prompt": "$where attack"}'
```

---

## Monitoring & Alerts

### Metrics to Track

```python
# Token Service
- token_service.api_calls.count
- token_service.api_calls.latency
- token_service.errors.count (by type: timeout, 4xx, 5xx)
- token_service.insufficient_tokens.count

# Rate Limiting
- rate_limit.blocked_requests.count (by IP)
- rate_limit.allowed_requests.count

# Input Sanitization
- sanitization.dangerous_inputs.count (by pattern type)
- sanitization.rejected_requests.count
```

### Log Examples

```python
# logs/debug.log
[INFO] Deducted 10 tokens from user user123 for image_generation
[WARNING] Rate limit exceeded for IP: 192.168.1.100
[WARNING] Input sanitization rejected request: Dangerous operator detected: $where
[ERROR] Token service timeout: https://api.example.com/users/user123/tokens
```

---

## Configuration Quick Reference

| Setting | Default | Development | Production |
|---------|---------|-------------|------------|
| `RATE_LIMIT_ENABLED` | True | False | True |
| `RATE_LIMIT_REQUESTS` | 1 | 10 | 1 |
| `INPUT_SANITIZATION_ENABLED` | True | True | True |
| `INPUT_SANITIZATION_STRICT_MODE` | False | False | True |
| `TOKEN_SERVICE_TIMEOUT` | 5s | 10s | 3s |

---

See `SECURITY_SETUP_GUIDE.md` for complete setup instructions.
