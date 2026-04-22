from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workspaces', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='workspace',
            name='company_name',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='workspace',
            name='relation_type',
            field=models.CharField(
                choices=[
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
                ],
                default='other',
                max_length=30,
            ),
        ),
    ]
