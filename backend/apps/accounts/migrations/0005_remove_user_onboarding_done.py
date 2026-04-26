# Generated manually on 2026-04-26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_onboarding_done'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='onboarding_done',
        ),
    ]
