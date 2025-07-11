# Vercelデプロイ手順書

## 概要
このドキュメントは、Capuアプリ（キャスト用・ゲスト用）をVercelにデプロイする手順をまとめたものです。

## プロジェクト構成

```
Capu-app_new/
├── apps/
│   ├── cast/          # キャスト用アプリ
│   │   ├── vercel.json
│   │   ├── package.json
│   │   └── ...
│   └── guest/         # ゲスト用アプリ
│       ├── vercel.json
│       ├── package.json
│       └── ...
├── packages/
├── pnpm-workspace.yaml
└── turbo.json
```

## Vercelプロジェクト設定

### キャスト用アプリ（capu-cast）
- **プロジェクト名**: capu-cast
- **Root Directory**: `apps/cast`
- **Framework**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install --no-frozen-lockfile`

### ゲスト用アプリ（capu-app）
- **プロジェクト名**: capu-app
- **Root Directory**: `apps/guest`
- **Framework**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install --no-frozen-lockfile`

## デプロイ手順

### 1. 事前準備

```bash
# プロジェクトルートディレクトリに移動
cd /Users/kohei/Documents/Saikashu/Capu-app_new

# 依存関係のインストール
pnpm install

# 各アプリのローカルビルド確認
cd apps/cast && pnpm build
cd ../guest && pnpm build
cd ../..
```

### 2. キャスト用アプリのデプロイ

```bash
# ルートディレクトリから実行（重要）
cd /Users/kohei/Documents/Saikashu/Capu-app_new

# 既存の.vercelディレクトリを削除（必要に応じて）
rm -rf .vercel

# capu-castプロジェクトにリンク
npx vercel link
# → capu's projects を選択
# → capu-cast を選択

# 本番環境にデプロイ
npx vercel --prod
```

### 3. ゲスト用アプリのデプロイ

```bash
# ルートディレクトリから実行（重要）
cd /Users/kohei/Documents/Saikashu/Capu-app_new

# 既存の.vercelディレクトリを削除
rm -rf .vercel

# capu-appプロジェクトにリンク
npx vercel link
# → capu's projects を選択
# → capu-app を選択

# 本番環境にデプロイ
npx vercel --prod
```

## 重要な注意点

### ❌ 間違った実行方法
```bash
# 各アプリディレクトリから実行してはいけない
cd apps/cast
npx vercel --prod  # エラーが発生する
```

### ✅ 正しい実行方法
```bash
# 必ずルートディレクトリから実行
cd /Users/kohei/Documents/Saikashu/Capu-app_new
npx vercel --prod
```

### 理由
- Vercelプロジェクトの設定でRoot Directoryが`apps/cast`や`apps/guest`に設定されている
- 各アプリディレクトリから実行すると、`apps/cast/apps/cast`のような存在しないパスを参照してしまう

## 環境変数設定

デプロイ後、Vercelダッシュボードで以下の環境変数を設定してください：

### 必須環境変数
- `DATABASE_URL`: データベース接続URL
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット
- `NEXTAUTH_URL`: アプリケーションURL（本番環境では自動設定）

### オプション環境変数
- `DISCORD_CLIENT_ID`: Discord認証用
- `DISCORD_CLIENT_SECRET`: Discord認証用
- `STRIPE_SECRET_KEY`: Stripe決済用
- `STRIPE_WEBHOOK_SECRET`: Stripeウェブフック用
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe公開キー

## トラブルシューティング

### エラー: "The provided path does not exist"
```
Error: The provided path "~/Documents/Saikashu/Capu-app_new/apps/cast/apps/cast" does not exist
```

**原因**: 実行場所とVercelプロジェクト設定の不一致

**解決方法**:
1. 必ずルートディレクトリから実行する
2. 既存の`.vercel`ディレクトリを削除してから再実行

### ビルドエラー
**解決方法**:
```bash
# 依存関係を再インストール
pnpm install

# ローカルビルドで問題を確認
cd apps/cast && pnpm build
cd ../guest && pnpm build
```

## デプロイ後の確認

### キャスト用アプリ
- URL: https://capu-cast-[hash]-capus-projects-21129c06.vercel.app
- 管理: https://vercel.com/capus-projects-21129c06/capu-cast

### ゲスト用アプリ
- URL: https://capu-app-[hash]-capus-projects-21129c06.vercel.app
- 管理: https://vercel.com/capus-projects-21129c06/capu-app

## 今後の作業フロー

### 通常のデプロイ
```bash
# 1. ルートディレクトリに移動
cd /Users/kohei/Documents/Saikashu/Capu-app_new

# 2. プロジェクトをリンク
npx vercel link

# 3. デプロイ
npx vercel --prod
```

### カスタムドメイン設定
Vercelダッシュボードの各プロジェクト設定で、カスタムドメインを設定できます。

## 参考情報

### Vercelプロジェクト設定URL
- キャスト用: https://vercel.com/capus-projects-21129c06/capu-cast/settings
- ゲスト用: https://vercel.com/capus-projects-21129c06/capu-app/settings

### 関連ファイル
- `apps/cast/vercel.json`: キャスト用アプリのVercel設定
- `apps/guest/vercel.json`: ゲスト用アプリのVercel設定
- `pnpm-workspace.yaml`: Monorepo設定
- `turbo.json`: Turboビルド設定

---
*最終更新: 2025年7月9日* 