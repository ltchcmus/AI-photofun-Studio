"""
Security Settings Configuration
Copy these settings to your main settings.py
"""

import os

# ============================================================================
# TOKEN SERVICE CONFIGURATION
# ============================================================================

TOKEN_SERVICE_URL = os.getenv('TOKEN_SERVICE_URL')
TOKEN_SERVICE_API_KEY = os.getenv('TOKEN_SERVICE_API_KEY')
TOKEN_SERVICE_TIMEOUT = int(os.getenv('TOKEN_SERVICE_TIMEOUT', 5))


# ============================================================================
# RATE LIMITING CONFIGURATION
# ============================================================================

# Enable/disable rate limiting
RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True') == 'True'

# Simple Rate Limit (Option 1)
RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', 1))  # Max requests
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 1))     # Per seconds
RATE_LIMIT_WHITELIST = ['127.0.0.1']  # IPs to exclude from rate limiting

# Advanced Tiered Rate Limit (Option 2 - Comment out if using Simple)
RATE_LIMIT_TIERS = {
    'ai_operations': {
        'requests': 1,   # 1 request
        'window': 1      # per second
    },
    'api': {
        'requests': 10,  # 10 requests
        'window': 1      # per second
    },
    'conversation': {
        'requests': 5,   # 5 requests
        'window': 1      # per second
    },
}

# Map URL paths to rate limit tiers
RATE_LIMIT_PATHS = {
    '/v1/features/': 'ai_operations',       # All AI feature endpoints
    '/api/v1/chat/': 'conversation',        # Chat/conversation endpoints
    '/v1/gallery/': 'api',                  # Gallery API
}


# ============================================================================
# INPUT SANITIZATION CONFIGURATION
# ============================================================================

# Enable/disable input sanitization
INPUT_SANITIZATION_ENABLED = os.getenv('INPUT_SANITIZATION_ENABLED', 'True') == 'True'

# Strict mode: True = reject dangerous input, False = clean it
INPUT_SANITIZATION_STRICT_MODE = os.getenv('INPUT_SANITIZATION_STRICT_MODE', 'False') == 'True'

# Max length for any input field (prevent DoS)
INPUT_MAX_LENGTH = int(os.getenv('INPUT_MAX_LENGTH', 10000))


# ============================================================================
# REDIS CACHE CONFIGURATION (Required for rate limiting)
# ============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
        }
    }
}


# ============================================================================
# INSTALLED APPS - Add token_service
# ============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    
    # Your apps
    'apps.conversation',
    'apps.prompt_service',
    'apps.image_service',
    'apps.image_gallery',
    'apps.intent_router',
    
    # AI Feature apps
    'apps.image_generation',
    'apps.upscale',
    'apps.remove_background',
    'apps.relight',
    'apps.style_transfer',
    'apps.reimagine',
    'apps.image_expand',
]

# Note: Token service is in core/, not an app, so no need to add to INSTALLED_APPS


# ============================================================================
# MIDDLEWARE - Add security middleware (ORDER MATTERS!)
# ============================================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Custom Security Middleware - ADD THESE IN THIS ORDER
    'core.middleware.RateLimitMiddleware',           # Option 1: Simple rate limiting
    # 'core.middleware.AdvancedRateLimitMiddleware', # Option 2: Tiered rate limiting (choose one)
    'core.middleware.InputSanitizationMiddleware',   # Input sanitization
    'core.middleware.RequestLoggingMiddleware',      # Request logging (keep last)
]


# ============================================================================
# ENVIRONMENT-SPECIFIC SETTINGS
# ============================================================================

# Development settings (more permissive)
if os.getenv('ENVIRONMENT') == 'development':
    RATE_LIMIT_ENABLED = False  # Disable for easier testing
    INPUT_SANITIZATION_STRICT_MODE = False  # Clean instead of reject
    RATE_LIMIT_WHITELIST.extend(['192.168.0.0/16'])  # Local network

# Production settings (strict)
elif os.getenv('ENVIRONMENT') == 'production':
    RATE_LIMIT_ENABLED = True
    INPUT_SANITIZATION_STRICT_MODE = True
    # Production-only security settings
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
