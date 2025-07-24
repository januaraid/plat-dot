# セキュリティ機能テストガイド

## 1. セキュリティヘッダーの確認

### 開発サーバーを起動
```bash
npm run dev
```

### curlでヘッダーを確認
```bash
# トップページのヘッダー確認
curl -I http://localhost:3000/

# APIエンドポイントのヘッダー確認
curl -I http://localhost:3000/api/auth/session
```

### 確認すべきヘッダー
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` が設定されている
- `Permissions-Policy` が設定されている

## 2. レート制限の動作確認

### 通常のAPIエンドポイント（1分間に100回まで）
```bash
# 連続リクエストでレート制限をテスト
for i in {1..105}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/session
  if [ $i -eq 100 ]; then
    echo "100回目のリクエスト完了"
  fi
done
```

### 認証APIエンドポイント（15分間に5回まで）
```bash
# /api/auth/* は厳しい制限
for i in {1..7}; do
  echo "Auth Request $i:"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/providers
done
```

期待される結果：
- 制限を超えると `429 Too Many Requests` が返される
- レスポンスヘッダーに `X-RateLimit-Reset` と `Retry-After` が含まれる

## 3. Zodバリデーションの確認

### APIエンドポイントを作成してテスト
```typescript
// src/app/api/test/validation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createItemSchema, validationErrorResponse } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createItemSchema.parse(body)
    return NextResponse.json({ success: true, data: validated })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error)
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

### バリデーションテスト
```bash
# 正常なリクエスト
curl -X POST http://localhost:3000/api/test/validation \
  -H "Content-Type: application/json" \
  -d '{"name": "テストアイテム"}'

# バリデーションエラー（nameが空）
curl -X POST http://localhost:3000/api/test/validation \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'

# バリデーションエラー（nameが長すぎる）
curl -X POST http://localhost:3000/api/test/validation \
  -H "Content-Type: application/json" \
  -d '{"name": "'$(printf 'あ%.0s' {1..101})'"}'
```

## 4. HTTPS強制の確認（本番環境のみ）

本番環境では、HTTPアクセスが自動的にHTTPSにリダイレクトされることを確認：
- `http://your-domain.com` → `https://your-domain.com` へ301リダイレクト
- レスポンスヘッダーに `Strict-Transport-Security` が含まれる

## 5. ブラウザでの総合確認

### Chrome DevToolsで確認
1. http://localhost:3000 を開く
2. DevTools → Network タブを開く
3. ページをリロード
4. Response Headers で各セキュリティヘッダーを確認

### Console でCSPエラーがないか確認
- Google OAuth関連のリソースがブロックされていないこと
- 必要なスクリプトやスタイルが正常に読み込まれること

## 6. 認証が必要なエンドポイントの確認

```bash
# 未認証状態でAPIアクセス（リダイレクトされるはず）
curl -I http://localhost:3000/api/items

# 未認証状態でダッシュボードアクセス（リダイレクトされるはず）
curl -I http://localhost:3000/dashboard
```

期待される結果：
- `/auth/signin` へのリダイレクト（302 or 307）

## テスト完了チェックリスト

- [ ] セキュリティヘッダーが正しく設定されている
- [ ] レート制限が正常に動作する
- [ ] バリデーションエラーが適切に返される
- [ ] 認証が必要なルートで未認証時にリダイレクトされる
- [ ] CSPエラーがなく、OAuth認証が正常に動作する
- [ ] 開発環境でHTTPS強制がスキップされる

すべての項目が確認できれば、セキュリティ機能の実装は正常に完了しています。