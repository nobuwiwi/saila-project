from rest_framework import serializers
from .models import UserBusinessAxis

class UserBusinessAxisSerializer(serializers.ModelSerializer):
    axis_display = serializers.SerializerMethodField()

    class Meta:
        model = UserBusinessAxis
        fields = [
            'id', 'axis', 'axis_display', 'sort_order', 'created_at',
        ]
        read_only_fields = [
            'id', 'axis_display', 'created_at',
        ]

    def get_axis_display(self, obj):
        return obj.get_axis_display()
