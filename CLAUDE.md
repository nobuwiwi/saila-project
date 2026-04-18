# Saila — プロジェクトマスタードキュメント
> このファイルはAIエージェントへの指示書です。タスクを開始する前に必ず全文を読んでください。

---

## 1. プロダクト概要

**Saila** は、副業・複業・フリーランスなど複数の活動を持つビジネスパーソンが、
受け取った名刺を活動ごとに完全分離して管理できる、名刺管理SaaSです。

### 解決する課題
- 既存の名刺管理サービスでは、本業・副業・個人活動で受け取った名刺が1つのDBに混在する
- 「誰に・どの活動で会ったか」という文脈（コンテキスト）が失われる
- 名刺のデジタル化が手入力で面倒

### ターゲットユーザー
副業・複業・フリーランスなど、複数の活動を掛け持ちするビジネスパーソン

### 差別化ポイント
既存サービスは「自分の名刺（自分の顔）」の管理が中心。
Sailaは「**受け取った相手の名刺**」を活動単位で仕分けて管理することに特化する。

---

## 2. 技術スタック

| レイヤー | 技術 |
|---|---|
| バックエンド | Python 3.12 / Django 4.2 / Django REST Framework |
| 認証 | JWT（djangorestframework-simplejwt）/ メール＋パスワード |
| フロントエンド | React (Vite 5.4.x) + TypeScript + Tailwind CSS |
| 状態管理 | Zustand |
| サーバー状態 | React Query |
| HTTPクライアント | Axios |
| データベース | PostgreSQL（Railway managed） |
| キャッシュ/キュー | Redis + Celery（STEP 10から使用） |
| OCR | Google Cloud Vision API（STEP 10から使用） |
| LLM | Gemini API（デフォルト）または OpenAI API（STEP 10から使用） |
| 決済 | Stripe（STEP 12から使用） |
| デプロイ | Railway（バックエンド・DB・Redis・LP を同一プロジェクトで管理） |
| 静的ファイル | WhiteNoise（CDN不使用） |

### Node.jsバージョン
- **Node.js 22.12以上が必要**（Vite 5.4の要件）
- `frontend/package.json` の `engines` フィールドに `"node": ">=22.12.0"` を指定すること

### 将来対応（現時点では実装しない）
- Google OAuth ログイン（AbstractBaseUserを使った設計にしておけば後から追加可能）

---

## 3. ディレクトリ構成

```
saila/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # 共通設定
│   │   │   ├── development.py   # ローカル開発用
│   │   │   └── production.py    # Railway本番用
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── core/                # 抽象モデル・共通ユーティリティ
│   │   ├── accounts/            # カスタムUserモデル・認証
│   │   ├── workspaces/          # ワークスペース（ペルソナ）
│   │   ├── cards/               # 名刺・OCR・LLM解析
│   │   └── billing/             # Stripe決済（STEP 12で追加）
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   ├── Dockerfile               # Railway本番用
│   ├── Dockerfile.dev           # ローカル開発用
│   ├── Procfile                 # Railway起動コマンド
│   └── railway.toml             # Railwayビルド設定
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axiosクライアント・API関数
│   │   │   ├── client.ts        # Axiosインスタンス・JWT自動付与
│   │   │   ├── auth.ts          # 認証API
│   │   │   ├── workspaces.ts    # ワークスペースAPI
│   │   │   └── cards.ts         # 名刺API
│   │   ├── components/          # 共通UIコンポーネント
│   │   │   ├── Layout.tsx       # サイドバー + ヘッダー + メインエリア
│   │   │   └── PrivateRoute.tsx # 認証ガード
│   │   ├── features/            # 機能単位のコンポーネント
│   │   │   ├── auth/            # ログイン・登録画面
│   │   │   ├── workspaces/      # ワークスペースモーダル
│   │   │   ├── cards/           # 名刺テーブル・詳細・アップロード
│   │   │   └── billing/         # Stripe決済（STEP 12で追加）
│   │   ├── hooks/               # カスタムReact Hooks
│   │   ├── store/               # Zustand store
│   │   │   ├── authStore.ts     # 認証状態管理
│   │   │   └── workspaceStore.ts # ワークスペース選択状態
│   │   ├── types/               # TypeScript型定義
│   │   └── utils/               # 汎用ユーティリティ
│   ├── index.html
│   ├── vite.config.ts
│   ├── railway.toml             # Railwayビルド設定
│   └── package.json             # engines: node>=22.12.0
├── lp/
│   ├── index.html               # LPメインページ
│   ├── css/
│   │   └── style.css            # LP専用スタイル
│   ├── js/
│   │   └── main.js              # スクロールフェードインのみ
│   ├── assets/
│   │   └── images/              # LP用画像・OGP画像
│   └── railway.toml             # Railway静的配信設定
└── docker-compose.yml           # ローカル開発専用（DB・Redis）
```

---

## 4. データモデル設計

### 4-1. User（apps/accounts/models.py）
```
id               UUID（PK）
email            メールアドレス（ユニーク・ログインIDとして使用）
password         ハッシュ化パスワード（AbstractBaseUser）
display_name     表示名
avatar_url       アバター画像URL（空白可）
trial_started_at トライアル開始日時（登録日）
is_pro           Proプランフラグ（default=False）
stripe_customer_id  StripeカスタマーID（空白可）
pro_started_at   Pro開始日時（null=True）
is_active        アクティブフラグ
is_staff         管理者フラグ
created_at / updated_at
```

**ビジネスロジックメソッド**
- `is_trial_active` → 登録から30日以内か
- `total_card_count` → 生涯累計登録枚数（削除済み含む）
- `can_add_card()` → トライアル中 or is_pro=True or 累計50枚未満なら True
- `workspace_limit` → トライアル中 or is_pro=True なら無制限・それ以外は2

**設計上の注意**
- `AbstractBaseUser` を使うこと（将来のGoogle OAuth追加に対応できる）
- `USERNAME_FIELD = "email"`
- パスワード認証は Django 標準の仕組みをそのまま使う

### 4-2. Workspace（apps/workspaces/models.py）
```
id          UUID（PK）
owner       FK → User
name        ワークスペース名（例: 「本業」「副業A」）
description 説明
color       HEXカラー（例: "#6366f1"）
is_default  デフォルトワークスペースフラグ
sort_order  表示順
created_at / updated_at
```

**制約**
- 1ユーザーにつきデフォルトワークスペースは1つ（UniqueConstraint）
- ワークスペース数の上限はプランによる（無料：2・Pro：無制限）

### 4-3. BusinessCard（apps/cards/models.py）
```
id              UUID（PK）
workspace       FK → Workspace
owner           FK → User（生涯累計カウント用に直接参照）
image           名刺画像（ImageField）
thumbnail       サムネイル画像（ImageField・200x120px）
analysis_status pending / processing / done / failed
parsed_data     JSONField（構造化データ）
raw_ocr_text    OCR生テキスト（blank=True）
memo            ユーザーメモ（blank=True）
deleted_at      論理削除日時（NULL=未削除）
created_at / updated_at
```

**parsed_dataのJSON構造**
```json
{
  "company_name": "株式会社例",
  "full_name": "山田 太郎",
  "title": "営業部長",
  "email": "yamada@example.com",
  "phone": "03-1234-5678",
  "mobile": "090-1234-5678",
  "address": "東京都渋谷区...",
  "website": "https://example.com",
  "department": "営業部",
  "notes": "AIが補足した情報など"
}
```

---

## 5. 認証フロー

### 現在の実装（メール＋パスワード）
```
【新規登録】
1. /register 画面でメール・パスワード・表示名を入力
2. POST /api/accounts/register/ → access・refresh トークンを返す
3. トークンを localStorage に保存
4. /cards へリダイレクト

【ログイン】
1. /login 画面でメール・パスワードを入力
2. POST /api/accounts/login/ → access・refresh トークンを返す
3. トークンを localStorage に保存
4. /cards へリダイレクト

【トークン更新】
- access トークンの有効期限：60分
- 401エラー時に POST /api/token/refresh/ で自動更新
- refresh トークンの有効期限：14日

【ログアウト】
- localStorage のトークンを削除
- /login へリダイレクト
```

### 将来の実装（Google OAuth）
```
※ 現時点では実装しない。AbstractBaseUserを使った設計にしておけば後から追加可能。
```

---

## 6. UIの基本構造

### ログイン後のレイアウト
```
┌─────────────┬────────────────────────────────┐
│ Saila       │  本業                  名刺を追加│
│─────────────│────────────────────────────────│
│ 📁 本業(23) │                                │
│ 📁 副業A(8) │  ← 名刺テーブルエリア          │
│ 📁 個人(4)  │                                │
│             │                                │
│─────────────│                                │
│ 🗑 ゴミ箱   │                                │
│ 👤 田中太郎 │                                │
│    ログアウト│                                │
└─────────────┴────────────────────────────────┘
```

### ルーティング
```
/              → /cards にリダイレクト
/login         → ログイン画面
/register      → 登録画面
/cards         → PrivateRoute + Layout + CardTablePage
/trash         → PrivateRoute + Layout + TrashPage
/billing/success → 決済完了画面（STEP 12で追加）
```

### ワークスペース切り替えの仕様
- **画面遷移なし**（URLは /cards のまま）
- サイドバーのワークスペースをクリックするだけで名刺一覧が切り替わる
- 選択中のワークスペースIDを `workspaceStore.ts` で管理
- 選択状態を localStorage に保存して次回ログイン時に復元する
- ワークスペース選択画面（/workspaces）は**存在しない**

---

## 7. APIエンドポイント設計

```
# 認証不要
GET    /api/health/                          ヘルスチェック
POST   /api/accounts/register/               新規登録 → JWT返却
POST   /api/accounts/login/                  ログイン → JWT返却
POST   /api/token/refresh/                   トークン更新

# 以下すべて JWT 必須
GET    /api/accounts/me/                     ログインユーザー情報
PATCH  /api/accounts/me/                     プロフィール更新

GET    /api/workspaces/                      ワークスペース一覧（card_count含む）
POST   /api/workspaces/                      ワークスペース作成
GET    /api/workspaces/{id}/                 ワークスペース詳細
PATCH  /api/workspaces/{id}/                 ワークスペース更新
DELETE /api/workspaces/{id}/                 ワークスペース削除
POST   /api/workspaces/{id}/set_default/     デフォルト設定

GET    /api/cards/?workspace={id}            名刺一覧（ワークスペース絞り込み）
POST   /api/cards/                           名刺作成（画像アップロード）
GET    /api/cards/{id}/                      名刺詳細
PATCH  /api/cards/{id}/                      名刺編集
DELETE /api/cards/{id}/                      名刺削除（論理削除）
POST   /api/cards/{id}/analyze/              AI解析トリガー
GET    /api/cards/trash/                     ゴミ箱一覧
POST   /api/cards/{id}/restore/              ゴミ箱から復元
DELETE /api/cards/{id}/hard_delete/          完全削除（ゴミ箱から）

POST   /api/billing/checkout/                Stripe Checkout セッション作成
POST   /api/billing/webhook/                 Stripe Webhook受信（認証不要）
```

---

## 8. 絶対に守るルール（AIエージェントへの制約）

### 認証について
- **`/api/health/`・`/api/accounts/register/`・`/api/accounts/login/`・`/api/token/refresh/`・`/api/billing/webhook/` 以外はすべて認証必須**
- `AllowAny` を使っていいのは上記5つのエンドポイントのみ
- JWTトークンの検証は `JWTAuthentication` に任せ、自前実装しない
- simplejwt のみで認証を実装する（django-allauth・dj-rest-auth は使わない）

### 削除について
- **名刺の削除は必ず論理削除**（`deleted_at = timezone.now()`）
- `hard_delete` は管理コマンド `purge_deleted_cards` からのみ呼び出す
- 削除から168時間（7日）経過したレコードのみ物理削除する

### カウントについて
- **生涯累計カウントは削除済みも含める**（`BusinessCard.objects.filter(owner=user)` で全件）
- 制限チェックは必ず `user.can_add_card()` を使う。直接数値比較しない

### データ所有権について
- ユーザーは**自分のワークスペースと名刺のみ**操作できる
- ViewSetの `get_queryset` では必ず `owner=request.user` でフィルタする
- 他ユーザーのリソースへのアクセスは404を返す（403ではなく）

### フロントエンドについて
- コンポーネントは `features/` 配下に機能単位で配置する
- API通信は `src/api/` に集約し、コンポーネント内で直接fetchしない
- 認証状態は `authStore.ts`（Zustand）で一元管理する
- ワークスペース選択状態は `workspaceStore.ts`（Zustand）で管理する
- トークンは localStorage に保存する
- `VITE_API_BASE_URL` 環境変数を baseURL として使用する（ハードコード禁止）

### フロントエンドのデザインについて
- グラデーション背景禁止
- グラスモーフィズム・発光エフェクト禁止
- 絵文字をデザイン要素として使わない
- ブランドカラー（#6366f1）はボタン・アクセントのみ
- 背景色：白（#ffffff）またはごく薄いグレー（#f7f7f8）のみ

---

## 9. ビジネスルール

| ルール | 詳細 |
|---|---|
| フリートライアル期間 | 登録日から30日間、全機能無制限 |
| 無料プラン（トライアル後） | ワークスペース2つまで・累計50枚まで・名刺表面のみ |
| Proプラン（¥980/月） | ワークスペース無制限・累計枚数無制限・表裏両面 |
| 生涯累計のカウント対象 | 削除済み名刺も含む |
| ゴミ箱の保持期間 | 削除から7日間（168時間） |
| 自動物理削除 | Djangoカスタムコマンド `purge_deleted_cards` をcronで実行 |
| 決済 | Stripe（手数料3.6% + Billing 0.5% → ¥980の手取り約¥940） |

---

## 10. 環境変数一覧

### backendサービス
```bash
# Django（手動設定）
SECRET_KEY=
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=your-backend.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app

# Database（Railwayが自動注入）
DATABASE_URL=

# Redis（Railwayが自動注入・STEP 10から必要）
REDIS_URL=

# AI APIs（STEP 10から必要）
GOOGLE_CLOUD_VISION_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
LLM_PROVIDER=gemini

# Stripe（STEP 12から必要）
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# メール（オプション）
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Sentry（オプション）
SENTRY_DSN=

# 将来対応（現時点では不要）
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### frontendサービス
```bash
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

### lpサービス
```bash
# 環境変数不要
```

---

## 11. ランディングページ（LP）

### 概要
- **場所**: `lp/` ディレクトリ（リポジトリルート直下）
- **実装**: HTML + CSS + 最小限のJS（フレームワーク不使用）
- **デプロイ**: Railway の静的ファイル配信サービスとして独立してデプロイ
- **CTA**: 「無料で始める」ボタン → アプリの `/register` へ

### LPに含めるセクション

| セクション | 内容 |
|---|---|
| Hero | キャッチコピー + 「無料で始める」ボタン |
| 課題提起 | 既存サービスで名刺が混在する問題 |
| 機能紹介 | ワークスペース分離 / AI自動読み取り / テーブルUI |
| 料金 | 無料プラン vs Proプラン（¥980/月）の2カラム比較 |
| CTA | 「無料で始める（30日間）」ボタン |
| フッター | © 2025 Saila |

### デザインルール
- 参考トーン：Stripe・Linear のLP
- 背景色：白（#ffffff）とごく薄いグレー（#f7f7f8）のみ
- ブランドカラー（#6366f1）はCTAボタン・アクセントのみ
- グラデーション背景・装飾・絵文字禁止
- h1は最大42px・font-weight: 600止まり
- セクション間の余白：padding 96px 以上
- レスポンシブ対応必須（モバイルファースト）
- OGP / meta タグ必須

### Railway デプロイ設定（LP用）
```toml
[build]
builder = "STATIC"
publishDirectory = "."

[deploy]
startCommand = ""
```

---

## 12. 実装の進捗（1ステップ完了→Railway確認→次へ）

### フェーズ1：土台
- **[x] STEP 1** Django Hello World + `/api/health/` ✅
- **[x] STEP 2** LP（`lp/index.html`）✅

### フェーズ2：認証
- **[x] STEP 3** メール＋パスワード認証バックエンド ✅
- **[x] STEP 4** ログイン・登録画面（React）✅

### フェーズ3：コア機能
- **[x] STEP 5** ワークスペースAPI ✅
- **[x] STEP 6** Layout（サイドバー常時表示・ワークスペース切り替え）✅
- **[x] STEP 7** 名刺モデル + CRUD API ✅
- **[x] STEP 8** 名刺テーブルUI（直接編集・サムネイル・ホバープレビュー）✅
- **[x] STEP 9** 名刺アップロードUI（ドラッグ&ドロップ）✅

### フェーズ4：AI機能
- **[ ] STEP 10** AI解析（Vision API → Gemini/OpenAI）+ Celery + Redis ← 次

### フェーズ5：運用
- **[ ] STEP 11** `purge_deleted_cards` コマンド（7日経過分の物理削除）

### フェーズ6：マネタイズ
- **[ ] STEP 12** Stripe決済連携（Proプラン）

---

## 13. Railwayサービス構成

```
Railwayプロジェクト「saila」
├── backend    （Djangoアプリ・gunicorn）
├── frontend   （Reactアプリ・Node.js 22）
├── lp         （静的HTML・STATIC builder）
├── db         （PostgreSQL・Railway managed）
└── redis      （Redis・STEP 10から追加）
```

### 環境変数の流れ
- `DATABASE_URL` → Railway が backend に自動注入
- `REDIS_URL` → Railway が backend に自動注入（STEP 10から）
- `VITE_API_BASE_URL` → frontend に手動設定（`https://backendのURL/api`）
- `CORS_ALLOWED_ORIGINS` → backend に手動設定（`https://frontendのURL`）