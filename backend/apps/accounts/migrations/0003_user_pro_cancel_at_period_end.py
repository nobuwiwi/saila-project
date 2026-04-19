from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_is_pro_user_pro_started_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='pro_cancel_at_period_end',
            field=models.BooleanField(default=False),
        ),
    ]
