from django.urls import path
from .views import (
    ImageGalleryListView,
    ImageGalleryDetailView,
    ImageGalleryDeletedListView,
    ImageGalleryRestoreView,
    ImageGalleryPermanentDeleteView,
)

urlpatterns = [
    # List and create images
    path('', ImageGalleryListView.as_view(), name='image-gallery-list'),
    
    # Deleted images
    path('deleted', ImageGalleryDeletedListView.as_view(), name='image-gallery-deleted'),
    
    # Image detail and soft delete
    path('<uuid:image_id>', ImageGalleryDetailView.as_view(), name='image-gallery-detail'),
    
    # Restore deleted image
    path('<uuid:image_id>/restore', ImageGalleryRestoreView.as_view(), name='image-gallery-restore'),
    
    # Permanent delete
    path('<uuid:image_id>/permanent', ImageGalleryPermanentDeleteView.as_view(), name='image-gallery-permanent-delete'),
]
