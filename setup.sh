#!/bin/bash

# Capu-app T3 Stack Development Setup Script
# 天才エンジニアによる最高の開発環境構築スクリプト 🚀

echo "🎉 Capu-app T3 Stack 開発環境セットアップを開始します！"
echo "=============================================="

# 1. 依存関係のインストール
echo "📦 依存関係をインストールしています..."
pnpm install

# 2. 環境変数ファイルの作成
echo "🔧 環境変数ファイルを作成しています..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/capu_db?schema=public"

# Next Auth
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Next Auth Discord Provider (optional)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Stripe (決済処理用)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Cloudflare R2 Storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# Node環境
NODE_ENV="development"
EOF
    echo "✅ .env ファイルが作成されました"
else
    echo "⚠️  .env ファイルが既に存在します"
fi

# 3. Dockerコンテナの起動
echo "🐳 Dockerコンテナを起動しています..."
docker-compose up -d db redis

# 4. データベースの初期化を待機
echo "⏳ データベースの準備を待機しています..."
sleep 10

# 5. Prismaのセットアップ
echo "🗄️  Prismaデータベースをセットアップしています..."
pnpm prisma generate
pnpm prisma db push

# 6. 開発サーバーの起動
echo "🚀 開発サーバーを起動しています..."
echo "=============================================="
echo "✅ セットアップが完了しました！"
echo ""
echo "📱 アプリケーション: http://localhost:3000"
echo "🗄️  Prisma Studio: http://localhost:5555"
echo "🐘 PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "開発を開始するには以下のコマンドを実行してください："
echo "pnpm dev"
echo ""
echo "Happy coding! 🎨✨" 