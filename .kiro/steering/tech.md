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

## AI/ML Integration
- **AI基盤**: Google Vertex AI（統一されたAIプラットフォーム）
- **画像認識**: Vertex AI Vision API
- **商品名推定**: Vertex AI Generative AI（Gemini Pro Vision）
- **価格データ取得**: Vertex AI Agent Builder（Web検索統合）
- **統合方式**: Vertex AI SDK for Node.js
- **認証**: サービスアカウント（ADC - Application Default Credentials）

## Database
- **Primary DB**: SQLite（開発）/ PostgreSQL（本番予定）
- **ORM**: Prisma 5.x
- **Database Migration**: Prisma Migrate
- **File Storage**: 将来実装予定（AWS S3 または Cloudflare R2）
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
```

## Environment Variables
```
# NextAuth設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# データベース
DATABASE_URL=file:./dev.db  # 開発環境（SQLite）
# DATABASE_URL=postgresql://user:password@localhost:5432/platdot  # 本番環境

# 将来実装予定の環境変数
# Vertex AI
# GOOGLE_CLOUD_PROJECT=your-project-id
# GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
# VERTEX_AI_LOCATION=asia-northeast1

# ストレージ（未実装）
# S3_BUCKET=platdot-uploads
# S3_REGION=ap-northeast-1
# S3_ACCESS_KEY=your-access-key
# S3_SECRET_KEY=your-secret-key

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

## Security Considerations
- **HTTPS**: 本番環境では必須
- **CORS**: 適切なオリジン設定
- **Rate Limiting**: API保護
- **Input Validation**: 全入力の検証
- **SQL Injection対策**: ORMの使用
- **XSS対策**: React自動エスケープ + CSP
- **認証**: JWT + セキュアクッキー