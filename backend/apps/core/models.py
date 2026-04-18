import uuid
from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    """deleted_at が NULL のレコードのみ返すデフォルトマネージャー"""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager):
    """論理削除済みを含む全レコードを返すマネージャー"""

    def get_queryset(self):
        return super().get_queryset()


class TrashedManager(models.Manager):
    """論理削除済みのレコードのみ返すマネージャー"""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    """
    論理削除を持つ抽象基底モデル。
    - objects          → 未削除のみ（SoftDeleteManager）
    - all_objects      → 全件（AllObjectsManager）
    - trashed_objects  → 削除済みのみ（TrashedManager）
    """

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()
    trashed_objects = TrashedManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """論理削除（deleted_at をセット）"""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """論理削除を取り消す"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])

    def hard_delete(self, using=None, keep_parents=False):
        """物理削除"""
        super().delete(using=using, keep_parents=keep_parents)
