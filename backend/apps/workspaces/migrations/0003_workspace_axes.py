from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('axes', '0001_initial'),
        ('workspaces', '0002_workspace_company_name_relation_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='workspace',
            name='axes',
            field=models.ManyToManyField(blank=True, related_name='workspaces', to='axes.userbusinessaxis'),
        ),
    ]
