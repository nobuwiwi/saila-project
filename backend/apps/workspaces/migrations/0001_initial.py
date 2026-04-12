import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Workspace',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(default='briefcase', max_length=50)),
                ('color', models.CharField(default='#6366f1', max_length=7)),
                ('is_default', models.BooleanField(default=False)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='workspaces',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['sort_order', 'created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='workspace',
            constraint=models.UniqueConstraint(
                condition=models.Q(is_default=True),
                fields=['owner', 'is_default'],
                name='unique_default_workspace_per_user',
            ),
        ),
    ]
