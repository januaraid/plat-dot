import { z } from 'zod'

/**
 * 画像アップロード時のバリデーションスキーマ
 */
export const uploadImageSchema = z.object({
  itemId: z.string(),
  
  order: z.number()
    .int()
    .min(0, '表示順序は0以上で指定してください')
    .max(9, '表示順序は9以下で指定してください')
    .optional()
    .default(0),
})

/**
 * ファイルバリデーション設定
 */
export const fileValidationConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
}

/**
 * ファイルバリデーション関数
 */
export function validateImageFile(file: File): string | null {
  // ファイルサイズチェック
  if (file.size > fileValidationConfig.maxSize) {
    return 'ファイルサイズは10MB以下にしてください'
  }

  // ファイル形式チェック
  if (!fileValidationConfig.acceptedFormats.includes(file.type)) {
    return 'JPG、PNG、WEBPファイルのみアップロード可能です'
  }

  // ファイル名拡張子チェック
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !fileValidationConfig.acceptedExtensions.includes(extension)) {
    return '有効なファイル拡張子を持つファイルを選択してください'
  }

  return null
}

/**
 * 画像削除時のバリデーションスキーマ
 */
export const deleteImageSchema = z.object({
  imageId: z.string(),
})

/**
 * 画像順序更新時のバリデーションスキーマ
 */
export const updateImageOrderSchema = z.object({
  imageOrders: z.array(
    z.object({
      imageId: z.string(),
      order: z.number().int().min(0).max(9),
    })
  )
  .min(1, '更新する画像を指定してください')
  .max(10, '一度に更新できる画像は10枚までです'),
})

/**
 * 型エクスポート
 */
export type UploadImageInput = z.infer<typeof uploadImageSchema>
export type DeleteImageInput = z.infer<typeof deleteImageSchema>
export type UpdateImageOrderInput = z.infer<typeof updateImageOrderSchema>