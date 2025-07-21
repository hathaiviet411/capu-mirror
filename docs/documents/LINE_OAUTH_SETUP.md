# LINE OAuth設定手順

## 1. LINE Developer Console設定

### 開発環境用チャンネル作成
1. [LINE Developers Console](https://developers.line.biz/console/)にログイン
2. 新しいプロバイダーを作成（例：`Capu-Dev`）
3. LINE Loginチャンネルを作成
4. チャンネル設定：
   - **コールバックURL**: `http://localhost:3001/api/auth/callback/line`
   - **スコープ**: `profile`, `openid`
   - **Channel ID**と**Channel Secret**をメモ

### 本番環境用チャンネル作成
1. 別のLINE Loginチャンネルを作成（例：`Capu-Prod`）
2. チャンネル設定：
   - **コールバックURL**: `https://your-domain.com/api/auth/callback/line`
   - **スコープ**: `profile`, `openid`
   - **Channel ID**と**Channel Secret**をメモ

## 2. 環境変数設定

### 開発環境
`.env.development`ファイルを編集：
```bash
LINE_CLIENT_ID="開発環境のChannel ID"
LINE_CLIENT_SECRET="開発環境のChannel Secret"
NEXTAUTH_URL="http://localhost:3001"
```

### 本番環境
`.env.production`ファイルまたはVercelの環境変数に設定：
```bash
LINE_CLIENT_ID="本番環境のChannel ID"
LINE_CLIENT_SECRET="本番環境のChannel Secret"
NEXTAUTH_URL="https://your-domain.com"
```

## 3. 環境別テスト方法

### 開発環境でのテスト
```bash
# 開発環境で起動
pnpm dev:guest

# ブラウザで確認
http://localhost:3001/api/auth/signin
```

### 本番環境でのテスト
```bash
# 本番ビルドとテスト
pnpm build:guest
pnpm start:guest

# または Vercel にデプロイ
```

## 4. 環境別のコールバックURL

| 環境 | コールバックURL |
|------|----------------|
| 開発環境 | `http://localhost:3001/api/auth/callback/line` |
| 本番環境 | `https://your-domain.com/api/auth/callback/line` |

## 5. 注意点

- 開発環境と本番環境では**異なるLINE Loginチャンネル**を使用
- 各環境のコールバックURLを正確に設定
- 本番環境では必ずHTTPS使用
- 環境変数の値を`.env`ファイルにコミットしない