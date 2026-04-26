from rest_framework import serializers
from .models import Workspace


from apps.axes.models import UserBusinessAxis

class WorkspaceAxisSerializer(serializers.ModelSerializer):
    axis_display = serializers.CharField(source='get_axis_display')
    class Meta:
        model = UserBusinessAxis
        fields = ['id', 'axis', 'axis_display']

class WorkspaceSerializer(serializers.ModelSerializer):
    card_count = serializers.SerializerMethodField()
    relation_type_display = serializers.SerializerMethodField()
    axes = WorkspaceAxisSerializer(many=True, read_only=True)
    axis_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'company_name', 'relation_type', 'relation_type_display',
            'description', 'icon', 'color',
            'is_default', 'sort_order', 'card_count',
            'axes', 'axis_ids',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'name', 'relation_type_display',
            'is_default', 'card_count', 'created_at', 'updated_at',
            'axes',
        ]

    def get_card_count(self, obj):
        # 論理削除されていない名刺のみカウント
        if hasattr(obj, 'cards'):
            return obj.cards.filter(deleted_at__isnull=True).count()
        return 0

    def get_relation_type_display(self, obj):
        return obj.get_relation_type_display()
