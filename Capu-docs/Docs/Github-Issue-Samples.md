 # GitHub Issue サンプル集

## 📋 概要

Capuアプリ開発プロジェクトの実際のタスクに基づいたGitHub Issueサンプル集です。各テンプレートの具体的な使用例を示します。

---

## 🔧 サンプル1: 基盤開発用Issue

### [AUTH-01] NextAuth.js初期設定・構成

## 📝 Issue概要

**タスクID**: AUTH-01
**エピック**: 認証システム  
**機能**: NextAuth.jsを使用したキャスト・ゲスト共通認証基盤の初期設定

## 🎯 目的・背景

### なぜこの機能が必要か
- キャスト用のCredentials認証（ID/パスワード）とゲスト用のLINE OAuth認証を統一的に管理する必要がある
- JWT token管理とセッション管理を一元化し、セキュアな認証フローを構築する
- 後続のAPI開発・画面開発の前提条件となる重要な基盤機能

### 期待される効果
- 統一された認証フローによる開発効率の向上
- セキュアなJWT管理によるセキュリティリスクの軽減
- 認証状態の一元管理による状態管理の簡素化

## 📋 受け入れ条件（Acceptance Criteria）

- [ ] NextAuth.js v4がプロジェクトに正常にインストールされている
- [ ] キャスト用Credentials Providerが設定されている
- [ ] ゲスト用LINE OAuth Providerが設定されている  
- [ ] JWT strategy設定が完了している
- [ ] Session strategy設定が完了している
- [ ] 環境変数（NEXTAUTH_SECRET等）が設定されている
- [ ] 単体テストが書かれている
- [ ] 認証フロー設計ドキュメントが記載されている
- [ ] コードレビューが完了している

## 🛠️ 実装タスク

### 必須タスク
- [ ] NextAuth.js パッケージインストール
- [ ] `/api/auth/[...nextauth].ts` APIルート作成
- [ ] Credentials Provider設定（キャスト用）
- [ ] LINE OAuth Provider設定（ゲスト用）
- [ ] JWT設定・シークレット管理
- [ ] Session設定・有効期限管理
- [ ] 認証コールバック処理実装

### テスト
- [ ] 認証プロバイダーのユニットテスト実装
- [ ] JWT生成・検証のテスト実装
- [ ] セッション管理のテスト実装
- [ ] エラーケーステスト（無効なクレデンシャル等）

## 🔗 依存関係

### 前提条件
- [ ] プロジェクト基盤構築完了
- [ ] LINE Developer Account設定完了

### 後続タスク
- AUTH-02 (LINE OAuth Provider設定)
- AUTH-03 (Credentials Provider設定)
- AUTH-04 (認証ミドルウェア実装)

## 💡 技術詳細

### 使用技術・ライブラリ
- NextAuth.js v4
- JWT (jsonwebtoken)
- LINE Login API

### 実装アプローチ
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import LineProvider from 'next-auth/providers/line'

export default NextAuth({
  providers: [
    // キャスト用Credentials
    CredentialsProvider({
      id: 'cast-credentials',
      name: 'Cast Login',
      credentials: {
        loginId: { label: "Login ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 認証ロジック実装
      }
    }),
    // ゲスト用LINE OAuth  
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      // JWT カスタマイズ
    },
    async session({ session, token }) {
      // Session カスタマイズ
    }
  }
})
```

### 注意点・課題
- LINE OAuth設定時のスコープ管理に注意
- JWT secretの安全な管理が必要
- キャスト・ゲストの認証フロー分岐処理

## 📊 見積もり・優先度

- **工数**: 1日
- **複雑度**: 🟡中
- **優先度**: 🔥最高

## 🏷️ ラベル

`epic:基盤開発` `type:feature` `priority:critical` `complexity:medium` `auth`

## 👥 アサイニー

- @backend-developer

## 📎 関連リンク

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [LINE Login API Reference](https://developers.line.biz/en/docs/line-login/)
- [認証システム設計書](../Design/認証システム設計.md)

---

## 🎨 サンプル2: UI/UX開発用Issue

### [CAS-01-1] ログインボタンクリック インタラクション実装

## 📝 Issue概要

**画面ID**: CAS-01
**画面名**: キャストログイン画面
**インタラクション**: ログインボタンクリック → ログインモーダル表示

## 🎯 ユーザーストーリー

**As a** キャスト（出演者）
**I want to** ログインボタンをクリックしてログインモーダルを表示
**So that** 安全かつ迅速にアプリにログインできる

## 📋 受け入れ条件（Acceptance Criteria）

### 機能要件
- [ ] ログインボタンクリック時にログインモーダルが表示される
- [ ] モーダル表示時にID・パスワードフィールドが空で初期化される  
- [ ] モーダル背景クリックで閉じる機能が動作する
- [ ] Escキーでモーダルを閉じる機能が動作する
- [ ] ログイン成功時はモーダルが自動で閉じる

### UI/UX要件
- [ ] デザインシステムに準拠したモーダルデザイン
- [ ] レスポンシブ対応（375px〜1024px）
- [ ] フェードイン・アウトアニメーション（300ms）
- [ ] フォーカストラップ（アクセシビリティ対応）
- [ ] ローディング状態の視覚的フィードバック

### パフォーマンス要件
- [ ] モーダル表示が200ms以内
- [ ] スムーズなアニメーション（60fps）

## 🛠️ 実装タスク

### 画面実装
- [ ] LoginModalコンポーネント作成
- [ ] useLoginModal カスタムフック作成
- [ ] モーダル表示状態管理実装
- [ ] フォーム初期化処理実装

### API連携
- [ ] 認証API呼び出し実装
- [ ] 認証エラーハンドリング実装
- [ ] ローディング状態管理実装

### スタイリング
- [ ] Tailwind CSSモーダルスタイル実装
- [ ] レスポンシブブレークポイント対応
- [ ] アニメーション実装（framer-motion）

## 🎨 デザイン・モックアップ

### Figmaリンク
- [キャストログイン画面デザイン](https://figma.com/cast-login)

### 画面フロー
```
[初期画面] → [ログインボタンクリック] → [ログインモーダル表示] → [認証処理] → [ホーム画面]
```

### インタラクション詳細
1. **ユーザーアクション**: ログインボタンクリック
2. **システム処理**: 
   - モーダル表示フラグをtrueに設定
   - フォーム状態を初期化
   - フォーカスをIDフィールドに移動
3. **画面更新**: 
   - フェードインアニメーションでモーダル表示
   - 背景オーバーレイ表示
   - ボディスクロール無効化

## 🔗 依存関係

### API依存
- [ ] NextAuth.js認証エンドポイント (`/api/auth/signin`)
- [ ] 認証状態取得API

### 前提条件
- [ ] AUTH-01 認証システム基盤完了
- [ ] UI-02 共通UIコンポーネント基盤完了

## 💡 技術詳細

### 使用コンポーネント
- React Hook Form (フォーム管理)
- Framer Motion (アニメーション)
- Headless UI (モーダル基盤)
- React Hot Toast (通知)

### 状態管理
```typescript
interface LoginModalState {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  formData: {
    loginId: string
    password: string
  }
}

const useLoginModal = () => {
  const [state, setState] = useState<LoginModalState>({
    isOpen: false,
    isLoading: false,
    error: null,
    formData: { loginId: '', password: '' }
  })
  
  const openModal = () => setState(prev => ({ 
    ...prev, 
    isOpen: true, 
    error: null,
    formData: { loginId: '', password: '' }
  }))
  
  const closeModal = () => setState(prev => ({ ...prev, isOpen: false }))
  
  return { state, openModal, closeModal }
}
```

## 📱 デバイス対応

- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] Android標準 (360px)
- [ ] タブレット (768px)
- [ ] デスクトップ (1024px)

## 📊 見積もり・優先度

- **工数**: 0.5日
- **複雑度**: 🟢低
- **優先度**: 🔥高

## 🏷️ ラベル

`epic:キャストアプリ` `type:feature` `ui/ux` `priority:high` `screen:login`

## 👥 アサイニー

- @frontend-developer

## 📎 関連リンク

- [CAS-01 ログイン画面設計書](../Design/画面処理・影響定義書/CAS-01_ログイン画面.md)
- [Figmaデザイン](https://figma.com/cast-login)
- [関連Issue: AUTH-01](https://github.com/repo/issues/1)

---

## ⚙️ サンプル3: インフラ・DevOps用Issue

### [DEPLOY-01] Vercelプロジェクト作成・設定

## 📝 Issue概要

**タスクID**: DEPLOY-01
**カテゴリ**: デプロイメント  
**対象環境**: Development, Staging, Production

## 🎯 目的・背景

### インフラ要件
- キャスト・ゲストアプリを独立したVercelプロジェクトとして構築する必要
- 環境別デプロイメント（dev/staging/prod）の自動化基盤構築
- CDN・エッジファンクション活用によるパフォーマンス最適化

### ビジネス影響
- アプリの高速配信によるユーザー体験向上
- 自動デプロイによる開発効率化・リリース頻度向上
- グローバル配信によるレスポンス速度改善

## 📋 受け入れ条件（Acceptance Criteria）

### 機能要件
- [ ] Vercel上にキャストアプリプロジェクトが作成されている
- [ ] Vercel上にゲストアプリプロジェクトが作成されている
- [ ] GitHubリポジトリと正常に連携している
- [ ] 環境別ブランチデプロイが設定されている

### 運用要件
- [ ] デプロイ状況の監視・通知が設定されている
- [ ] ビルドログが適切に出力されている
- [ ] デプロイ手順書が作成されている
- [ ] ロールバック手順が確認されている

## 🛠️ 実装タスク

### 設定・構築
- [ ] Vercelアカウント・チーム設定
- [ ] キャストアプリプロジェクト作成（capu-cast）
- [ ] ゲストアプリプロジェクト作成（capu-guest）
- [ ] GitHubリポジトリ連携設定
- [ ] ブランチデプロイ戦略設定
- [ ] ビルド設定・環境変数初期設定

### テスト・検証
- [ ] デプロイメント疎通確認
- [ ] パフォーマンステスト（Lighthouse）
- [ ] セキュリティヘッダー確認
- [ ] CDN配信確認

### ドキュメント
- [ ] デプロイ手順書作成
- [ ] Vercel設定ドキュメント作成
- [ ] トラブルシューティングガイド作成

## 🔧 技術詳細

### 使用技術・サービス
- Vercel Pro Plan
- Vercel CLI
- GitHub Integration
- Vercel Analytics

### 設定ファイル
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 環境変数
```bash
# Production環境
NEXTAUTH_URL=https://cast.capu.app
NEXTAUTH_SECRET=***
DATABASE_URL=***
LINE_CLIENT_ID=***
LINE_CLIENT_SECRET=***
STRIPE_SECRET_KEY=***
```

## 🔒 セキュリティ要件

- [ ] HTTPS強制リダイレクト設定
- [ ] セキュリティヘッダー設定（CSP, HSTS等）
- [ ] 環境変数の暗号化管理
- [ ] アクセスログの記録・監視

## 📊 パフォーマンス目標

- **初期表示時間**: 2秒以内（LCP）
- **可用性**: 99.9%
- **CDN キャッシュヒット率**: 90%以上

## 📋 チェックリスト

### デプロイ前
- [ ] ビルド設定の確認
- [ ] 環境変数の確認
- [ ] ドメイン設定の確認

### デプロイ後
- [ ] アプリケーション疎通確認
- [ ] Lighthouse スコア確認（90点以上）
- [ ] セキュリティヘッダー確認
- [ ] エラーログ監視設定確認

## 📊 見積もり・優先度

- **工数**: 0.5日
- **複雑度**: 🟢低
- **優先度**: 🔥高

## 🏷️ ラベル

`epic:インフラ` `type:infrastructure` `priority:high` `deployment`

## 👥 アサイニー

- @devops-engineer

## 📎 関連リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [プロジェクトアーキテクチャ図](../Design/システム構成図.md)

---

## 🧪 サンプル4: テスト用Issue

### [TEST-09] 認証システムテスト実装

## 📝 Issue概要

**テストタイプ**: ユニットテスト・統合テスト
**対象機能**: NextAuth.js認証システム（AUTH-01〜08）
**関連タスクID**: AUTH-01, AUTH-02, AUTH-03

## 🎯 テスト目的

### テスト観点
- 正常系: 有効なクレデンシャルでの認証成功
- 異常系: 無効なクレデンシャル・サーバーエラー
- 境界値: セッション有効期限・トークン検証

### カバレッジ目標
- **ライン**: 85%以上
- **ブランチ**: 80%以上  
- **関数**: 95%以上

## 📋 テストケース

### 正常系
- [ ] キャスト有効クレデンシャルでの認証成功
- [ ] ゲストLINE OAuthでの認証成功
- [ ] JWT生成・検証の正常動作
- [ ] セッション作成・更新の正常動作
- [ ] 認証後のリダイレクト処理

### 異常系
- [ ] 無効なキャストクレデンシャルでの認証失敗
- [ ] LINE OAuth認証キャンセル・エラー
- [ ] 無効JWT・期限切れトークンの拒否
- [ ] セッション破損・削除時のエラーハンドリング
- [ ] ネットワークエラー時の処理

### 境界値
- [ ] セッション有効期限（30日）直前での更新
- [ ] JWT最大ペイロードサイズでの生成・検証
- [ ] 同時ログイン数上限でのセッション管理

## 🛠️ 実装タスク

### テストファイル作成
- [ ] `__tests__/auth/nextauth.test.ts`
- [ ] `__tests__/auth/credentials-provider.test.ts`
- [ ] `__tests__/auth/line-provider.test.ts`
- [ ] `__tests__/auth/jwt-handler.test.ts`
- [ ] `__tests__/auth/session-manager.test.ts`

### モック・スタブ
- [ ] NextAuth.jsモック作成
- [ ] LINE API レスポンスモック
- [ ] データベース（ユーザー検索）モック
- [ ] JWT署名・検証モック

### テストデータ
- [ ] 有効・無効キャストユーザーデータ
- [ ] LINE OAuth レスポンスサンプル
- [ ] JWT ペイロードサンプル
- [ ] セッションデータファクトリー

## 💡 技術詳細

### テストフレームワーク
- Jest (ユニットテスト)
- React Testing Library (コンポーネントテスト)
- MSW (API モック)

### テスト実装例
```typescript
// __tests__/auth/nextauth.test.ts
import { NextAuthOptions } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

describe('NextAuth設定', () => {
  it('正常系: キャスト認証が成功する', async () => {
    // Arrange
    const mockCredentials = {
      loginId: 'test-cast-001',
      password: 'validPassword123'
    }
    
    // Act
    const result = await authOptions.providers[0].authorize(mockCredentials)
    
    // Assert
    expect(result).toBeTruthy()
    expect(result.userType).toBe('cast')
    expect(result.id).toBe('test-cast-001')
  })
  
  it('異常系: 無効なパスワードで認証が失敗する', async () => {
    // Arrange
    const mockCredentials = {
      loginId: 'test-cast-001', 
      password: 'invalidPassword'
    }
    
    // Act
    const result = await authOptions.providers[0].authorize(mockCredentials)
    
    // Assert
    expect(result).toBeNull()
  })
})
```

## 📊 品質メトリクス

### 目標値
- **テスト実行時間**: 3分以内
- **フレイキーテスト**: 0件
- **テストメンテナンス性**: 高（変更時の影響最小化）

### 監視項目
- [ ] 認証成功率の推移
- [ ] テスト実行時間の推移  
- [ ] カバレッジの推移

## 📊 見積もり・優先度

- **工数**: 2日
- **複雑度**: 🔴高
- **優先度**: 🔥高

## 🏷️ ラベル

`epic:テスト` `type:test` `priority:high` `auth` `backend`

## 👥 アサイニー

- @test-engineer

## 📎 関連リンク

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NextAuth.js Testing Guide](https://next-auth.js.org/tutorials/testing)
- [対象機能Issue: AUTH-01](https://github.com/repo/issues/1)

---

## 📝 Issue作成時のポイント

### 各テンプレートの使い分け

1. **基盤開発用**: バックエンドロジック・API・認証等の基盤機能
2. **UI/UX開発用**: フロントエンド画面・ユーザーインタラクション
3. **インフラ用**: デプロイ・監視・CI/CD等のインフラ構築
4. **テスト用**: 品質保証・テスト実装
5. **バグ修正用**: 不具合対応・修正

### 品質向上のためのチェックポイント

- [ ] **受け入れ条件**が具体的・測定可能
- [ ] **依存関係**が明確に記載されている  
- [ ] **工数見積もり**が適切（1-3日以内）
- [ ] **技術詳細**にコード例がある
- [ ] **ラベル・アサイニー**が適切に設定されている

---

**作成日**: 2025年1月15日  
**最終更新**: 2025年1月15日  
**管理者**: Capuアプリ開発チーム