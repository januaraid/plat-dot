# Project Structure

## Root Directory Organization
```
plat-dot/
├── .claude/                    # Claude Code設定
│   └── commands/              # カスタムスラッシュコマンド
├── .kiro/                     # Kiro仕様駆動開発
│   ├── steering/              # ステアリングドキュメント
│   └── specs/                 # 機能仕様
├── src/                       # ソースコード
│   ├── client/               # フロントエンドコード
│   ├── server/               # バックエンドコード
│   └── shared/               # 共有コード
├── public/                    # 静的ファイル
├── tests/                     # テストコード
├── scripts/                   # ビルド・デプロイスクリプト
├── docker/                    # Docker設定
├── docs/                      # プロジェクトドキュメント
├── .env.example              # 環境変数テンプレート
├── .gitignore                # Git除外設定
├── docker-compose.yml        # Docker Compose設定
├── package.json              # プロジェクト設定
├── tsconfig.json             # TypeScript設定
├── CLAUDE.md                 # Claude Code指示書
└── README.md                 # プロジェクト説明
```

## Subdirectory Structures

### Frontend Structure (`src/client/`)
```
src/client/
├── components/               # Reactコンポーネント
│   ├── common/              # 共通コンポーネント
│   ├── features/            # 機能別コンポーネント
│   │   ├── items/          # アイテム管理
│   │   ├── folders/        # フォルダ管理
│   │   ├── ai/             # AI機能
│   │   └── auth/           # 認証
│   └── layouts/             # レイアウトコンポーネント
├── hooks/                   # カスタムフック
├── store/                   # 状態管理
│   ├── slices/             # Redux slices
│   └── api/                # RTK Query API定義
├── styles/                  # グローバルスタイル
├── utils/                   # ユーティリティ関数
├── types/                   # TypeScript型定義
└── pages/                   # ページコンポーネント
```

### Backend Structure (`src/server/`)
```
src/server/
├── api/                     # APIエンドポイント
│   ├── routes/             # ルート定義
│   ├── controllers/        # コントローラー
│   ├── middlewares/        # ミドルウェア
│   └── validators/         # リクエスト検証
├── services/               # ビジネスロジック
│   ├── auth/              # 認証サービス
│   ├── items/             # アイテム管理
│   ├── ai/                # AI統合
│   ├── pricing/           # 価格追跡
│   └── storage/           # ファイルストレージ
├── models/                 # データモデル
├── db/                     # データベース設定
│   ├── migrations/        # マイグレーション
│   └── seeds/             # シードデータ
├── jobs/                   # バックグラウンドジョブ
├── utils/                  # ユーティリティ
└── config/                 # 設定ファイル
```

### Shared Structure (`src/shared/`)
```
src/shared/
├── types/                  # 共有型定義
├── constants/              # 定数定義
├── schemas/                # Zodスキーマ
└── utils/                  # 共有ユーティリティ
```

## Code Organization Patterns

### Component Organization
- **Atomic Design**: atoms → molecules → organisms → templates → pages
- **Feature-based**: 機能ごとにコンポーネントをグループ化
- **Co-location**: コンポーネントと関連ファイルを同じディレクトリに配置

### Service Layer Pattern
```typescript
// services/items/itemService.ts
export class ItemService {
  async createItem(data: CreateItemDto): Promise<Item>
  async updateItem(id: string, data: UpdateItemDto): Promise<Item>
  async deleteItem(id: string): Promise<void>
  async getItems(filters: ItemFilters): Promise<PaginatedItems>
}
```

### API Route Pattern
```typescript
// api/routes/items.ts
router.post('/items', validate(createItemSchema), itemController.create)
router.put('/items/:id', validate(updateItemSchema), itemController.update)
router.delete('/items/:id', authenticate, itemController.delete)
router.get('/items', paginate, itemController.list)
```

## File Naming Conventions

### General Rules
- **ファイル名**: kebab-case（例: `item-service.ts`）
- **コンポーネント**: PascalCase（例: `ItemCard.tsx`）
- **フック**: camelCase with 'use' prefix（例: `useItems.ts`）
- **定数**: UPPER_SNAKE_CASE（例: `API_ENDPOINTS.ts`）
- **型定義**: PascalCase with suffix（例: `ItemType.ts`）

### Specific Patterns
```
components/items/ItemCard.tsx          # コンポーネント
components/items/ItemCard.test.tsx     # テスト
components/items/ItemCard.module.css   # スタイル
hooks/useItemManagement.ts             # カスタムフック
services/item-service.ts               # サービス
types/item.types.ts                    # 型定義
utils/format-price.ts                  # ユーティリティ
```

## Import Organization

### Import Order
```typescript
// 1. 外部ライブラリ
import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

// 2. 内部エイリアス
import { Button } from '@/components/common'
import { useAuth } from '@/hooks'
import { ItemService } from '@/services'

// 3. 相対インポート
import { ItemCard } from './ItemCard'
import { formatPrice } from '../utils'

// 4. 型定義
import type { Item, ItemFilters } from '@/types'
```

### Path Aliases
```json
{
  "@/components/*": ["src/client/components/*"],
  "@/hooks/*": ["src/client/hooks/*"],
  "@/services/*": ["src/server/services/*"],
  "@/types/*": ["src/shared/types/*"],
  "@/utils/*": ["src/shared/utils/*"]
}
```

## Key Architectural Principles

### 1. Separation of Concerns
- **Presentation**: Reactコンポーネント（UI表示）
- **Business Logic**: サービス層（ビジネスルール）
- **Data Access**: リポジトリパターン（データベースアクセス）

### 2. Single Responsibility
- 各モジュールは単一の責任を持つ
- コンポーネントは表示に専念
- サービスはビジネスロジックに専念

### 3. Dependency Injection
- サービスは依存性注入で提供
- テスタビリティの向上
- 疎結合な設計

### 4. Type Safety
- TypeScript厳密モード
- Zodによるランタイム検証
- 型の単一定義源

### 5. Error Handling
- グローバルエラーハンドラー
- カスタムエラークラス
- ユーザーフレンドリーなエラーメッセージ

### 6. Performance Optimization
- 遅延読み込み
- メモ化
- 仮想スクロール
- 画像最適化