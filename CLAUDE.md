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
  # --- 共通開発環境 ---/
  dev_env:
    monorepo: Turbo + pnpm
    package_manager: pnpm
    linter: ESLint + TypeScript ESLint

directory_structure: |
  Capu-app_new/
  ├── apps/
  │   ├── cast/                     # キャストアプリケーション (port 3000)
  │   │   ├── src/
  │   │   │   ├── components/
  │   │   │   │   ├── ui/          # shadcn/ui コンポーネント
  │   │   │   │   └── shared/      # 共有コンポーネント
  │   │   │   ├── server/
  │   │   │   │   ├── api/routers/ # tRPC ルーター
  │   │   │   │   ├── auth.ts      # 認証設定
  │   │   │   │   └── api/trpc.ts  # tRPC セットアップ
  │   │   │   └── utils/
  │   │   │       └── api.ts       # API ユーティリティ
  │   │   └── env.js               # 環境設定
  │   └── guest/                   # ゲストアプリケーション (port 3001)
  │       └── [同様の構造]
  ├── prisma/
  │   ├── schema.prisma            # データベーススキーマ
  │   └── migrations/              # マイグレーション
  ├── Capu-docs/                   # プロジェクトドキュメント
  │   ├── Design/
  │   │   ├── システム構成図.md
  │   │   └── 画面処理・影響定義書/
  │   └── Docs/
  │       └── 技術スタック.md
  └── packages/                    # 共有パッケージ（もしあれば）

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