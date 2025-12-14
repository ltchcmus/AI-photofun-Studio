from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="AI Photo Studio API",
      default_version='v1',
      description="Backend AI API for photo editing and manipulation",
      contact=openapi.Contact(email="contact@aiphotostudio.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Conversation-based endpoints (chat with bot)
    path('api/v1/chat/', include('apps.conversation.urls')),
    path('', include('apps.conversation.urls')),
    
    # Internal services (used by conversation flow)
    path('v1/prompt/', include('apps.prompt_service.urls')),
    path('v1/image/', include('apps.image_service.urls')),
    
    # Direct feature endpoints (no conversation required)
    path('v1/features/image-generation/', include('apps.image_generation.urls')),
    path('v1/features/upscale/', include('apps.upscale.urls')),
    path('v1/features/remove-background/', include('apps.remove_background.urls')),
    path('v1/features/relight/', include('apps.relight.urls')),
    path('v1/features/style-transfer/', include('apps.style_transfer.urls')),
    path('v1/features/reimagine/', include('apps.reimagine.urls')),
    path('v1/features/image-expand/', include('apps.image_expand.urls')),
    
    # Shared gallery (used by both flows)
    path('v1/gallery/', include('apps.image_gallery.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
