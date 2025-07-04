# Capu システム構成図

```mermaid
graph TD
    %% ユーザー
    User[👤 ユーザー]
    
    %% フロントエンド層
    subgraph Frontend["🖥️ フロントエンド層"]
        NextJS[Next.js<br/>TypeScript]
        Vercel[Vercel<br/>Hosting]
    end
    
    %% バックエンド層
    subgraph Backend["⚙️ バックエンド層"]
        CloudRun[Cloud Run<br/>Functions]
        UserAPI[User API]
        DataAPI[Data API]
        Notification[Notification]
    end
    
    %% データベース層
    subgraph Database["🗄️ データベース層"]
        Supabase[Supabase<br/>PostgreSQL]
        Realtime[Real-time<br/>Subscriptions]
        Storage[File Storage]
        
        subgraph Tables["テーブル"]
            UsersTable[(users)]
            ServicesTable[(services)]
            TransactionsTable[(transactions)]
        end
    end
    
    %% 接続関係
    User -->|HTTPS| NextJS
    NextJS -->|API Call<br/>HTTPS| CloudRun
    NextJS -->|Authentication| CloudRun
    NextJS -->|WebSocket<br/>Real-time| Realtime
    
    CloudRun -->|SQL Queries<br/>HTTPS| Supabase
    
    %% API との関連
    CloudRun -.-> UserAPI
    CloudRun -.-> DataAPI
    CloudRun -.-> Notification
    
    %% データベース内の関連
    Supabase --- UsersTable
    Supabase --- ServicesTable
    Supabase --- TransactionsTable
    
    %% スタイル定義
    classDef frontend fill:#fff2cc,stroke:#d6b656
    classDef backend fill:#d5e8d4,stroke:#82b366
    classDef database fill:#dae8fc,stroke:#6c8ebf
    classDef hosting fill:#f8cecc,stroke:#b85450
    classDef service fill:#e1d5e7,stroke:#9673a6
    classDef user fill:#dae8fc,stroke:#6c8ebf
    
    %% クラス適用
    class NextJS frontend
    class Vercel hosting
    class CloudRun,UserAPI,DataAPI,Notification backend
    class Supabase,Realtime,Storage,UsersTable,ServicesTable,TransactionsTable database
    class User user
```

## 主要コンポーネント

### フロントエンド層
- **Next.js (TypeScript)**: メインのWebアプリケーション
- **Vercel**: ホスティングプラットフォーム

### バックエンド層
- **Cloud Run (Functions)**: サーバーレスコンテナ実行環境（認証エンドポイントを含む）
- **User API**: ユーザー管理API
- **Data API**: データ操作API
- **Notification**: 通知機能

### データベース層
- **Supabase (PostgreSQL)**: メインデータベース
- **Real-time Subscriptions**: リアルタイム更新機能
- **File Storage**: ファイル保存機能

#### データベーステーブル
- **users**: ユーザー情報
- **services**: サービス情報
- **transactions**: 取引履歴

## データフロー

1. **ユーザー認証フロー**
   - ユーザー → Next.js → Cloud Run Functions
   - Cloud Run Functions → Supabase (RLS Security)

2. **API通信フロー**
   - Next.js → Cloud Run Functions → Supabase

3. **リアルタイム通信フロー**
   - Next.js ↔ Supabase Real-time Subscriptions (WebSocket)

## 技術スタック

| 層 | 技術 | 用途 |
|---|---|---|
| フロントエンド | Next.js (TypeScript) | Webアプリケーション |
| ホスティング | Vercel | フロントエンドデプロイ |
| バックエンド | Cloud Run (Functions) | サーバーレス処理 |
| 認証 | Cloud Run (Functions) | ユーザー認証 |
| データベース | Supabase (PostgreSQL) | データ永続化 |
| リアルタイム | Supabase Real-time | WebSocket通信 |
| ストレージ | Supabase Storage | ファイル保存 |