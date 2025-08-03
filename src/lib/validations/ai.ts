import { z } from 'zod'

// AI画像認識リクエストのバリデーション
export const aiRecognizeRequestSchema = z.object({
  imageBase64: z.string()
    .min(1, '画像データが必要です')
    .refine(
      (data) => {
        // Base64形式の簡単な検証
        try {
          const base64Regex = /^[A-Za-z0-9+/]+(=*)$/
          return base64Regex.test(data.replace(/^data:image\/[a-z]+;base64,/, ''))
        } catch {
          return false
        }
      },
      '有効なBase64画像データではありません'
    ),
  mimeType: z.string()
    .regex(/^image\/(jpeg|jpg|png|webp)$/, 'サポートされていない画像形式です')
    .optional()
})

// AI画像認識レスポンスの型
export const aiRecognizeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    suggestions: z.array(z.string()).min(1, '商品名候補が必要です'),
    category: z.string().optional(),
    manufacturer: z.string().optional()
  }).optional(),
  error: z.string().optional(),
  code: z.string().optional()
})

// 価格検索リクエストのバリデーション
export const aiPriceSearchRequestSchema = z.object({
  itemId: z.string().optional(),
  itemName: z.string()
    .min(1, '商品名が必要です')
    .max(200, '商品名は200文字以内で入力してください'),
  manufacturer: z.string()
    .max(100, 'メーカー名は100文字以内で入力してください')
    .optional(),
  saveHistory: z.boolean().default(true)
})

// 価格検索レスポンスの型
export const aiPriceSearchResponseSchema = z.object({
  success: z.boolean(),
  prices: z.array(z.object({
    price: z.string(),
    site: z.string(),
    url: z.string().url().optional(),
    condition: z.string().optional()
  })).optional(),
  summary: z.string().optional(),
  historyId: z.string().optional(),
  error: z.string().optional(),
  code: z.string().optional()
})

// エラーレスポンスの型
export const aiErrorResponseSchema = z.object({
  error: z.string(),
  code: z.enum([
    'UNAUTHORIZED',
    'RATE_LIMIT_EXCEEDED',
    'MISSING_IMAGE_DATA',
    'UNSUPPORTED_FORMAT',
    'AI_EMPTY_RESPONSE',
    'AI_RECOGNITION_FAILED',
    'INTERNAL_ERROR'
  ]).optional()
})

// 型エクスポート
export type AiRecognizeRequest = z.infer<typeof aiRecognizeRequestSchema>
export type AiRecognizeResponse = z.infer<typeof aiRecognizeResponseSchema>
export type AiPriceSearchRequest = z.infer<typeof aiPriceSearchRequestSchema>
export type AiPriceSearchResponse = z.infer<typeof aiPriceSearchResponseSchema>
export type AiErrorResponse = z.infer<typeof aiErrorResponseSchema>