from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.cards.models import BusinessCard

class Command(BaseCommand):
    help = 'ゴミ箱から7日（168時間）以上経過した名刺を物理削除します。'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='削除対象の件数だけを表示し、実際の削除は行いません。',
        )

    def handle(self, *args, **options):
        # 削除のしきい値：現在から7日前
        threshold_date = timezone.now() - timedelta(days=7)

        # deleted_at が設定されていて、かつそれが7日以上前のレコードを取得
        cards_to_purge = BusinessCard.objects.filter(
            deleted_at__isnull=False,
            deleted_at__lte=threshold_date
        )

        count = cards_to_purge.count()

        if options['dry-run']:
            self.stdout.write(self.style.WARNING(f"削除対象: {count}件（dry-run）"))
        else:
            if count > 0:
                # 実際の物理削除を実行
                # 画像ファイルなども Django の signal 等が適切に設定されていれば
                # 同時に削除されるのが望ましい（django-cleanup ライブラリ等）
                cards_to_purge.delete()
                self.stdout.write(self.style.SUCCESS(f"{count}件を物理削除しました。"))
            else:
                self.stdout.write(self.style.SUCCESS("物理削除の対象となる名刺はありませんでした。"))
