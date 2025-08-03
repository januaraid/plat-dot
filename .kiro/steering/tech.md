# Technology Stack

## Architecture
- **Application Type**: フルスタックWebアプリケーション
- **Architecture Pattern**: Next.js App Router（React Server Components）
- **Deployment Model**: Vercel/クラウドベース（エッジランタイム対応）
- **API Design**: Next.js Route Handlers（RESTful）

## Frontend
- **Framework**: Next.js 15.x (React 19.x)
- **State Management**: React Server Components + Client Components
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2 ✨ **IMPLEMENTED**
- **Build Tool**: Next.js内蔵 (Turbopack)
- **Package Manager**: npm
- **TypeScript**: 有効（厳密モード）
- **Component Strategy**: Server Components優先、必要な箇所のみClient Components
- **PWA**: 将来実装予定（Service Worker）

## Backend
- **Language**: Node.js (TypeScript)
- **Framework**: Next.js Route Handlers (App Router)
- **ORM**: Prisma 5.x
- **Authentication**: NextAuth.js v5 (Auth.js)
- **API Routes**: Next.js API Routes (`app/api/`)
- **Validation**: Zod 3.x
- **Session Management**: NextAuth.js セッション
- **Job Queue**: 将来実装予定（価格追跡の定期実行）

## AI/ML Integration ✨ **IMPLEMENTED**
- **AI基盤**: Google Gemini API（@google/genai SDK）
- **画像認識**: Gemini Pro Vision（商品名・カテゴリ・メーカー自動認識）
- **価格データ取得**: Gemini Pro（Web検索結果の解析とデータ抽出）
- **統合方式**: Google Generative AI SDK for Node.js
- **認証**: API Key認証
- **価格履歴**: Prismaデータベースによる価格変動の永続化
- **使用量管理**: AI APIの使用量追跡とレート制限

## Database
- **Primary DB**: SQLite（開発）/ PostgreSQL（本番） ✨ **IMPLEMENTED**
- **ORM**: Prisma 5.x
- **Database Migration**: Prisma Migrate
- **File Storage**: Vercel Blob Storage ✨ **IMPLEMENTED**
- **Image Processing**: Sharp.js（サムネイル生成）✨ **IMPLEMENTED** 
- **Cache**: 将来実装予定

## Development Environment
- **Node.js**: v20.x LTS
- **Package Manager**: npm
- **IDE**: VS Code推奨
- **Linting**: ESLint (Next.js設定) + Prettier
- **TypeScript**: 5.x (厳密モード)
- **開発サーバー**: Next.js Dev Server
- **環境管理**: `.env.local`（開発環境）

## Common Commands
```bash
# 開発環境起動
npm run dev

# ビルド
npm run build

# 本番環境起動
npm run start

# リント
npm run lint

# 型チェック
npm run type-check

# Prismaクライアント生成
npm run db:generate

# データベーススキーマ同期
npm run db:push

# データベースマイグレーション
npm run db:migrate

# Prisma Studio起動
npm run db:studio

# シードデータ投入
npm run db:seed

# ファイルアップロードディレクトリ作成
mkdir -p public/uploads

# 開発時のアップロードファイルクリア
rm -rf public/uploads/*
```

## Environment Variables
```
# NextAuth設定 ✅
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# データベース ✅
DATABASE_URL=file:./dev.db  # 開発環境（SQLite）
DATABASE_URL=postgresql://user:password@host:5432/db  # 本番環境（PostgreSQL）

# AI機能 ✅ **IMPLEMENTED**
GEMINI_API_KEY=your-gemini-api-key

# ファイルストレージ ✅ **IMPLEMENTED**
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# 将来実装予定の環境変数
# 決済（未実装）
# STRIPE_API_KEY=your-stripe-key
# STRIPE_WEBHOOK_SECRET=your-webhook-secret

# メール（未実装）
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email
# SMTP_PASS=your-password
```

## Port Configuration
- **Next.js Dev Server**: 3000（フロントエンド + API）
- **Prisma Studio**: 5555（データベース管理UI）
- **PostgreSQL**: 5432（本番環境予定）

## File Upload Configuration ✨ **UPDATED**
- **Storage**: Vercel Blob Storage（クラウドストレージ）
- **Thumbnail Generation**: Sharp.js（Small: 150px, Medium: 300px, Large: 600px）
- **File Types**: JPG, JPEG, PNG, WEBP
- **Max File Size**: 5MB per file
- **Max Files**: 10 files per item
- **File Naming**: UUID-based naming for uniqueness
- **Access URL**: Vercel Blob直接URL
- **Local Development**: `uploads/` ディレクトリ（開発環境のみ）

## Security Considerations
- **HTTPS**: 本番環境では必須
- **CORS**: 適切なオリジン設定
- **Rate Limiting**: API保護
- **Input Validation**: 全入力の検証
- **SQL Injection対策**: ORMの使用
- **XSS対策**: React自動エスケープ + CSP
- **認証**: JWT + セキュアクッキー
- **File Upload Security**: ファイルタイプ検証、ファイルサイズ制限
- **Path Traversal対策**: ファイルパスのサニタイズ