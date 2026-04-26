import uuid
from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel


class BusinessCard(SoftDeleteModel):
    """名刺モデル（論理削除対応）"""

    ANALYSIS_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workspace = models.ForeignKey(
        'workspaces.Workspace',
        on_delete=models.CASCADE,
        related_name='cards',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cards',
    )

    image = models.ImageField(upload_to='cards/images/', blank=True)
    thumbnail = models.ImageField(upload_to='cards/thumbnails/', blank=True)

    analysis_status = models.CharField(
        max_length=20,
        choices=ANALYSIS_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    parsed_data = models.JSONField(default=dict, blank=True)
    raw_ocr_text = models.TextField(blank=True)
    memo = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        name = self.parsed_data.get('full_name') or self.parsed_data.get('company_name') or '（未解析）'
        return f'{name} [{self.workspace.name}]'

    def hard_delete(self, using=None, keep_parents=False):
        """物理削除時にS3の画像ファイルも完全に削除する"""
        if self.image:
            self.image.delete(save=False)
        if self.thumbnail:
            self.thumbnail.delete(save=False)
        super().hard_delete(using=using, keep_parents=keep_parents)
