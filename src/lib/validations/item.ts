import { z } from 'zod'

/**
 * カスタムバリデーション関数
 */

// 文字列の前後空白を除去し、空文字列をundefinedに変換
const trimmedOptionalString = (maxLength?: number, fieldName?: string) => {
  let schema = z.string()
    .transform(val => val?.trim() || undefined)
    .optional()
  
  if (maxLength && fieldName) {
    schema = (schema as any).refine(
      (val: any) => !val || val.length <= maxLength,
      `${fieldName}は${maxLength}文字以内で入力してください`
    )
  }
  
  return schema
}

// 必須文字列（前後空白除去、空文字エラー）
const requiredTrimmedString = (minLength: number, maxLength: number, fieldName: string) => {
  return z.string()
    .transform(val => val?.trim())
    .refine(val => val && val.length >= minLength, `${fieldName}は必須です`)
    .refine(val => val && val.length <= maxLength, `${fieldName}は${maxLength}文字以内で入力してください`)
}

// 日付文字列のバリデーション（ISO形式または日付オブジェクト）
const dateValidation = z.union([
  z.string()
    .transform(val => val?.trim()) // 前後空白除去
    .refine(val => {
      if (val === '' || val === undefined) return true
      // 空でない場合は日付として有効かチェック
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, '有効な日付形式で入力してください')
    .transform(val => {
      if (val === '' || val === undefined) return undefined
      return new Date(val)
    }),
  z.date()
])
.optional()
.refine(val => {
  if (!val) return true
  // 未来の日付チェック（購入日は未来であってはならない）
  const now = new Date()
  const inputDate = val instanceof Date ? val : new Date(val)
  // 時刻を無視して日付のみで比較
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate())
  return inputDateOnly <= nowDate
}, '購入日は現在より未来の日付にはできません')
.transform(val => {
  if (!val) return undefined
  return val instanceof Date ? val : new Date(val)
})

// 価格のバリデーション（正数、小数点2桁まで）
const priceValidation = z.union([
  z.number(),
  z.string()
    .transform(val => val?.trim()) // 前後空白除去
    .refine(val => val === '' || val === undefined || !isNaN(parseFloat(val)), '有効な数値を入力してください')
    .transform(val => {
      if (val === '' || val === undefined) return undefined
      const num = parseFloat(val)
      return num
    })
])
.optional()
.refine(val => val === undefined || val >= 0, '価格は0以上で入力してください')
.refine(val => val === undefined || val <= 999999999, '価格が大きすぎます（999,999,999以下で入力してください）')
.refine(val => {
  if (val === undefined) return true
  // 小数点2桁までチェック
  const decimalPlaces = (val.toString().split('.')[1] || '').length
  return decimalPlaces <= 2
}, '価格は小数点以下2桁までで入力してください')

/**
 * 基本アイテムスキーマ（refineなし）
 */
const baseItemSchema = z.object({
  name: requiredTrimmedString(1, 100, '商品名'),
  
  description: trimmedOptionalString(1000, '説明'),
  
  category: trimmedOptionalString(50, 'カテゴリー'),
  
  manufacturer: trimmedOptionalString(100, 'メーカー'),
  
  purchaseDate: dateValidation,
  
  purchasePrice: priceValidation,
  
  purchaseLocation: trimmedOptionalString(200, '購入場所'),
  
  condition: trimmedOptionalString(50, '状態'),
  
  notes: trimmedOptionalString(2000, 'メモ'),
  
  folderId: z.string()
    .transform(val => val?.trim())
    .refine(val => {
      if (val === '' || val === undefined) return true
      // UUIDまたはCUID形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なフォルダIDを指定してください')
    .transform(val => val === '' ? undefined : val)
    .optional(),
})

/**
 * アイテム作成時のバリデーションスキーマ
 */
export const createItemSchema = baseItemSchema
.refine(data => {
  // カスタムビジネスルールバリデーション
  if (data.purchasePrice && data.purchasePrice > 0 && !data.purchaseDate) {
    return false
  }
  return true
}, {
  message: '購入価格を入力した場合は購入日も必須です',
  path: ['purchaseDate']
})

/**
 * アイテム更新時のバリデーションスキーマ
 */
export const updateItemSchema = baseItemSchema.partial()
  .refine(data => {
    // 更新時のビジネスルールバリデーション
    if (data.purchasePrice && data.purchasePrice > 0 && !data.purchaseDate) {
      return false
    }
    return true
  }, {
    message: '購入価格を入力した場合は購入日も必須です',
    path: ['purchaseDate']
  })
  .refine(data => {
    // 少なくとも1つのフィールドが更新されていることを確認
    const hasUpdate = Object.values(data).some(value => value !== undefined)
    return hasUpdate
  }, {
    message: '更新する項目を少なくとも1つ指定してください',
    path: ['_root']
  })

/**
 * アイテムID パラメータのバリデーション
 */
export const itemIdSchema = z.object({
  id: z.string()
    .min(1, 'アイテムIDは必須です')
    .refine(val => {
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なアイテムIDを指定してください'),
})

/**
 * アイテム検索時のバリデーションスキーマ
 */
export const searchItemsSchema = z.object({
  q: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 100, '検索キーワードは100文字以内で入力してください')
    .refine(val => !val || val.length >= 1, '検索キーワードは1文字以上で入力してください')
    .optional(),
  
  category: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 50, 'カテゴリーは50文字以内で入力してください')
    .optional(),
  
  manufacturer: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 100, 'メーカーは100文字以内で入力してください')
    .optional(),
  
  folderId: z.string()
    .transform(val => val?.trim())
    .refine(val => {
      if (val === '' || val === undefined) return true
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なフォルダIDを指定してください')
    .transform(val => val === '' ? undefined : val)
    .optional(),
  
  page: z.union([
    z.string().regex(/^\d+$/, '有効なページ番号を指定してください').transform(Number),
    z.number().int('ページ番号は整数で指定してください')
  ])
  .refine(val => val >= 1, 'ページ番号は1以上で指定してください')
  .refine(val => val <= 10000, 'ページ番号は10000以下で指定してください')
  .optional()
  .default(1),
  
  limit: z.union([
    z.string().regex(/^\d+$/, '有効な表示件数を指定してください').transform(Number),
    z.number().int('表示件数は整数で指定してください')
  ])
  .refine(val => val >= 1, '表示件数は1以上で指定してください')
  .refine(val => val <= 100, '表示件数は100件以下で指定してください')
  .optional()
  .default(20),
  
  sort: z.enum(['createdAt', 'updatedAt', 'name', 'purchaseDate'], {
    errorMap: () => ({ message: 'ソート項目は createdAt, updatedAt, name, purchaseDate のいずれかを指定してください' })
  })
  .optional()
  .default('updatedAt'),
  
  order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'ソート順は asc または desc を指定してください' })
  })
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