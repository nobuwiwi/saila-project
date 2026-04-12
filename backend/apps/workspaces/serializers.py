from rest_framework import serializers
from .models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    card_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'description', 'icon', 'color',
            'is_default', 'sort_order', 'card_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_default', 'card_count', 'created_at', 'updated_at']

    def get_card_count(self, obj):
        # 論理削除されていない名刺のみカウント（cards appが未実装の間は0）
        if hasattr(obj, 'cards'):
            return obj.cards.filter(deleted_at__isnull=True).count()
        return 0
