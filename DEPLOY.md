# Saila デプロイガイド (Railway)

このドキュメントは Railway 上で Saila をデプロイし、環境をアップデートするための手順を記録しています。

## 1. サービスの構成
Saila の完全な動作には以下のサービスが必要です。
- **backend** (Django)
- **frontend** (React)
- **lp** (Static HTML)
- **PostgreSQL** (Database)
- **Redis** (Message Broker / Cache)
- **worker** (Celery)

## 2. Redis サービスの追加手順 (STEP 10)
名刺の AI 解析はバックグラウンドで行われます。この処理（Celery）を連携させるために Redis が必要です。

1. Railway のプロジェクトダッシュボードを開きます。
2. 画面上部または右上の **「New」** ボタンをクリックします。
3. **「Database」** -> **「Add Redis」** を選択します。
4. プロジェクトに Redis サービスが追加され、自動的に起動します。
5. 作成された Redis をクリックし、**「Variables」** タブを開くと `REDIS_URL` が発行されていることを確認します（backend はこの変数を自動的に認識します）。

## 3. Celery Worker サービスの追加手順
Redis の設定後、非同期処理を実際に実行するためのワーカーサービスを立てます。このワーカーはバックエンドコードと同じものを使用しますが、別コマンドで起動します。

1. Railway ダッシュボードで **「New」** -> **「GitHub Repo」** から再度 `saila-project` リポジトリを選択します。
2. 追加されたサービスの **Settings** タブを開き、以下の2点を設定します：
   - **Name**: `worker` などの分かりやすい名前に変更
   - **Root Directory**: `backend` （※超重要：これがないとビルドに失敗します）
3. **Settings** タブ内の「Deploy」セクションにある **Start Command** をカスタムコマンドで上書きします。
   - Start Command: `celery -A config worker -l info` （※前後の記号なしで、この英文字だけを入力してください）
4. **Variables** タブを開き、メインの backend サービスと全く同じ環境変数を設定します。
   - **REDIS_URL** については、Railway内部の安全な通信を使用するため `${{Redis.REDIS_URL}}` を設定してください（`REDIS_PUBLIC_URL` は使用しません）。
   - その他、`SECRET_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `GOOGLE_CLOUD_VISION_API_KEY` 等も backend と同様に設定します。
5. 設定後、自動的に再デプロイが行われ、ログに Celery の起動画面が表示されれば完了です。

## 4. 自動削除コマンド (Cron Job) の追加手順 (STEP 11)
ゴミ箱から7日経過した名刺を自動で物理削除するために、定期実行（CronJob）サービスを追加します。

1. Railway ダッシュボードで **「New」** -> **「GitHub Repo」** から再度 `saila-project` リポジトリを選択します。
2. 追加されたサービスの **Settings** タブを開き、以下の設定を行います：
   - **Name**: `cron-purge` などわかりやすい名前に変更
   - **Root Directory**: `backend` （※必須）
3. **Settings** タブ内の「Deploy」セクションで **Start Command** を上書きします。
   - Start Command: `python manage.py purge_deleted_cards`
4. **Settings** タブをさらに一番下までスクロールし、「**Cron Schedule**」に以下のスケジュールを入力します。
   - Schedule: `0 3 * * *` （毎日午前3時に実行）
   - ※この設定を行うことで、このサービスは常時起動するのではなく、指定時刻だけ起動してコマンドを実行するようになります。
5. **Variables** タブを開き、`backend` と同じ `DATABASE_URL` や `SECRET_KEY` 等を設定します（DBへのアクセス権限が必要です）。
