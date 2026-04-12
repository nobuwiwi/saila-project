from django.contrib import admin
from .models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'is_default', 'color', 'sort_order', 'created_at']
    list_filter = ['is_default']
    search_fields = ['name', 'owner__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
