from django.contrib import admin
from .models import UserBusinessAxis

@admin.register(UserBusinessAxis)
class UserBusinessAxisAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'axis', 'sort_order', 'created_at')
    list_filter = ('axis',)
    search_fields = ('owner__email', 'owner__display_name')
