# Technology Stack

## Architecture
- **Application Type**: フルスタックWebアプリケーション
- **Architecture Pattern**: モノリシック（初期段階）→ マイクロサービス対応可能な設計
- **Deployment Model**: クラウドベース（コンテナ化対応）
- **API Design**: RESTful API（将来的にGraphQL移行可能）

## Frontend
- **Framework**: React 18.x または Next.js 14.x
- **State Management**: Redux Toolkit または Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite または Next.js内蔵
- **Package Manager**: npm または pnpm
- **TypeScript**: 有効（厳密モード）
- **画像処理**: Sharp（サーバーサイド）、canvas（クライアントサイド）
- **PWA**: Service Worker実装（オフライン対応）

## Backend
- **Language**: Node.js (TypeScript)
- **Framework**: Express.js または Fastify
- **ORM**: Prisma
- **Authentication**: JWT + refresh token
- **API Documentation**: OpenAPI/Swagger
- **Validation**: Zod
- **Job Queue**: Bull（価格追跡の定期実行）

## AI/ML Integration
- **画像認識**: OpenAI Vision API または Google Cloud Vision API
- **商品検索**: カスタムスクレイピングAPI
- **価格データ**: Puppeteer/Playwrightでのスクレイピング
- **キャッシング**: Redis（API結果のキャッシュ）

## Database
- **Primary DB**: PostgreSQL 15.x
- **Cache**: Redis 7.x
- **File Storage**: AWS S3 または Cloudflare R2
- **Database Migration**: Prisma Migrate

## Development Environment
- **Node.js**: v20.x LTS
- **Package Manager**: npm 10.x
- **IDE**: VS Code推奨
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **環境管理**: Docker Compose（開発環境）

## Common Commands
```bash
# 開発環境起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test

# リント
npm run lint

# データベースマイグレーション
npm run db:migrate

# 型チェック
npm run type-check

# Docker環境起動
docker-compose up -d
```

## Environment Variables
```
# アプリケーション設定
NODE_ENV=development|production
PORT=3000
API_URL=http://localhost:3000/api

# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/platdot

# Redis
REDIS_URL=redis://localhost:6379

# 認証
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI/ML API
OPENAI_API_KEY=your-openai-key
VISION_API_ENDPOINT=https://api.openai.com/v1

# ストレージ
S3_BUCKET=platdot-uploads
S3_REGION=ap-northeast-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# 決済
STRIPE_API_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# メール
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Port Configuration
- **Frontend Dev Server**: 3000
- **Backend API**: 3001
- **PostgreSQL**: 5432
- **Redis**: 6379
- **Swagger UI**: 3001/api-docs

## Security Considerations
- **HTTPS**: 本番環境では必須
- **CORS**: 適切なオリジン設定
- **Rate Limiting**: API保護
- **Input Validation**: 全入力の検証
- **SQL Injection対策**: ORMの使用
- **XSS対策**: React自動エスケープ + CSP
- **認証**: JWT + セキュアクッキー