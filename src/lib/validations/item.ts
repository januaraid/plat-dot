import { z } from 'zod'

/**
 * アイテム作成時のバリデーションスキーマ
 */
export const createItemSchema = z.object({
  name: z.string()
    .min(1, '商品名は必須です')
    .max(100, '商品名は100文字以内で入力してください'),
  
  description: z.string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  
  category: z.string()
    .max(50, 'カテゴリーは50文字以内で入力してください')
    .optional(),
  
  purchaseDate: z.string()
    .datetime()
    .or(z.date())
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  
  purchasePrice: z.number()
    .min(0, '購入価格は0以上で入力してください')
    .max(999999999, '購入価格が大きすぎます')
    .optional(),
  
  purchaseLocation: z.string()
    .max(200, '購入場所は200文字以内で入力してください')
    .optional(),
  
  condition: z.string()
    .max(50, '状態は50文字以内で入力してください')
    .optional(),
  
  notes: z.string()
    .max(2000, 'メモは2000文字以内で入力してください')
    .optional(),
  
  folderId: z.number()
    .int()
    .positive()
    .optional(),
})

/**
 * アイテム更新時のバリデーションスキーマ
 */
export const updateItemSchema = createItemSchema.partial()

/**
 * アイテムID パラメータのバリデーション
 */
export const itemIdSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, '有効なIDを指定してください')
    .transform(Number),
})

/**
 * アイテム検索時のバリデーションスキーマ
 */
export const searchItemsSchema = z.object({
  q: z.string()
    .max(100, '検索キーワードは100文字以内で入力してください')
    .optional(),
  
  category: z.string()
    .max(50, 'カテゴリーは50文字以内で入力してください')
    .optional(),
  
  folderId: z.string()
    .regex(/^\d+$/, '有効なフォルダIDを指定してください')
    .transform(Number)
    .optional(),
  
  page: z.string()
    .regex(/^\d+$/, '有効なページ番号を指定してください')
    .transform(Number)
    .optional()
    .default('1'),
  
  limit: z.string()
    .regex(/^\d+$/, '有効な表示件数を指定してください')
    .transform(Number)
    .refine(val => val <= 100, '表示件数は100件以下で指定してください')
    .optional()
    .default('20'),
  
  sort: z.enum(['createdAt', 'updatedAt', 'name', 'purchaseDate'])
    .optional()
    .default('updatedAt'),
  
  order: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),
})

/**
 * 型エクスポート
 */
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type ItemIdInput = z.infer<typeof itemIdSchema>
export type SearchItemsInput = z.infer<typeof searchItemsSchema>