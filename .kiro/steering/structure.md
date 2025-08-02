# Project Structure

## Root Directory Organization
```
plat-dot/
├── .claude/                    # Claude Code設定
│   └── commands/              # カスタムスラッシュコマンド
│       └── kiro/              # Kiro開発コマンド
├── .kiro/                     # Kiro仕様駆動開発
│   ├── steering/              # ステアリングドキュメント
│   └── specs/                 # 機能仕様
├── prisma/                    # Prismaデータベース設定
│   ├── migrations/            # データベースマイグレーション
│   ├── schema.prisma          # データベーススキーマ定義
│   └── seed.ts                # シードデータ
├── public/                    # 静的ファイル
├── src/                       # ソースコード
│   ├── app/                   # Next.js App Router
│   ├── components/            # Reactコンポーネント
│   ├── lib/                   # ユーティリティ・ヘルパー
│   ├── types/                 # TypeScript型定義
│   └── middleware.ts          # Next.jsミドルウェア
├── .env.local                 # ローカル環境変数
├── .gitignore                 # Git除外設定
├── next.config.js             # Next.js設定
├── package.json               # プロジェクト設定
├── postcss.config.js          # PostCSS設定
├── tailwind.config.ts         # Tailwind CSS設定
├── tsconfig.json              # TypeScript設定
└── CLAUDE.md                  # Claude Code指示書
```

## Subdirectory Structures

### App Router Structure (`src/app/`)
```
src/app/
├── api/                      # API Route Handlers
│   ├── auth/                 # 認証エンドポイント
│   │   ├── [...nextauth]/   # NextAuth.js動的ルート
│   │   └── session/         # セッション管理
│   ├── items/               # アイテム管理API
│   │   ├── [id]/            # 個別アイテム操作
│   │   └── route.ts         # アイテム一覧・作成
│   └── test/                # テスト用エンドポイント
├── auth/                    # 認証関連ページ
│   ├── signin/              # サインインページ
│   └── error/               # 認証エラーページ
├── test/                    # テストページ（開発用）
│   └── items/               # アイテム管理テスト
├── debug/                   # デバッグページ（開発用）
├── globals.css              # グローバルスタイル
├── layout.tsx               # ルートレイアウト
└── page.tsx                 # ホームページ
```

### Components Structure (`src/components/`)
```
src/components/
├── folders/                # フォルダ管理コンポーネント
│   ├── FolderTree.tsx     # フォルダツリー表示
│   ├── FolderModal.tsx    # フォルダ作成・編集モーダル
│   └── Breadcrumb.tsx     # パンくずナビゲーション
├── items/                  # アイテム管理コンポーネント
│   ├── ItemCard.tsx       # アイテムカード表示
│   ├── ItemForm.tsx       # アイテム作成・編集フォーム
│   ├── ItemGrid.tsx       # アイテムグリッド表示
│   ├── ItemFilters.tsx    # フィルター・検索UI
│   └── Pagination.tsx     # ページネーション
├── ui/                     # UI基底コンポーネント
│   ├── Modal.tsx          # 汎用モーダル
│   ├── Sidebar.tsx        # サイドバー
│   ├── Header.tsx         # ヘッダー
│   └── Navigation.tsx     # ナビゲーション
├── providers/              # Contextプロバイダー
│   └── SessionProvider.tsx # NextAuth セッションプロバイダー
└── UploadedImage.tsx       # 画像表示コンポーネント
```

### Additional Source Structure (`src/`)
```
src/
├── contexts/               # React Context管理
│   └── SidebarContext.tsx # サイドバー状態管理
└── hooks/                  # カスタムReactフック
    └── useItems.ts        # アイテム操作フック
```

### Library Structure (`src/lib/`)
```
src/lib/
├── auth.ts                  # NextAuth設定
├── db.ts                    # データベース接続ヘルパー
├── prisma.ts                # Prismaクライアント
├── rate-limit.ts            # レート制限ユーティリティ
├── security.ts              # セキュリティユーティリティ
├── user-helper.ts           # ユーザー関連ヘルパー
├── utils.ts                 # 汎用ユーティリティ
└── validations/             # Zodバリデーションスキーマ
    ├── index.ts             # エクスポート集約
    ├── item.ts              # アイテムバリデーション
    ├── folder.ts            # フォルダバリデーション
    ├── upload.ts            # アップロードバリデーション
    └── user.ts              # ユーザーバリデーション
```

## Code Organization Patterns

### Next.js App Router Patterns
- **Server Components**: デフォルトで使用、データフェッチとレンダリング
- **Client Components**: `'use client'`ディレクティブで明示的に指定
- **Route Handlers**: `app/api/`内の`route.ts`ファイルでAPI定義
- **Co-location**: 関連ファイルを同じディレクトリに配置

### API Route Handler Pattern
```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { itemSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ビジネスロジック
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const body = await request.json()
  const validated = itemSchema.parse(body)
  // ビジネスロジック
}
```

### Prisma Data Access Pattern
```typescript
// lib/db.ts
import { prisma } from '@/lib/prisma'

export async function getItemsByUserId(userId: string) {
  return prisma.item.findMany({
    where: { userId },
    include: { folder: true },
    orderBy: { createdAt: 'desc' }
  })
}
```

## File Naming Conventions

### General Rules
- **ファイル名**: kebab-case（例: `user-helper.ts`）
- **コンポーネント**: PascalCase（例: `SessionProvider.tsx`）
- **API Routes**: `route.ts`（固定）
- **レイアウト**: `layout.tsx`（固定）
- **ページ**: `page.tsx`（固定）
- **型定義**: kebab-case（例: `next-auth.d.ts`）

### Next.js App Router特有のパターン
```
app/items/page.tsx                     # アイテム一覧ページ
app/items/[id]/page.tsx                # アイテム詳細ページ
app/api/items/route.ts                 # アイテムAPI（一覧・作成）
app/api/items/[id]/route.ts            # アイテムAPI（個別操作）
components/providers/SessionProvider.tsx # プロバイダーコンポーネント
lib/validations/item.ts                # バリデーションスキーマ
types/next-auth.d.ts                   # 型定義拡張
```

## Import Organization

### Import Order
```typescript
// 1. Next.js関連
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// 2. 外部ライブラリ
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// 3. 内部エイリアス（@/）
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { itemSchema } from '@/lib/validations'

// 4. 相対インポート
import { formatDate } from '../utils'

// 5. 型定義
import type { Item, User } from '@prisma/client'
```

### Path Aliases (tsconfig.json)
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

## Key Architectural Principles

### 1. Next.js App Router Best Practices
- **Server Components優先**: クライアントサイドJSを最小限に
- **データフェッチ**: Server Components内で直接実行
- **キャッシング**: Next.jsの自動キャッシング活用
- **ストリーミング**: Suspenseとローディング状態の活用

### 2. 認証とセキュリティ
- **NextAuth.js**: 統一された認証フロー
- **セッション管理**: サーバーサイドセッション
- **API保護**: すべてのAPIルートで認証チェック
- **レート制限**: API乱用防止

### 3. データアクセス層
- **Prisma ORM**: 型安全なデータベースアクセス
- **トランザクション**: 複数操作の整合性保証
- **最適化**: includeとselectで必要なデータのみ取得

### 4. Type Safety
- **TypeScript厳密モード**: 型安全性の最大化
- **Zodバリデーション**: ランタイム型検証
- **Prisma型生成**: データベーススキーマから自動生成

### 5. Error Handling
- **try-catchパターン**: 各APIルートで適切なエラーハンドリング
- **HTTPステータスコード**: 適切なステータスコードの返却
- **エラーメッセージ**: ユーザーフレンドリーなメッセージ

### 6. 開発効率
- **ホットリロード**: Next.js開発サーバー
- **型チェック**: TypeScriptによる開発時エラー検出
- **Prisma Studio**: GUIでのデータベース操作