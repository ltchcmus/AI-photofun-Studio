"""
URL configuration for backendAI project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# API Documentation
schema_view = get_schema_view(
   openapi.Info(
      title="AI Photo Studio API",
      default_version='v1',
      description="Backend AI API for photo editing and manipulation",
      terms_of_service="https://www.yourapp.com/terms/",
      contact=openapi.Contact(email="contact@aiphotostudio.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # API Documentation
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Routes - Standalone AI Services
    path('api/v1/image-processing/', include('apps.image_processing.urls')),
    path('api/v1/face-swap/', include('apps.face_swap.urls')),
    path('api/v1/background-removal/', include('apps.background_removal.urls')),
    path('api/v1/prompt-refinement/', include('apps.prompt_refinement.urls')),
    path('api/v1/image-generation/', include('apps.image_generation.urls')),
    
    # AI Gateway - Orchestration Layer
    path('api/v1/ai-gateway/', include('apps.ai_gateway.urls')),
    
    # AI Tasks - Celery + Redis (Async Task Management)
    path('api/v1/tasks/', include('apps.ai_tasks.urls')),
    
    # path('api/v1/object-removal/', include('apps.object_removal.urls')),
    # path('api/v1/style-transfer/', include('apps.style_transfer.urls')),
    # path('api/v1/image-enhancement/', include('apps.image_enhancement.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

