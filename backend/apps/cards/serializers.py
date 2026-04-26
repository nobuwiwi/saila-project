from rest_framework import serializers
from .models import BusinessCard


class BusinessCardListSerializer(serializers.ModelSerializer):
    """一覧用・軽量シリアライザー（画像URLとparsed_dataのみ）"""

    class Meta:
        model = BusinessCard
        fields = [
            'id',
            'workspace',
            'analysis_status',
            'parsed_data',
            'image',
            'thumbnail',
            'memo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'analysis_status', 'created_at', 'updated_at']


class BusinessCardDetailSerializer(serializers.ModelSerializer):
    """詳細・編集用・全フィールドシリアライザー"""

    class Meta:
        model = BusinessCard
        fields = [
            'id',
            'workspace',
            'owner',
            'image',
            'thumbnail',
            'analysis_status',
            'parsed_data',
            'raw_ocr_text',
            'memo',
            'deleted_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'thumbnail',
            'analysis_status',
            'raw_ocr_text',
            'deleted_at',
            'created_at',
            'updated_at',
        ]
