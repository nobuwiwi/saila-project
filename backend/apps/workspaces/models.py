import uuid
from django.db import models
from django.conf import settings


class Workspace(models.Model):
    RELATION_CHOICES = [
        ('customer',  '顧客・クライアント'),
        ('outsource', '委託先・外注先'),
        ('supplier',  '仕入先・パートナー'),
        ('agency',    '代理店・販売店'),
        ('internal',  '社内・同僚'),
        ('group',     'グループ会社・関連会社'),
        ('referral',  '紹介者・仲介者'),
        ('community', '勉強会・コミュニティ'),
        ('event',     '展示会・イベント'),
        ('investor',  '投資家・出資者'),
        ('media',     'メディア・プレス'),
        ('other',     'その他'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workspaces',
    )
    name = models.CharField(max_length=100)
    company_name = models.CharField(max_length=100, default='')
    relation_type = models.CharField(
        max_length=30,
        choices=RELATION_CHOICES,
        default='other',
    )
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='briefcase')
    color = models.CharField(max_length=7, default='#6366f1')
    is_default = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_workspace_per_user',
            )
        ]
        ordering = ['sort_order', 'created_at']

    def save(self, *args, **kwargs):
        self.name = f"{self.company_name}｜{self.get_relation_type_display()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.owner.email} / {self.name}'
