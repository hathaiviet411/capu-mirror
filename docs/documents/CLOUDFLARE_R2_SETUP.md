# Cloudflare R2 セットアップガイド

## 概要

Capu-appでは、システム構成図.mdに従い、画像・ファイルストレージとしてCloudflare R2を使用しています。
Cloudflare R2はS3互換のオブジェクトストレージサービスで、グローバルCDNと低コストが特徴です。

## 実装済み機能

### ✅ 実装完了
- **ファイルアップロード**: Presigned URLによる安全なアップロード
- **画像処理**: Sharp.jsによるリサイズ・圧縮・クロップ
- **サムネイル生成**: 自動的なサムネイル生成と保存
- **ファイル削除**: 完全なファイル削除機能
- **アクセス制御**: ユーザー別・カテゴリ別アクセス制御
- **型安全性**: tRPCによる完全な型安全API

### 📁 サポートされるファイルカテゴリ
- `PROFILE`: プロフィール画像（jpeg, png, webp）
- `SERVICE`: サービス関連画像（jpeg, png, webp）
- `MESSAGE`: メッセージ添付ファイル（jpeg, png, webp, pdf）
- `DOCUMENT`: 本人確認書類（pdf, jpeg, png）

## Cloudflare R2セットアップ手順

### 1. Cloudflare R2アカウント作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にアクセス
2. R2 Object Storageを有効化
3. バケットを作成（例: `capu-app-storage`）

### 2. API トークン作成

1. Cloudflare Dashboardで「マイプロファイル」→「API トークン」
2. 「カスタムトークン」を作成
3. 権限設定:
   - Zone: `Zone:Read`（オプション）
   - Account: `Cloudflare R2:Edit`

### 3. R2設定情報取得

1. R2ダッシュボードでバケット詳細を確認
2. 以下の情報を取得:
   - Account ID
   - Access Key ID  
   - Secret Access Key
   - Bucket Name
   - Public URL（Custom Domainがある場合）

### 4. 環境変数設定

`.env`ファイルに以下を追加:

```bash
# Cloudflare R2 Storage
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="capu-app-storage"
R2_PUBLIC_URL="https://your-custom-domain.com"
```

### 5. パッケージインストール

```bash
# キャストアプリ
cd apps/cast && pnpm install

# ゲストアプリ  
cd apps/guest && pnpm install
```

## API使用方法

### ファイルアップロード

```typescript
// 1. アップロードURL取得
const { uploadUrl, fileKey, fileId } = await api.file.getUploadUrl.mutate({
  fileName: "profile.jpg",
  fileType: "image/jpeg", 
  fileSize: 1024000,
  category: "PROFILE",
  isPublic: false
});

// 2. ファイルアップロード（フロントエンド）
const response = await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});

// 3. アップロード完了確認
await api.file.confirmUpload.mutate({
  fileId,
  fileKey
});
```

### ファイル取得

```typescript
// ファイルURL取得（Presigned URL）
const { url, expiresAt } = await api.file.getFileUrl.query({
  fileKey: "profile/user123/1234567890-profile.jpg",
  expiresIn: 3600 // 1時間
});
```

### 画像処理

```typescript
// 画像リサイズ・圧縮
const result = await api.file.processImage.mutate({
  fileKey: "profile/user123/1234567890-profile.jpg",
  operations: [
    { type: "resize", width: 300, height: 300 },
    { type: "compress", quality: 80 }
  ]
});
```

## ファイル構造

```
R2 Bucket/
├── profile/           # プロフィール画像
│   └── {userId}/
│       └── {timestamp}-{filename}
├── service/           # サービス画像  
├── message/           # メッセージ添付
├── document/          # 本人確認書類
├── thumbnails/        # 自動生成サムネイル
│   └── {original-path}
└── processed/         # 処理済み画像
    └── {original-path}
```

## セキュリティ

### アクセス制御
- ファイルは原則非公開
- Presigned URLによる一時的アクセス許可
- ユーザー別アクセス制御
- 管理者のみ全ファイルアクセス可能

### ファイル制限
- 最大ファイルサイズ: 10MB
- 許可されたMIMEタイプのみ
- カテゴリ別ファイル形式制限

## 料金

Cloudflare R2の料金体系:
- ストレージ: $0.015/GB/月
- Class A操作: $4.50/百万リクエスト
- Class B操作: $0.36/百万リクエスト
- 転送料金: 無料（Cloudflare経由）

## トラブルシューティング

### よくあるエラー

1. **環境変数未設定**
   ```
   Error: R2_ACCOUNT_ID is required
   ```
   → `.env`ファイルに必要な環境変数を設定

2. **権限エラー**
   ```
   Error: Access Denied
   ```
   → API トークンの権限を確認

3. **バケット名エラー**
   ```
   Error: NoSuchBucket
   ```
   → バケット名と地域を確認

### デバッグ方法

```typescript
// ログ確認
console.log("R2 Client Config:", {
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  bucket: env.R2_BUCKET_NAME
});
```

## 開発vs本番環境

### 開発環境
- 開発用バケットを使用
- デバッグログ有効
- 緩い制限設定

### 本番環境  
- 本番用バケット
- ログレベル調整
- 厳密なセキュリティ設定
- CDN最適化

---

**作成日**: 2024年12月  
**更新日**: 2024年12月  
**作成者**: Capu開発チーム  
**参照**: [システム構成図.md](../designs/システム構成図.md) 