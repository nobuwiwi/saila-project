import uuid
from django.db import models
from django.conf import settings

class UserBusinessAxis(models.Model):
    BUSINESS_AXIS_CHOICES = [
        ("it_engineering",  "ITエンジニアリング"),
        ("hr_recruitment",  "人材紹介・採用支援"),
        ("marketing",       "マーケティング・広告"),
        ("design",          "デザイン・クリエイティブ"),
        ("consulting",      "コンサルティング"),
        ("sales",           "営業・セールス"),
        ("education",       "教育・研修・コーチング"),
        ("writing",         "ライティング・メディア"),
        ("event_community", "イベント・コミュニティ"),
        ("other",           "その他"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_axes',
    )
    axis = models.CharField(
        max_length=50,
        choices=BUSINESS_AXIS_CHOICES,
    )
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'axis'],
                name='unique_axis_per_user',
            )
        ]
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f'{self.owner.email} / {self.get_axis_display()}'
