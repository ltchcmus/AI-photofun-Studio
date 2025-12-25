import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def env_bool(name, default=False):
    val = os.environ.get(name)
    if val is None:
        return default
    return str(val).lower() in ('1', 'true', 'yes', 'y')

def env_int(name, default=0):
    try:
        return int(os.environ.get(name, default))
    except Exception:
        return default

# ============================================================================
# CORE SETTINGS
# ============================================================================

SECRET_KEY = (
    os.environ.get('DJANGO_SECRET_KEY')
    or os.environ.get('SECRET_KEY')
    or "django-insecure-(x2q%0-9oh7r=0klrzt0#f4^kh2rhy_ajje#uow5racu$ju^3k"
)

DEBUG = env_bool('DJANGO_DEBUG', True)

# Default allowed hosts include production domains
_default_hosts = 'localhost,127.0.0.1,0.0.0.0,nmcnpm-api-ai.lethanhcong.site,nmcnpm.lethanhcong.site'
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', _default_hosts).split(',')

# URL Configuration
APPEND_SLASH = True  # Auto-redirect URLs without trailing slash to with trailing slash

# ============================================================================
# APPLICATIONS (MongoDB Only - Minimal Django Apps)
# ============================================================================

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_yasg",
    "apps.conversation",
    "apps.prompt_service",
    "apps.rec_prompt",
    "apps.prompt_to_video",
    "apps.image_service",
    "apps.image_gallery",
    "apps.intent_router",
    "apps.image_generation",
    "apps.upscale",
    "apps.image_to_video",
    "apps.remove_background",
    "apps.relight",
    "apps.style_transfer",
    "apps.reimagine",
    "apps.image_expand",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "core.middleware.RequestLoggingMiddleware",
]

ROOT_URLCONF = "backendAI.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backendAI.wsgi.application"

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# PostgreSQL (Supabase) for image_gallery app
# Django requires a database config even if not used
# Using dummy database since we only use MongoDB
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get('SUPABASE_DB_NAME', 'postgres'),
        "USER": os.environ.get('SUPABASE_DB_USER', 'postgres'),
        "PASSWORD": os.environ.get('SUPABASE_DB_PASSWORD', ''),
        "HOST": os.environ.get('SUPABASE_DB_HOST', 'localhost'),
        "PORT": os.environ.get('SUPABASE_DB_PORT', '5432'),
        "OPTIONS": {
            "sslmode": os.environ.get('SUPABASE_DB_SSLMODE', 'require'),
        },
    }
}

# MongoDB Configuration (for conversation app)
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'ai_photofun_studio')

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ============================================================================
# INTERNATIONALIZATION
# ============================================================================

LANGUAGE_CODE = os.environ.get('LANGUAGE_CODE', 'en-us') or 'en-us'

# TIME_ZONE must be a valid timezone string, fallback to UTC if empty/invalid
_time_zone_env = os.environ.get('TIME_ZONE', '').strip()
TIME_ZONE = _time_zone_env if _time_zone_env else 'UTC'

USE_I18N = env_bool('USE_I18N', True)
USE_TZ = env_bool('USE_TZ', True)

# ============================================================================
# STATIC & MEDIA FILES
# ============================================================================

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================================
# REST FRAMEWORK CONFIGURATION
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',  # Uncomment if using JWT
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Change in production
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}


# ============================================================================
# CORS CONFIGURATION
# ============================================================================

# Allow all origins in development (for testing with file:// protocol)
# CORS_ALLOW_ALL_ORIGINS = DEBUG  # True in development, False in production

# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://localhost:5173",  # Vite default port
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:5173",
# ]
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# ============================================================================
# MEDIA FILES CONFIGURATION
# ============================================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ============================================================================
# ============================================================================
# AI/ML MODELS
# ============================================================================

ML_MODELS_DIR = BASE_DIR / 'ml_models'

# ==========================================================================
# External Service URLs & API Keys
# ==========================================================================
# MEDIA_UPLOAD_URL: Endpoint to upload generated images (expects multipart/form-data)
# Example expected response: { "file_url": "https://.../image.png" }
# GEMINI_MODEL: Optional model name for prompt refinement metadata

# Freepik API Key for AI image generation
FREEPIK_API_KEY = os.environ.get('FREEPIK_API_KEY', '')

# Gemini API Keys (comma-separated for rotation)
GEMINI_API_KEYS = os.environ.get('GEMINI_API_KEYS', '')

# ModelStudio API
MODELSTUDIO_API_KEY = os.environ.get('MODELSTUDIO_API_KEY', '')
MODELSTUDIO_API_BASE = os.environ.get('MODELSTUDIO_API_BASE', 'https://dashscope-intl.aliyuncs.com/api/v1')

# File Service URL for image uploads
FILE_SERVICE_URL = os.environ.get('FILE_SERVICE_URL', 'https://file-service-cdal.onrender.com')

os.makedirs(MEDIA_ROOT, exist_ok=True)
os.makedirs(ML_MODELS_DIR, exist_ok=True)

USE_GPU = env_bool('USE_GPU', True)
GPU_DEVICE_ID = env_int('GPU_DEVICE_ID', 0)

# ============================================================================
# LOGGING
# ============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'debug.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# ============================================================================
# CELERY
# ============================================================================

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True
CELERY_RESULT_EXPIRES = int(os.environ.get('CELERY_RESULT_EXPIRES', 3600))
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# ============================================================================
# CACHE
# ============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/1'),
    }
}

# ============================================================================
# API DOCUMENTATION (Swagger)
# ============================================================================

SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Basic': {'type': 'basic'},
        'Bearer': {'type': 'apiKey', 'name': 'Authorization', 'in': 'header'}
    },
    'USE_SESSION_AUTH': True,
    'JSON_EDITOR': True,
    'SUPPORTED_SUBMIT_METHODS': ['get', 'post', 'put', 'delete', 'patch'],
}
