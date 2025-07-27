#!/bin/bash

# Capu-app T3 Stack Development Setup Script
# The ultimate development environment setup script by a genius engineer 🚀

echo "🎉 Starting the Capu-app T3 Stack development environment setup!"
echo "=============================================="

# 1. Installing dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Creating the environment variables file
echo "🔧 Creating environment variables file..."
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

# Stripe (for payment processing)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Cloudflare R2 Storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# Node environment
NODE_ENV="development"
EOF
    echo "✅ .env file has been created"
else
    echo "⚠️ .env file already exists"
fi

# 3. Starting Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d db redis

# 4. Waiting for the database initialization
echo "⏳ Waiting for the database to be ready..."
sleep 10

# 5. Setting up Prisma
echo "🗄️ Setting up Prisma database..."
pnpm prisma generate
pnpm prisma db push

# 6. Starting the development server
echo "🚀 Starting the development server..."
echo "=============================================="
echo "✅ Setup is complete!"
echo ""
echo "📱 Application: http://localhost:3000"
echo "🗄️ Prisma Studio: http://localhost:5555"
echo "🐘 PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "To start development, run the following command:"
echo "pnpm dev"
echo ""
echo "Happy coding! 🎨✨"
