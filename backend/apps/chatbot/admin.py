from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ['created_at']
    fields = ['role', 'content', 'model_used', 'tokens_used', 'created_at']


class ChatIntentInline(admin.TabularInline):
    model = ChatIntent
    extra = 0
    readonly_fields = ['created_at']


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'status', 'language', 'started_at', 'escalated_to']
    list_filter = ['status', 'language', 'started_at']
    search_fields = ['session_id', 'user__email']
    readonly_fields = ['started_at', 'resolved_at', 'escalated_at']
    date_hierarchy = 'started_at'
    inlines = [ChatMessageInline, ChatIntentInline]
    
    fieldsets = (
        (_('Session Info'), {
            'fields': ('session_id', 'user', 'status', 'language')
        }),
        (_('Timestamps'), {
            'fields': ('started_at', 'resolved_at', 'escalated_at', 'escalated_to')
        }),
        (_('Context'), {
            'fields': ('context_data',)
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'content_preview', 'model_used', 'tokens_used', 'created_at']
    list_filter = ['role', 'model_used', 'created_at']
    search_fields = ['content', 'session__session_id']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = _('Content Preview')


@admin.register(ChatIntent)
class ChatIntentAdmin(admin.ModelAdmin):
    list_display = ['session', 'intent_type', 'confidence', 'created_at']
    list_filter = ['intent_type', 'created_at']
    search_fields = ['session__session_id']
    readonly_fields = ['created_at']


@admin.register(ChatbotConfiguration)
class ChatbotConfigurationAdmin(admin.ModelAdmin):
    list_display = ['key', 'value_preview', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['key', 'description']
    readonly_fields = ['updated_at']
    
    def value_preview(self, obj):
        return obj.value[:50] + '...' if len(obj.value) > 50 else obj.value
    value_preview.short_description = _('Value Preview')

