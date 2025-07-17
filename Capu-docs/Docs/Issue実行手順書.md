# Issue実行手順書

## 📋 概要

Capuアプリ開発プロジェクトにおけるGitHub Issue実装の標準ワークフローです。Issue開始からPR作成完了までの効率的な実行手順を定義し、開発品質と効率の向上を図ります。

**対象範囲**: Issue実装 → PR作成完了（マージは外部ツールで実施）

---

## 🎯 Issue実行の3フェーズモデル

### フェーズ概要
1. **準備フェーズ**: 環境準備・調査・設計
2. **実装フェーズ**: コーディング・設定・統合
3. **検証フェーズ**: テスト・品質確認・PR作成

---

## 🔄 標準ワークフロー

### 📌 事前準備
```bash
# 最新状態に同期
git checkout main
git pull origin main

# Issue情報の確認（GitHub CLI使用）
gh issue view [ISSUE_NUMBER] --repo saikashu-kato/capu-app

# リポジトリ確認（必要に応じて）
gh repo view saikashu-kato/capu-app

# 認証状態確認（トラブルシューティング用）
gh auth status
```

### 🚀 フェーズ1: 準備フェーズ

#### 1.1 ブランチ作成
```bash
# ブランチ命名規則: feature/[タスクID]-[機能名]
git checkout -b feature/AUTH-01-nextauth-setup

# 例:
# feature/AUTH-01-nextauth-setup
# feature/CAS-02-home-screen
# feature/API-03-user-endpoints
```

#### 1.2 依存関係確認
```bash
# パッケージ状態確認
pnpm install

# 既存設定確認
cat package.json | grep -E "(next-auth|prisma|trpc)"
```

#### 1.3 技術調査・設計
- [ ] Issue受け入れ条件の理解
- [ ] 関連ドキュメントの確認 (`Capu-docs/Design/`)
- [ ] 既存コードの影響範囲調査
- [ ] 実装アプローチの設計

### 🛠️ フェーズ2: 実装フェーズ

#### 2.1 段階的実装
```bash
# 小さな単位でコミット
git add .
git commit -m "feat(auth): NextAuth.js パッケージ追加

- next-auth@4.x のインストール
- 関連型定義の追加

ref: #3"

# 定期的にプッシュ
git push origin feature/AUTH-01-nextauth-setup
```

#### 2.2 実装パターン別手順

##### 🔧 基盤開発系（API・認証・DB）
- [ ] パッケージインストール
- [ ] 設定ファイル作成
- [ ] 環境変数設定
- [ ] 型定義追加
- [ ] 単体テスト実装

##### 🎨 UI/UX開発系（画面・コンポーネント）
- [ ] コンポーネント設計
- [ ] ページルーティング
- [ ] 状態管理実装
- [ ] スタイリング
- [ ] レスポンシブ対応

##### ⚙️ インフラ系（デプロイ・監視）
- [ ] 設定ファイル作成
- [ ] 環境変数管理
- [ ] デプロイ設定
- [ ] 動作確認

#### 2.3 進捗管理
```bash
# Issue 受け入れ条件の進捗更新（GitHubコメント）
gh issue comment [ISSUE_NUMBER] --body "
## 進捗更新
- [x] NextAuth.js パッケージインストール完了
- [x] Credentials Provider設定完了  
- [ ] LINE OAuth Provider設定 (進行中)
- [ ] JWT設定
"
```

### ✅ フェーズ3: 検証フェーズ

#### 3.1 品質確認
```bash
# リンティング
pnpm lint

# 型チェック
pnpm typecheck  # (利用可能な場合)

# テスト実行
pnpm test       # (利用可能な場合)

# ビルド確認
pnpm build
```

#### 3.2 受け入れ条件チェック
**Issue #3 (AUTH-01) の例:**
- [ ] NextAuth.js v4がプロジェクトに正常にインストールされている
- [ ] キャスト用Credentials Providerが設定されている
- [ ] ゲスト用LINE OAuth Providerが設定されている
- [ ] JWT strategy設定が完了している
- [ ] Session strategy設定が完了している
- [ ] 環境変数（NEXTAUTH_SECRET等）が設定されている
- [ ] 単体テストが書かれている
- [ ] 認証フロー設計ドキュメントが記載されている
- [ ] コードレビューが完了している

#### 3.3 最終コミット
```bash
# 最終的な変更をコミット
git add .
git commit -m "feat(auth): NextAuth.js 初期設定完了

- Credentials Provider (キャスト用) 設定
- LINE OAuth Provider (ゲスト用) 設定
- JWT strategy 設定
- Session管理設定
- 環境変数テンプレート追加
- 単体テスト実装

Closes #3"

# 最新状態にプッシュ
git push origin feature/AUTH-01-nextauth-setup
```

#### 3.4 PR作成
```bash
# PR作成（受け入れ条件を本文に含める）
gh pr create --title "[AUTH-01] NextAuth.js初期設定・構成" --body "$(cat <<'EOF'
## 📝 概要
NextAuth.jsを使用したキャスト・ゲスト共通認証基盤の初期設定を実装しました。

## 🎯 実装内容
- キャスト用Credentials認証プロバイダー設定
- ゲスト用LINE OAuth認証プロバイダー設定  
- JWT strategy設定とシークレット管理
- Session strategy設定と有効期限管理
- 認証コールバック処理実装

## ✅ 受け入れ条件チェック
- [x] NextAuth.js v4がプロジェクトに正常にインストールされている
- [x] キャスト用Credentials Providerが設定されている
- [x] ゲスト用LINE OAuth Providerが設定されている
- [x] JWT strategy設定が完了している
- [x] Session strategy設定が完了している
- [x] 環境変数（NEXTAUTH_SECRET等）が設定されている
- [x] 単体テストが書かれている
- [x] 認証フロー設計ドキュメントが記載されている
- [ ] コードレビューが完了している

## 🔍 テスト状況
- [x] リンティング通過
- [x] ビルド成功
- [x] 単体テスト通過

## 📎 関連リンク
- Closes #3
- 関連ドキュメント: [認証システム設計](../Design/システム構成図.md)

## 📋 レビュー観点
- 認証フローの実装が設計通りか
- セキュリティ要件が満たされているか
- JWT・セッション管理が適切か
- テストカバレッジが十分か

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

---

## 📊 実装完了の定義

### ✅ 必須条件
- [ ] すべての受け入れ条件がクリアされている
- [ ] コードレビューの準備が完了している
- [ ] テストが通過している（該当する場合）
- [ ] ビルドが成功している
- [ ] PR作成が完了しレビュー待ち状態

### 🚫 除外事項
- PRのマージ（外部ツールで実施）
- ブランチクリーンアップ（マージ後に実施）

---

## 🎯 Capu固有の実装ポイント

### モノレポ構成対応
```bash
# キャストアプリのみ作業
pnpm dev:cast

# ゲストアプリのみ作業  
pnpm dev:guest

# 両アプリ同時開発
pnpm dev

# 個別ビルド
pnpm build:cast
pnpm build:guest
```

### データベース操作
```bash
# スキーマ変更時
pnpm db:generate  # Prismaクライアント生成
pnpm db:push      # 開発用スキーマプッシュ

# 本番マイグレーション用
pnpm db:migrate   # マイグレーションファイル生成・実行
```

### 技術スタック考慮事項
- **Next.js 14 App Router**: ページルーティングは `app/` ディレクトリ使用
- **tRPC**: API エンドポイントは `src/server/api/routers/` で管理
- **Prisma**: データベース操作は型安全なPrismaクライアント使用
- **Tailwind CSS**: スタイリングはユーティリティクラス使用
- **shadcn/ui**: UIコンポーネントは `components/ui/` から使用

---

## 🛠️ コマンド早見表

### 基本操作
```bash
# Issue開始
git checkout main && git pull origin main
gh issue view [ISSUE_NUMBER] --repo saikashu-kato/capu-app
git checkout -b feature/[TASK-ID]-[description]

# 実装中
git add . && git commit -m "feat: 機能追加"
git push origin feature/[TASK-ID]-[description]

# 品質確認
pnpm lint && pnpm build

# PR作成
gh pr create --title "[TASK-ID] タスク名" --body "PR内容"
```

### GitHub CLI操作
```bash
# Issue関連
gh issue view [ISSUE_NUMBER] --repo saikashu-kato/capu-app
gh issue list --repo saikashu-kato/capu-app
gh issue comment [ISSUE_NUMBER] --body "コメント内容"

# PR関連
gh pr create --title "タイトル" --body "内容"
gh pr list
gh pr view [PR_NUMBER]

# 認証関連
gh auth status
gh auth login
gh repo view saikashu-kato/capu-app
```

### トラブルシューティング
```bash
# 依存関係問題
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 型エラー解決
pnpm db:generate  # Prisma型の再生成

# ビルド失敗時
pnpm clean && pnpm build  # (clean scriptがある場合)
```

---

## 📋 品質チェックリスト

### 実装品質
- [ ] コードが命名規則に準拠している
- [ ] 適切なエラーハンドリングが実装されている
- [ ] セキュリティ要件が考慮されている
- [ ] パフォーマンスへの配慮がある
- [ ] 適切なログ出力が実装されている

### テスト品質
- [ ] 主要な機能に対するテストが書かれている
- [ ] エッジケースが考慮されている
- [ ] モックが適切に使用されている
- [ ] テストが独立して実行可能

### ドキュメント品質
- [ ] コード内コメントが適切に記載されている
- [ ] README更新が必要な場合は更新されている
- [ ] API仕様書が更新されている（該当する場合）

### Git品質
- [ ] コミットメッセージが規約に準拠している
- [ ] 適切な粒度でコミットされている
- [ ] ブランチ名が命名規則に準拠している
- [ ] PR説明が分かりやすく書かれている

---

## 🚨 よくある問題と対処法

### GitHub CLI関連エラー
**問題**: Issue情報の取得失敗・認証エラー
```bash
# 解決策
# 1. 認証状態確認
gh auth status

# 2. 再認証（必要に応じて）
gh auth login

# 3. 正しいリポジトリ指定でIssue取得
gh issue view [ISSUE_NUMBER] --repo saikashu-kato/capu-app

# 4. リポジトリアクセス権限確認
gh repo view saikashu-kato/capu-app
```

### 依存関係エラー
**問題**: パッケージインストール失敗
```bash
# 解決策
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### 型エラー
**問題**: Prisma関連の型エラー
```bash
# 解決策
pnpm db:generate
```

### ビルドエラー
**問題**: Next.js ビルド失敗
```bash
# 解決策
# 1. 型チェック
pnpm typecheck

# 2. リンティング
pnpm lint --fix

# 3. キャッシュクリア
rm -rf .next
pnpm build
```

### モノレポ特有の問題
**問題**: アプリ間での設定不整合
```bash
# 解決策
# 共通設定の確認
diff apps/cast/package.json apps/guest/package.json
```

---

## 📚 参考資料

### プロジェクトドキュメント
- [技術スタック](./技術スタック.md)
- [システム構成図](../Design/システム構成図.md)
- [GitHub Issue テンプレート](./Github-Issue-Templates.md)
- [GitHub Issue サンプル](./Github-Issue-Samples.md)

### 外部リソース
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**作成日**: 2025年1月17日  
**最終更新**: 2025年1月17日  
**管理者**: Capuアプリ開発チーム

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>