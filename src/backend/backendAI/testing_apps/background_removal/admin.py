from django.contrib import admin
from .models import BackgroundRemovalRequest


@admin.register(BackgroundRemovalRequest)
class BackgroundRemovalAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'background_color', 'processing_time', 'created_at']
    list_filter = ['status', 'return_mask', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at', 'processing_time']
