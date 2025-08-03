# AI機能 API ドキュメント

## 概要
このディレクトリには、Gemini 2.5 Flash-Liteを使用したAI機能の実装が含まれています。

## 機能一覧

### 1. 画像認識機能 (`gemini.ts`)
- `recognizeItemFromImage()`: 画像から商品名、カテゴリ、メーカーを認識
- `checkRateLimit()`: 15 RPM のレート制限チェック
- `getCurrentRequests()`: 現在のリクエスト数取得

### 2. 価格検索機能 (`gemini.ts`)
- `searchItemPrices()`: Google検索グラウンディングによる価格調査
- `savePriceHistory()`: 価格履歴の保存
- `getPriceHistory()`: 価格履歴の取得

### 3. エラーハンドリング (`errors.ts`)
- 統一されたエラー分類とレスポンス
- ユーザーフレンドリーなエラーメッセージ
- 詳細なエラーログ

## API エンドポイント

### POST `/api/ai/recognize`
画像から商品情報を認識します。

**リクエスト:**
```json
{
  "imageBase64": "base64-encoded-image-data",
  "mimeType": "image/jpeg" // オプション
}
```

**レスポンス (成功):**
```json
{
  "success": true,
  "data": {
    "suggestions": ["商品名候補1", "商品名候補2", "商品名候補3"],
    "category": "カテゴリ名",
    "manufacturer": "メーカー名"
  }
}
```

**レスポンス (エラー):**
```json
{
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": {} // オプション
}
```

### GET `/api/ai/usage`
現在のAI使用状況を取得します。

**レスポンス:**
```json
{
  "currentUsage": 5,
  "monthlyUsage": 12,
  "usageLimit": 20,
  "subscriptionTier": "free",
  "remainingQuota": 15,
  "resetDate": "2025-09-01T00:00:00.000Z"
}
```

### GET `/api/ai/test`
AI接続テストを実行します。

**レスポンス:**
```json
{
  "status": "success",
  "message": "Gemini API connection successful",
  "testResponse": "こんにちは！",
  "apiKeyStatus": "configured",
  "model": "gemini-2.5-flash-lite"
}
```

## エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `UNAUTHORIZED` | 認証エラー | 401 |
| `RATE_LIMIT_EXCEEDED` | レート制限エラー | 429 |
| `VALIDATION_ERROR` | バリデーションエラー | 400 |
| `MISSING_IMAGE_DATA` | 画像データ不足 | 400 |
| `UNSUPPORTED_FORMAT` | 非サポート形式 | 400 |
| `AI_EMPTY_RESPONSE` | AI応答なし | 502 |
| `AI_RECOGNITION_FAILED` | AI認識失敗 | 502 |
| `NETWORK_ERROR` | ネットワークエラー | 502 |
| `INTERNAL_ERROR` | 内部エラー | 500 |

## 使用制限

- **レート制限**: 15 requests per minute (RPM)
- **対応画像形式**: JPEG, PNG, WebP
- **最大画像サイズ**: 制限なし（Base64エンコード）

## 環境設定

### 必要な環境変数
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

### データベース設定
- PriceHistory モデル: 価格検索履歴
- PriceHistoryDetail モデル: 詳細価格情報

## 開発・テスト

### テストユーティリティ (`test-utils.ts`)
```typescript
import { callRecognizeAPI, checkAIUsage, testAIConnection } from '@/lib/ai/test-utils'

// AI認識テスト
const result = await callRecognizeAPI(imageBase64)

// 使用量チェック
const usage = await checkAIUsage()

// 接続テスト
const status = await testAIConnection()
```

## 実装状況（タスク18）

- ✅ Google Generative AI SDK セットアップ
- ✅ Gemini 2.5 Flash-Lite モデル設定
- ✅ GEMINI_API_KEY 環境変数設定
- ✅ POST /api/ai/recognize エンドポイント実装
- ✅ レート制限機能実装
- ✅ エラーハンドリング実装
- ✅ バリデーション機能実装
- ✅ テストユーティリティ作成
- [ ] 動作確認テスト（API キー接続確認）

## 次のステップ

1. 動作確認テストの実行
2. タスク19: UI実装との連携
3. タスク20: 価格検索機能の完全実装