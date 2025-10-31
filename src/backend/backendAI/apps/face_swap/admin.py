from django.contrib import admin
from .models import FaceSwapRequest


@admin.register(FaceSwapRequest)
class FaceSwapRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'blend_ratio', 'processing_time', 'created_at']
    list_filter = ['status', 'use_gpu', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at', 'processing_time']
    date_hierarchy = 'created_at'
