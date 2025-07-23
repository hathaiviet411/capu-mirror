# Capu API エンドポイント一覧

## 概要

本ドキュメントは、Capuプロジェクトで実装が必要なAPIエンドポイントの一覧です。
tRPCルーターを使用し、TypeScriptによる型安全なAPIを構築します。

**技術スタック**: Next.js 14 + tRPC + Prisma + NextAuth.js + Stripe

**参照元**: `docs/documents/タスク進捗管理.md` の「3. キャストアプリ開発」「4. ゲストアプリ開発」セクション

---

## ルーター構成

tRPCルーターは以下のドメインごとに分割して実装します：

- `auth` - 認証関連
- `user` - ユーザー共通機能
- `cast` - キャスト専用機能 
- `guest` - ゲスト専用機能
- `message` - メッセージング機能
- `content` - 静的コンテンツ・マスターデータ

---

## 1. `auth` Router (認証関連)

NextAuth.jsのコールバックやセッション管理と連携します。

| エンドポイント | HTTPメソッド | 説明 | 関連機能ID |
|:---|:---|:---|:---|
| `auth.getSession` | `Query` | 現在のユーザーセッション情報を取得 | CAS-01, GUE-01 |
| `auth.logout` | `Mutation` | ユーザーをログアウトさせる | CAS-10-10, GUE-16-9 |

---

## 2. `user` Router (ユーザー関連)

ユーザープロファイルの管理、設定、通知など、両アプリに共通する機能です。

| エンドポイント | HTTPメソッド | 説明 | 関連機能ID |
|:---|:---|:---|:---|
| `user.getProfile` | `Query` | ログインユーザーのプロフィール情報を取得 | CAS-10-1, GUE-10-3 |
| `user.updateProfile` | `Mutation` | ユーザープロフィール（基本情報、自己紹介など）を更新 | CAS-11, GUE-11 |
| `user.updateProfileImage` | `Mutation` | プロフィール画像を変更・アップロード | CAS-10-2, GUE-11-3 |
| `user.deleteProfileImage` | `Mutation` | プロフィール画像を削除 | GUE-11-6 |
| `user.getNotifications` | `Query` | 通知一覧を取得（ページネーション対応） | CAS-07-1, GUE-05-2 |
| `user.getUnreadNotificationCount` | `Query` | 未読通知数を取得 | CAS-07-3 |
| `user.markNotificationsAsRead` | `Mutation` | 通知を既読にする（一括も含む） | CAS-07-4, CAS-07-6 |
| `user.updateNotificationSettings` | `Mutation` | プッシュ通知やメール通知の設定を更新 | CAS-16-1, GUE-12-6 |
| `user.getAccountSettings` | `Query` | アカウント設定情報を取得 | GUE-12-2 |
| `user.deleteAccount` | `Mutation` | ユーザーアカウントを削除申請 | CAS-16-6 |
| `user.getFavorites` | `Query` | お気に入り登録したユーザーの一覧を取得 | GUE-02-2 |
| `user.addFavorite` | `Mutation` | ユーザーをお気に入りに追加 | CAS-02-4, GUE-02-6, GUE-04-4 |
| `user.removeFavorite` | `Mutation` | ユーザーをお気に入りから削除 | CAS-02-4, GUE-02-6, GUE-04-4 |
| `user.getFootprints` | `Query` | 自分のプロフィールを閲覧したユーザー（足あと）を取得 | GUE-02-3 |
| `user.reportUser` | `Mutation` | 他ユーザーを運営に通報 | CAS-06-7, GUE-07-12 |
| `user.blockUser` | `Mutation` | 他ユーザーをブロック | CAS-06-7, GUE-07-13 |
| `user.submitIdVerification` | `Mutation` | 本人確認書類を提出 | GUE-15-7 |

---

## 3. `cast` Router (キャスト関連)

キャストの検索、詳細情報の取得、収益管理など、キャスト側の機能に特化したAPIです。

| エンドポイント | HTTPメソッド | 説明 | 関連機能ID |
|:---|:---|:---|:---|
| `cast.search` | `Query` | 条件（エリア、年齢、タグ等）でゲストを検索 | CAS-03-5 |
| `cast.getGuestDetail` | `Query` | 特定ゲストの詳細情報を取得 | CAS-04 |
| `cast.getRevenueDashboard` | `Query` | 収益ダッシュボードの情報を取得（期間指定） | CAS-09-1 |
| `cast.getTransactions` | `Query` | 取引履歴を取得（フィルタ、ページネーション対応） | CAS-13-1 |
| `cast.exportTransactions` | `Query` | 取引履歴をCSV形式でダウンロード | CAS-09-7, CAS-13-7 |
| `cast.getWithdrawalHistory` | `Query` | 引き出し申請履歴を取得 | CAS-12-6 |
| `cast.requestWithdrawal` | `Mutation` | 収益の引き出しを申請 | CAS-12-5 |
| `cast.cancelWithdrawal` | `Mutation` | 引き出し申請をキャンセル | CAS-12-7 |
| `cast.getBankAccounts` | `Query` | 登録済みの銀行口座一覧を取得 | CAS-14-1 |
| `cast.addBankAccount` | `Mutation` | 新しい銀行口座を登録 | CAS-14-8 |
| `cast.updateBankAccount` | `Mutation` | 銀行口座情報を更新 | CAS-14-9 |
| `cast.deleteBankAccount` | `Mutation` | 銀行口座を削除 | CAS-14-10 |
| `cast.setPrimaryBankAccount` | `Mutation` | メインの銀行口座を設定 | CAS-14-11 |

---

## 4. `guest` Router (ゲスト関連)

ゲスト側のキャスト検索や予約、支払いに関連する機能です。

| エンドポイント | HTTPメソッド | 説明 | 関連機能ID |
|:---|:---|:---|:---|
| `guest.getRecommendedCasts` | `Query` | おすすめキャスト一覧を取得 | GUE-02-1 |
| `guest.searchCasts` | `Query` | 条件（エリア、タグ等）でキャストを検索 | GUE-03-9 |
| `guest.getCastDetail` | `Query` | 特定キャストの詳細情報を取得 | GUE-04 |
| `guest.likeCast` | `Mutation` | キャストに「いいね」を送信（メッセージチャネル作成のトリガー） | GUE-04-6, GUE-05-5 |
| `guest.getJoinedCasts` | `Query` | 過去に合流したキャスト一覧を取得 | GUE-09 |
| `guest.getPointHistory` | `Query` | ポイントの獲得・使用履歴を取得 | GUE-13-5 |
| `guest.getPaymentHistory` | `Query` | 決済履歴を取得 | GUE-13-3 |
| `guest.generateReceipt` | `Query` | 領収書を生成 | GUE-13-2 |
| `guest.getPaymentMethods` | `Query` | 登録済みのクレジットカード情報を取得 | GUE-14-3 |
| `guest.addPaymentMethod` | `Mutation` | 新しいクレジットカードを登録（Stripe Setup Intent） | GUE-14-2 |
| `guest.deletePaymentMethod` | `Mutation` | クレジットカードを削除 | GUE-14-5 |
| `guest.purchasePoints` | `Mutation` | ポイントを購入 | - |

---

## 5. `message` Router (メッセージング関連)

両アプリで共通して使用される、リアルタイムチャット機能です。

| エンドポイント | HTTPメソッド | 説明 | 関連機能ID |
|:---|:---|:---|:---|
| `message.getRooms` | `Query` | メッセージルームの一覧を取得 | CAS-05-1, GUE-06-3 |
| `message.getHistory` | `Query` | 特定ルームのメッセージ履歴を取得（ページネーション対応） | CAS-06-1, GUE-07-1 |
| `message.sendMessage` | `Mutation` | テキストメッセージを送信 | CAS-06-2, GUE-07-5 |
| `message.sendImage` | `Mutation` | 画像を送信 | CAS-06-3, GUE-07-9 |
| `message.onNewMessage` | `Subscription` | 新規メッセージをリアルタイムで購読 (WebSocket) | CAS-06-4, GUE-07-15 |
| `message.markAsRead` | `Mutation` | メッセージを既読にする | CAS-06-5, GUE-07-14 |
| `message.proposeSchedule` | `Mutation` | ゲストがキャストに日程を提案 | GUE-07-10 |
| `message.pinThread` | `Mutation` | メッセージスレッドをピン留め | GUE-07-11 |

---

## 6. `content` Router (静的コンテンツ・マスターデータ関連)

お知らせやヘルプ、選択肢用のマスターデータを管理します。

| エンドポイント | HTTPメソッド | 説明 | 関連機能ID |
|:---|:---|:---|:---|
| `content.getNews` | `Query` | ニュース・お知らせ一覧を取得 | CAS-08-1, GUE-05-3, GUE-08-2 |
| `content.getHelpArticles` | `Query` | ヘルプ記事やFAQの一覧を取得 | CAS-15-1 |
| `content.submitInquiry` | `Mutation` | 問い合わせフォームから送信 | CAS-15-5 |
| `content.getTags` | `Query` | プロフィール用のタグマスターを取得 | CAS-03-3, GUE-03-6 |
| `content.getAreas` | `Query` | エリア（居住地、出身地）マスターを取得 | CAS-03-1, GUE-03-2, GUE-03-3 |
| `content.getBanks` | `Query` | 銀行マスターを取得 | CAS-14-3 |

---

## 実装指針

### 1. セキュリティ
- 全ての`Mutation`および機密情報を扱う`Query`には認証が必要
- ユーザータイプ（CAST/GUEST）による認可制御を実装
- 入力値のバリデーションはZodスキーマで実装

### 2. パフォーマンス
- ページネーション対応（デフォルト20件、最大100件）
- レスポンスキャッシュの適用
- 画像アップロードは外部サービス（Cloudinary等）を利用

### 3. リアルタイム通信
- メッセージング機能はWebSocket（tRPC Subscription）を使用
- オンライン状態管理はPresence APIを実装
- 未読バッジの即座更新

### 4. エラーハンドリング
- 統一されたエラーレスポンス形式
- ユーザーフレンドリーなエラーメッセージ
- ログ出力とモニタリング

---

## 次のステップ

1. **Zodスキーマ定義**: 各エンドポイントの入力・出力型を定義
2. **Prismaモデル設計**: データベーススキーマとの整合性確認
3. **認証・認可**: NextAuth.jsとの連携部分の詳細設計
4. **WebSocket設定**: リアルタイム通信の実装

---

*このドキュメントは開発進捗に応じて随時更新してください。* 