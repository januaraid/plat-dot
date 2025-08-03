/**
 * AI機能のテスト用ユーティリティ
 */

// テスト用Base64画像データ（小さな1x1ピクセルのPNG）
export const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

// テスト用のリクエストデータ
export const createTestRecognizeRequest = (imageBase64?: string) => ({
  imageBase64: imageBase64 || TEST_IMAGE_BASE64,
  mimeType: 'image/png'
})

// API応答の型チェック用ヘルパー
export function isValidRecognizeResponse(response: any): boolean {
  return (
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    (response.success === false || (
      Array.isArray(response.data?.suggestions) &&
      response.data.suggestions.length > 0
    ))
  )
}

// エラーレスポンスの型チェック用ヘルパー
export function isValidErrorResponse(response: any): boolean {
  return (
    typeof response === 'object' &&
    typeof response.error === 'string' &&
    (typeof response.code === 'string' || response.code === undefined)
  )
}

// API呼び出し用ヘルパー（フロントエンド用）
export async function callRecognizeAPI(imageBase64: string, mimeType?: string) {
  const response = await fetch('/api/ai/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64,
      mimeType: mimeType || 'image/png'
    })
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'API call failed')
  }
  
  return data
}

// AI使用量チェックAPI呼び出し用ヘルパー
export async function checkAIUsage() {
  const response = await fetch('/api/ai/usage')
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Usage check failed')
  }
  
  return data
}

// AI接続テストAPI呼び出し用ヘルパー
export async function testAIConnection() {
  const response = await fetch('/api/ai/test')
  const data = await response.json()
  
  return data
}