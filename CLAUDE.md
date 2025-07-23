# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコードを扱う際のガイダンスを提供します。

project:
  # --- プロジェクト概要 ---
  name: Capu
  repo_name: Capu-app_new
  type: モノレポ構成のフルスタックアプリケーション
  overview: >
    Capuは、キャストとゲストをマッチングするプラットフォームアプリです。
    Next.js 14 + tRPC によるフルスタック TypeScript 構成で、
    認証には NextAuth.js、決済には Stripe を利用し、
    キャストアプリとゲストアプリを別々のポートで提供しています。
  key_features:
    - キャスト・ゲストマッチングシステム
    - 予約・メッセージング機能
    - 決済・レビューシステム
    - NextAuth.js 認証（Credentials + Discord OAuth）

tech_stack:
  # --- フロントエンド ---
  frontend:
    framework: Next.js 14 (App Router)
    language: TypeScript 5
    styling: Tailwind CSS
    ui: shadcn/ui components + Radix UI
    icons: Lucide React
    charts: Recharts
    forms: React Hook Form + Zod validation
  # --- バックエンド ---
  backend:
    api: tRPC (Type-Safe Full Stack)
    database: PostgreSQL + Prisma ORM
    auth: NextAuth.js (Credentials + Discord OAuth)
    payments: Stripe
    validation: Zod
  # --- 共通開発環境 ---
  dev_env:
    monorepo: Turbo + pnpm
    package_manager: pnpm
    linter: ESLint + TypeScript ESLint

directory_structure: |
  .
  ├── apps
  │   ├── cast
  │   │   ├── app
  │   │   │   ├── globals.css
  │   │   │   ├── layout.tsx
  │   │   │   └── page.tsx
  │   │   ├── components
  │   │   │   ├── account-settings.tsx
  │   │   │   ├── area-selection-modal.tsx
  │   │   │   ├── basic-info-screen.tsx
  │   │   │   ├── card-registration.tsx
  │   │   │   ├── cast-detail-modal.tsx
  │   │   │   ├── chat-options-modal.tsx
  │   │   │   ├── field-edit-screen.tsx
  │   │   │   ├── help-screen.tsx
  │   │   │   ├── home-screen.tsx
  │   │   │   ├── id-verification.tsx
  │   │   │   ├── id-verify-complete.tsx
  │   │   │   ├── joined-casts-screen.tsx
  │   │   │   ├── login-modal.tsx
  │   │   │   ├── message-detail-screen.tsx
  │   │   │   ├── message-list-screen.tsx
  │   │   │   ├── mypage-screen.tsx
  │   │   │   ├── notification-screen.tsx
  │   │   │   ├── payment-detail-screen.tsx
  │   │   │   ├── payment-info-screen.tsx
  │   │   │   ├── point-history-screen.tsx
  │   │   │   ├── profile-edit-screen.tsx
  │   │   │   ├── profile-preview-screen.tsx
  │   │   │   ├── receipt-generator.tsx
  │   │   │   ├── revenue-dashboard.tsx
  │   │   │   ├── schedule-modal.tsx
  │   │   │   ├── search-modal.tsx
  │   │   │   ├── settings-screen.tsx
  │   │   │   ├── shared
  │   │   │   │   ├── footer.tsx
  │   │   │   │   └── notification-icon.tsx
  │   │   │   ├── signup-modal.tsx
  │   │   │   ├── simple-profile-tag-modal.tsx
  │   │   │   ├── tag-selection-modal.tsx
  │   │   │   ├── theme-provider.tsx
  │   │   │   ├── transaction-history.tsx
  │   │   │   ├── ui
  │   │   │   │   ├── accordion.tsx
  │   │   │   │   ├── alert-dialog.tsx
  │   │   │   │   ├── alert.tsx
  │   │   │   │   ├── aspect-ratio.tsx
  │   │   │   │   ├── avatar.tsx
  │   │   │   │   ├── badge.tsx
  │   │   │   │   ├── breadcrumb.tsx
  │   │   │   │   ├── button.tsx
  │   │   │   │   ├── calendar.tsx
  │   │   │   │   ├── card.tsx
  │   │   │   │   ├── carousel.tsx
  │   │   │   │   ├── chart.tsx
  │   │   │   │   ├── checkbox.tsx
  │   │   │   │   ├── collapsible.tsx
  │   │   │   │   ├── command.tsx
  │   │   │   │   ├── context-menu.tsx
  │   │   │   │   ├── dialog.tsx
  │   │   │   │   ├── drawer.tsx
  │   │   │   │   ├── dropdown-menu.tsx
  │   │   │   │   ├── form.tsx
  │   │   │   │   ├── hover-card.tsx
  │   │   │   │   ├── input-otp.tsx
  │   │   │   │   ├── input.tsx
  │   │   │   │   ├── label.tsx
  │   │   │   │   ├── menubar.tsx
  │   │   │   │   ├── navigation-menu.tsx
  │   │   │   │   ├── pagination.tsx
  │   │   │   │   ├── popover.tsx
  │   │   │   │   ├── progress.tsx
  │   │   │   │   ├── radio-group.tsx
  │   │   │   │   ├── resizable.tsx
  │   │   │   │   ├── scroll-area.tsx
  │   │   │   │   ├── select.tsx
  │   │   │   │   ├── separator.tsx
  │   │   │   │   ├── sheet.tsx
  │   │   │   │   ├── sidebar.tsx
  │   │   │   │   ├── skeleton.tsx
  │   │   │   │   ├── slider.tsx
  │   │   │   │   ├── sonner.tsx
  │   │   │   │   ├── switch.tsx
  │   │   │   │   ├── table.tsx
  │   │   │   │   ├── tabs.tsx
  │   │   │   │   ├── textarea.tsx
  │   │   │   │   ├── toast.tsx
  │   │   │   │   ├── toaster.tsx
  │   │   │   │   ├── toggle-group.tsx
  │   │   │   │   ├── toggle.tsx
  │   │   │   │   ├── tooltip.tsx
  │   │   │   │   ├── use-mobile.tsx
  │   │   │   │   └── use-toast.ts
  │   │   │   └── withdrawal-request.tsx
  │   │   ├── components.json
  │   │   ├── hooks
  │   │   │   ├── use-mobile.tsx
  │   │   │   └── use-toast.ts
  │   │   ├── lib
  │   │   │   └── utils.ts
  │   │   ├── next.config.mjs
  │   │   ├── package.json
  │   │   ├── pnpm-lock.yaml
  │   │   ├── postcss.config.mjs
  │   │   ├── public
  │   │   │   ├── capu-logo.png
  │   │   │   ├── capu-logo.svg
  │   │   │   ├── placeholder-logo.png
  │   │   │   ├── placeholder-logo.svg
  │   │   │   ├── placeholder-user.jpg
  │   │   │   ├── placeholder.jpg
  │   │   │   └── placeholder.svg
  │   │   ├── src
  │   │   │   ├── env.js
  │   │   │   ├── pages
  │   │   │   │   └── api
  │   │   │   │       ├── auth
  │   │   │   │       │   └── [...nextauth].ts
  │   │   │   │       └── trpc
  │   │   │   │           └── [trpc].ts
  │   │   │   ├── server
  │   │   │   │   ├── __tests__
  │   │   │   │   │   └── auth.test.ts
  │   │   │   │   ├── api
  │   │   │   │   │   ├── root.ts
  │   │   │   │   │   ├── routers
  │   │   │   │   │   │   ├── booking.ts
  │   │   │   │   │   │   ├── cast.ts
  │   │   │   │   │   │   ├── post.ts
  │   │   │   │   │   │   └── user.ts
  │   │   │   │   │   └── trpc.ts
  │   │   │   │   ├── auth.ts
  │   │   │   │   └── db.ts
  │   │   │   └── utils
  │   │   │       └── api.ts
  │   │   ├── styles
  │   │   │   └── globals.css
  │   │   ├── tailwind.config.ts
  │   │   ├── tsconfig.json
  │   │   └── vercel.json
  │   └── guest
  │       ├── app
  │       │   ├── globals.css
  │       │   ├── layout.tsx
  │       │   └── page.tsx
  │       ├── components
  │       │   ├── area-selection-modal.tsx
  │       │   ├── basic-info-screen.tsx
  │       │   ├── card-registration.tsx
  │       │   ├── cast-detail-modal.tsx
  │       │   ├── chat-options-modal.tsx
  │       │   ├── field-edit-screen.tsx
  │       │   ├── help-screen.tsx
  │       │   ├── home-screen.tsx
  │       │   ├── id-verification.tsx
  │       │   ├── id-verify-complete.tsx
  │       │   ├── joined-casts-screen.tsx
  │       │   ├── login-modal.tsx
  │       │   ├── message-detail-screen.tsx
  │       │   ├── message-list-screen.tsx
  │       │   ├── mypage-screen.tsx
  │       │   ├── notification-screen.tsx
  │       │   ├── payment-detail-screen.tsx
  │       │   ├── payment-info-screen.tsx
  │       │   ├── point-history-screen.tsx
  │       │   ├── profile-edit-screen.tsx
  │       │   ├── profile-preview-screen.tsx
  │       │   ├── receipt-generator.tsx
  │       │   ├── schedule-modal.tsx
  │       │   ├── search-modal.tsx
  │       │   ├── settings-screen.tsx
  │       │   ├── shared
  │       │   │   ├── footer.tsx
  │       │   │   └── notification-icon.tsx
  │       │   ├── signup-modal.tsx
  │       │   ├── simple-profile-tag-modal.tsx
  │       │   ├── tag-selection-modal.tsx
  │       │   ├── theme-provider.tsx
  │       │   └── ui
  │       │       ├── accordion.tsx
  │       │       ├── alert-dialog.tsx
  │       │       ├── alert.tsx
  │       │       ├── aspect-ratio.tsx
  │       │       ├── avatar.tsx
  │       │       ├── badge.tsx
  │       │       ├── breadcrumb.tsx
  │       │       ├── button.tsx
  │       │       ├── calendar.tsx
  │       │       ├── card.tsx
  │       │       ├── carousel.tsx
  │       │       ├── chart.tsx
  │       │       ├── checkbox.tsx
  │       │       ├── collapsible.tsx
  │       │       ├── command.tsx
  │       │       ├── context-menu.tsx
  │       │       ├── dialog.tsx
  │       │       ├── drawer.tsx
  │       │       ├── dropdown-menu.tsx
  │       │       ├── form.tsx
  │       │       ├── hover-card.tsx
  │       │       ├── input-otp.tsx
  │       │       ├── input.tsx
  │       │       ├── label.tsx
  │       │       ├── menubar.tsx
  │       │       ├── navigation-menu.tsx
  │       │       ├── pagination.tsx
  │       │       ├── popover.tsx
  │       │       ├── progress.tsx
  │       │       ├── radio-group.tsx
  │       │       ├── resizable.tsx
  │       │       ├── scroll-area.tsx
  │       │       ├── select.tsx
  │       │       ├── separator.tsx
  │       │       ├── sheet.tsx
  │       │       ├── sidebar.tsx
  │       │       ├── skeleton.tsx
  │       │       ├── slider.tsx
  │       │       ├── sonner.tsx
  │       │       ├── switch.tsx
  │       │       ├── table.tsx
  │       │       ├── tabs.tsx
  │       │       ├── textarea.tsx
  │       │       ├── toast.tsx
  │       │       ├── toaster.tsx
  │       │       ├── toggle-group.tsx
  │       │       ├── toggle.tsx
  │       │       ├── tooltip.tsx
  │       │       ├── use-mobile.tsx
  │       │       └── use-toast.ts
  │       ├── components.json
  │       ├── hooks
  │       │   ├── use-mobile.tsx
  │       │   └── use-toast.ts
  │       ├── lib
  │       │   └── utils.ts
  │       ├── next.config.mjs
  │       ├── package.json
  │       ├── postcss.config.mjs
  │       ├── public
  │       │   ├── capu-logo.png
  │       │   ├── capu-logo.svg
  │       │   ├── placeholder-logo.png
  │       │   ├── placeholder-logo.svg
  │       │   ├── placeholder-user.jpg
  │       │   ├── placeholder.jpg
  │       │   └── placeholder.svg
  │       ├── src
  │       │   ├── env.js
  │       │   ├── pages
  │       │   │   └── api
  │       │   │       ├── auth
  │       │   │       │   └── [...nextauth].ts
  │       │   │       └── trpc
  │       │   │           └── [trpc].ts
  │       │   ├── server
  │       │   │   ├── __tests__
  │       │   │   │   └── auth.test.ts
  │       │   │   ├── api
  │       │   │   │   ├── root.ts
  │       │   │   │   ├── routers
  │       │   │   │   │   ├── booking.ts
  │       │   │   │   │   ├── cast.ts
  │       │   │   │   │   ├── post.ts
  │       │   │   │   │   └── user.ts
  │       │   │   │   └── trpc.ts
  │       │   │   ├── auth.ts
  │       │   │   └── db.ts
  │       │   └── utils
  │       │       └── api.ts
  │       ├── styles
  │       │   └── globals.css
  │       ├── tailwind.config.ts
  │       ├── tsconfig.json
  │       └── vercel.json
  ├── CLAUDE.md
  ├── docker-compose.yml
  ├── Dockerfile
  ├── docs
  │   ├── Design
  │   │   └── 認証フロー設計.md
  │   ├── designs
  │   │   ├── シーケンス図.md
  │   │   ├── システム構成図.md
  │   │   ├── 業務フロー.md
  │   │   └── 画面処理・影響定義書
  │   │       ├── CAS-01_ログイン画面.md
  │   │       ├── CAS-02_ホーム画面.md
  │   │       ├── CAS-03_検索モーダル.md
  │   │       ├── CAS-04_ゲスト詳細モーダル.md
  │   │       ├── CAS-05_メッセージ一覧画面.md
  │   │       ├── CAS-06_メッセージ詳細画面.md
  │   │       ├── CAS-07_通知画面.md
  │   │       ├── CAS-08_ニュース詳細モーダル.md
  │   │       ├── CAS-09_収益ダッシュボード画面.md
  │   │       ├── CAS-10_マイページ画面.md
  │   │       ├── CAS-11_プロフィール編集画面.md
  │   │       ├── CAS-12_引き出し申請画面.md
  │   │       ├── CAS-13_取引履歴画面.md
  │   │       ├── CAS-14_口座設定画面.md
  │   │       ├── CAS-15_ヘルプ画面.md
  │   │       ├── CAS-16_設定画面.md
  │   │       ├── GUE-01_ログイン画面.md
  │   │       ├── GUE-02_ホーム画面.md
  │   │       ├── GUE-03_検索モーダル.md
  │   │       ├── GUE-04_キャスト詳細モーダル.md
  │   │       ├── GUE-05_通知画面.md
  │   │       ├── GUE-06_メッセージ一覧画面.md
  │   │       ├── GUE-07_メッセージ詳細画面.md
  │   │       ├── GUE-08_ニュース詳細モーダル.md
  │   │       ├── GUE-09_合流キャスト画面.md
  │   │       ├── GUE-10_マイページ画面.md
  │   │       ├── GUE-11_プロフィール編集画面.md
  │   │       ├── GUE-12_設定画面.md
  │   │       ├── GUE-13_ポイント履歴画面.md
  │   │       ├── GUE-14_支払い情報画面.md
  │   │       ├── GUE-15_本人確認画面.md
  │   │       ├── GUE-16_ヘルプ画面.md
  │   │       ├── テンプレート.md
  │   │       └── ドキュメント作成手順.md
  │   └── documents
  │       ├── API振り分け判定基準.md
  │       ├── Github-Issue-Context.md
  │       ├── Github-Issue-Samples.md
  │       ├── Github-Issue-Templates.md
  │       ├── Issue実行手順書.md
  │       ├── LINE_OAUTH_SETUP.md
  │       ├── PR作成手順書.md
  │       ├── Vercelデプロイ手順書.md
  │       ├── タスク進捗管理.md
  │       ├── 技術スタック.md
  │       └── 本人確認書類_.md
  ├── init.sql
  ├── package.json
  ├── packages
  │   └── shared
  │       ├── components
  │       │   ├── common
  │       │   │   └── index.ts
  │       │   └── index.ts
  │       ├── lib
  │       │   ├── index.ts
  │       │   └── utils.ts
  │       ├── package.json
  │       ├── styles
  │       │   ├── globals.css
  │       │   └── index.ts
  │       └── tsconfig.json
  ├── pnpm-lock.yaml
  ├── pnpm-workspace.yaml
  ├── prisma
  │   └── schema.prisma
  ├── README.md
  ├── scripts
  │   └── test-line-oauth.js
  ├── setup.sh
  └── turbo.json

database_design:
  models:
    - User: { fields: [userType (GUEST/CAST/ADMIN)] }
    - CastProfile: { fields: [料金, スケジュール, 写真] }
    - Booking: { fields: [ゲスト, キャスト, 予約情報] }
    - Message: { fields: [予約内メッセージング] }
    - Payment: { fields: [Stripe決済] }
    - Review: { fields: [評価・レビュー] }
    - Account: { fields: [NextAuth.js モデル] }
    - Session: { fields: [NextAuth.js モデル] }

workflows:
  setup_commands:
    - pnpm install
    - pnpm db:generate
    - cp .env.example .env
  dev_server_commands:
    both_apps:
      - pnpm dev                    # 両アプリケーション起動
    individual:
      - pnpm dev:cast              # キャストアプリ（port 3000）
      - pnpm dev:guest             # ゲストアプリ（port 3001）
  build_commands:
    - pnpm build                   # 全アプリビルド
    - pnpm build:cast              # キャストアプリのみビルド
    - pnpm build:guest             # ゲストアプリのみビルド
  quality_commands:
    - pnpm lint                    # リンティング
  db_commands:
    - pnpm db:push                 # スキーマをデータベースにプッシュ
    - pnpm db:generate             # Prismaクライアント生成
    - pnpm db:migrate              # マイグレーション実行
    - pnpm db:studio               # Prisma Studio起動
    - pnpm db:seed                 # データベースシード

auth_system:
  provider: NextAuth.js
  strategies:
    - Credentials (メール/パスワード)
    - Discord OAuth
  session_strategy: JWT
  user_type_handling: カスタムセッション処理
  adapter: Prismaアダプター
  custom_pages: サインイン/サインアップページ

architecture:
  monorepo:
    - Turborepo + pnpm workspaces使用
    - ルートレベルでPrismaスキーマを共有
    - キャストとゲスト用に別々のNext.jsアプリ
    - 両アプリが同じデータベースとAPI構造を共有
  api_architecture:
    - フルスタックTypeScriptによる型安全API
    - ルーター: user, cast, booking, post
    - 保護されたプロシージャとパブリックプロシージャ
    - キャストアプリとゲストアプリ間で共有
  component_architecture:
    - components/ui/ にshadcn/uiコンポーネント
    - -screen サフィックス付きスクリーンコンポーネント
    - -modal サフィックス付きモーダルコンポーネント
    - components/shared/ に共有コンポーネント
    - Tailwind CSSによるレスポンシブデザイン

testing_guidelines:
  framework: フレームワーク固有のコマンドでテスト実行（package.jsonを確認）
  requirements:
    - コミット前に型チェックの通過を確認
    - キャストアプリとゲストアプリ両方の機能をテスト

deployment:
  cast_app: Vercelデプロイメント
  guest_app: Vercelデプロイメント
  database: PostgreSQL（おそらくSupabaseまたは類似）
  requirements: 認証とデータベース接続用の環境変数が必要

key_config_files:
  - prisma/schema.prisma
  - src/server/auth.ts
  - src/server/api/trpc.ts
  - src/env.js
  - src/utils/api.ts

code_conventions:
  language: TypeScript
  file_naming:
    components: kebab-case (例: cast-detail-modal.tsx)
    screens: -screen サフィックス (例: home-screen.tsx)
    modals: -modal サフィックス (例: search-modal.tsx)
    api_routes: kebab-case (例: [...nextauth].ts)
  typescript:
    - 厳密な型チェック有効
    - Prisma生成型を使用
    - ランタイム検証にZod
    - any型の使用を避ける
  styling:
    - 全スタイリングにTailwind CSS
    - shadcn/uiコンポーネントを使用
    - モバイルファーストレスポンシブデザイン
    - 一貫したスペーシングと色
  state_management:
    - サーバー状態にtRPC
    - フォーム状態にReact Hook Form
    - ローカルコンポーネント状態にuseState/useReducer

development_guidelines:
  auth_flow:
    - 保護されたルートはセッションチェックを使用
    - ユーザータイプがアプリアクセスを決定（GUEST vs CAST）
    - サインイン/サインアップ用カスタム認証ページ
  database_development:
    - 開発用スキーマ変更には pnpm db:push を使用
    - 本番対応マイグレーションには pnpm db:migrate を使用
    - スキーマ変更後は常に pnpm db:generate を実行
    - データベース検査にPrisma Studioを使用

documentation_reference:
  - システムアーキテクチャ: Capu-docs/Design/システム構成図.md
  - 画面仕様: Capu-docs/Design/画面処理・影響定義書/
  - 技術ドキュメント: Capu-docs/Docs/技術スタック.md