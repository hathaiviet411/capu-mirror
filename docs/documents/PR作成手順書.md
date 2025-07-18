# PR作成手順書

## 📝 概要
このドキュメントは、Capu-appプロジェクトにおけるPull Request（PR）の作成手順とベストプラクティスを定義します。

## 🎯 PR作成の基本フロー

### 1. 事前準備
- [ ] 対応するIssueが存在することを確認
- [ ] 実装内容がIssueの受け入れ条件を満たしていることを確認
- [ ] ローカルでのテストが完了していることを確認

### 2. ブランチ作成
```bash
# mainブランチから最新の変更を取得
git checkout main
git pull origin main

# 機能ブランチを作成
git checkout -b feature/ISSUE-ID-description
# 例: git checkout -b feature/AUTH-02-line-oauth-implementation
```

### 3. 実装・コミット
```bash
# 変更をステージング
git add .

# コミット（わかりやすいコミットメッセージを記述）
git commit -m "feat: 機能の概要 (ISSUE-ID)

詳細な変更内容の説明
- 変更点1
- 変更点2

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. プッシュ・PR作成
```bash
# リモートにプッシュ
git push origin feature/ISSUE-ID-description

# GitHub CLIでPR作成
gh pr create --title "タイトル" --body "内容"
```

## 📋 PRテンプレート

### 必須項目
```markdown
## 📝 概要
[PRの概要を簡潔に記述]

## 🎯 実装内容
- [具体的な実装内容1]
- [具体的な実装内容2]
- [具体的な実装内容3]

## 📚 追加ドキュメント
- [ドキュメント名](../path/to/document.md) - 説明

## ✅ 受け入れ条件チェック
- [x] 条件1が満たされている
- [x] 条件2が満たされている
- [ ] 条件3が満たされている（未完了の場合）

## 🔍 テスト状況
- [x] ビルド成功
- [x] 単体テスト実装
- [x] 統合テスト実装
- [x] 手動テスト完了

## 📎 関連リンク
- Closes #[Issue番号]
- 関連ドキュメント: [ドキュメント名](../path/to/document.md)

## 📋 レビュー観点
- [x] 実装が設計通りか
- [x] セキュリティ要件が満たされているか
- [x] パフォーマンス要件が満たされているか
- [x] テストカバレッジが十分か

## 🚀 技術的highlights
- [特筆すべき技術的なポイント1]
- [特筆すべき技術的なポイント2]

## 🛠️ 実装ファイル
- `path/to/file1.ts` - 説明
- `path/to/file2.ts` - 説明

🤖 Generated with [Claude Code](https://claude.ai/code)
```

## 📊 品質チェックリスト

### 📝 コード品質
- [ ] TypeScript型チェックが通る
- [ ] ESLintエラーがない
- [ ] 適切なエラーハンドリングが実装されている
- [ ] セキュリティ要件が満たされている
- [ ] パフォーマンス要件が満たされている

### 🧪 テスト品質
- [ ] 単体テストが書かれている
- [ ] 統合テストが書かれている
- [ ] エラーケースのテストが書かれている
- [ ] テストカバレッジが適切である

### 📚 ドキュメント品質
- [ ] 実装内容が明確に記述されている
- [ ] 設計ドキュメントが更新されている
- [ ] APIドキュメントが更新されている（該当する場合）
- [ ] READMEが更新されている（該当する場合）

## 🔄 PRワークフロー

### 1. 作成段階
```bash
# PR作成
gh pr create --title "[ISSUE-ID] 機能名" --body "$(cat <<'EOF'
[PRテンプレートの内容]
EOF
)"
```

### 2. レビュー段階
- [ ] 自己レビューの実施
- [ ] レビュワーのアサイン
- [ ] レビューコメントへの対応
- [ ] 必要に応じて追加コミット

### 3. マージ段階
- [ ] 全ての受け入れ条件を満たしている
- [ ] レビューが完了している
- [ ] コンフリクトが解決されている
- [ ] CI/CDが成功している

## 🚨 コンフリクト解決手順

### 1. 最新のmainブランチを取得
```bash
git fetch origin main
```

### 2. コンフリクトの確認
```bash
# マージ状態を確認
git merge origin/main

# コンフリクトファイルを確認
git status
```

### 3. コンフリクトの解決
```bash
# 手動でコンフリクトを解決
# エディタでコンフリクトマーカーを解決

# 解決後にコミット
git add .
git commit -m "resolve: mainブランチとのコンフリクト解決"
```

### 4. プッシュ
```bash
git push origin feature/ISSUE-ID-description
```

## 📌 ベストプラクティス

### ✅ 推奨事項
- 1つのPRで1つの機能を実装する
- コミットメッセージは明確で具体的に書く
- 受け入れ条件を必ず確認する
- 自己レビューを実施する
- ドキュメントを適切に更新する

### ❌ 避けるべき事項
- 大きすぎるPRを作成する
- コミットメッセージが不明確
- テストを書かない
- ドキュメントの更新を忘れる
- 受け入れ条件を確認しない

## 🔗 関連ドキュメント
- [Issue実行手順書](./Issue実行手順書.md)
- [技術スタック](./技術スタック.md)
- [Github-Issue-Templates](./Github-Issue-Templates.md)

## 📞 サポート
PR作成で困った場合は、以下のリソースを参照してください：
- [GitHub公式ドキュメント](https://docs.github.com/ja/pull-requests)
- [GitHub CLI公式ドキュメント](https://cli.github.com/manual/)
- チームSlackチャンネル

---
🤖 Generated with [Claude Code](https://claude.ai/code)