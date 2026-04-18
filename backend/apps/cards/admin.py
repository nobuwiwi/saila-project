from django.contrib import admin
from .models import BusinessCard


@admin.register(BusinessCard)
class BusinessCardAdmin(admin.ModelAdmin):
    list_display = ['id', 'owner', 'workspace', 'analysis_status', 'deleted_at', 'created_at']
    list_filter = ['analysis_status', 'workspace']
    search_fields = ['owner__email', 'parsed_data', 'memo']
    readonly_fields = ['id', 'owner', 'created_at', 'updated_at', 'deleted_at']

    def get_queryset(self, request):
        # 管理画面では論理削除済みも含めて全件表示
        return BusinessCard.all_objects.all()
