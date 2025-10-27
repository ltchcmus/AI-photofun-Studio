"""
Admin configuration for AI Gateway
"""
from django.contrib import admin
from .models import ChatSession, ChatMessage, PromptTemplate


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """Admin interface for ChatSession"""
    
    list_display = ['session_id', 'created_at', 'updated_at', 'message_count']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['session_id']
    readonly_fields = ['session_id', 'created_at', 'updated_at']
    
    def message_count(self, obj):
        """Display message count"""
        return obj.messages.count()
    message_count.short_description = 'Messages'
    
    fieldsets = (
        ('Session Info', {
            'fields': ('session_id', 'created_at', 'updated_at')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin interface for ChatMessage"""
    
    list_display = ['id', 'session', 'message_type', 'detected_intent', 'status', 'created_at']
    list_filter = ['message_type', 'detected_intent', 'status', 'created_at']
    search_fields = ['original_prompt', 'refined_prompt']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def content_preview(self, obj):
        """Display preview of content"""
        content = obj.original_prompt or ''
        return content[:100] + '...' if len(content) > 100 else content
    content_preview.short_description = 'Content'
    
    fieldsets = (
        ('Message Info', {
            'fields': ('id', 'session', 'message_type', 'detected_intent', 'intent_confidence', 'status', 'created_at', 'updated_at')
        }),
        ('Content', {
            'fields': ('original_prompt', 'refined_prompt')
        }),
        ('Response', {
            'fields': ('response_text', 'response_data', 'generated_image', 'result_files'),
            'classes': ('collapse',)
        }),
        ('Processing', {
            'fields': ('processing_time', 'error_message'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    """Admin interface for PromptTemplate"""
    
    list_display = ['name', 'intent_type', 'is_active', 'usage_count', 'created_at']
    list_filter = ['intent_type', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'template']
    readonly_fields = ['created_at', 'updated_at', 'usage_count']
    
    fieldsets = (
        ('Template Info', {
            'fields': ('name', 'description', 'category', 'is_active')
        }),
        ('Template Content', {
            'fields': ('template', 'example_input', 'example_output')
        }),
        ('Tags', {
            'fields': ('tags',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('usage_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_templates', 'deactivate_templates', 'reset_usage_count']
    
    def activate_templates(self, request, queryset):
        """Activate selected templates"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} template(s) activated.')
    activate_templates.short_description = 'Activate selected templates'
    
    def deactivate_templates(self, request, queryset):
        """Deactivate selected templates"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} template(s) deactivated.')
    deactivate_templates.short_description = 'Deactivate selected templates'
    
    def reset_usage_count(self, request, queryset):
        """Reset usage count"""
        updated = queryset.update(usage_count=0)
        self.message_user(request, f'Usage count reset for {updated} template(s).')
    reset_usage_count.short_description = 'Reset usage count'
