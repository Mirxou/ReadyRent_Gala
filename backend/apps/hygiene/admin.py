from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import HygieneRecord, HygieneChecklist, HygieneCertificate


class HygieneChecklistInline(admin.TabularInline):
    model = HygieneChecklist
    extra = 1


@admin.register(HygieneRecord)
class HygieneRecordAdmin(admin.ModelAdmin):
    list_display = ['product', 'cleaning_type', 'status', 'scheduled_date', 'cleaned_by', 'passed_inspection', 'is_overdue']
    list_filter = ['status', 'cleaning_type', 'passed_inspection', 'scheduled_date']
    search_fields = ['product__name', 'cleaning_notes', 'inspection_notes']
    readonly_fields = ['created_at', 'updated_at', 'is_overdue']
    date_hierarchy = 'scheduled_date'
    inlines = [HygieneChecklistInline]
    
    fieldsets = (
        (_('Product'), {
            'fields': ('product', 'cleaning_type', 'status')
        }),
        (_('Schedule'), {
            'fields': ('scheduled_date', 'started_at', 'completed_at', 'verified_at')
        }),
        (_('Personnel'), {
            'fields': ('cleaned_by', 'verified_by')
        }),
        (_('Details'), {
            'fields': ('related_return', 'cleaning_notes', 'inspection_notes', 'chemicals_used', 'temperature')
        }),
        (_('Quality'), {
            'fields': ('passed_inspection', 'quality_score')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at', 'is_overdue')
        }),
    )


@admin.register(HygieneCertificate)
class HygieneCertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'hygiene_record', 'issued_date', 'expiry_date', 'is_valid', 'is_expired']
    list_filter = ['is_valid', 'issued_date']
    search_fields = ['certificate_number', 'hygiene_record__product__name']
    readonly_fields = ['issued_date', 'is_expired']

