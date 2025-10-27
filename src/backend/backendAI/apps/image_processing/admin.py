from django.contrib import admin
from .models import ProcessedImage


@admin.register(ProcessedImage)
class ProcessedImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'operation_type', 'status', 'processing_time', 'created_at']
    list_filter = ['status', 'operation_type', 'created_at']
    search_fields = ['user__username', 'operation_type']
    readonly_fields = ['created_at', 'updated_at', 'processing_time']
    date_hierarchy = 'created_at'
