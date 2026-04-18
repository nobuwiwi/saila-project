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
