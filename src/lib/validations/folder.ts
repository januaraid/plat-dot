import { z } from 'zod'

/**
 * カスタムバリデーション関数
 */

// フォルダ名のバリデーション（必須、trim、文字数・文字制限）
const folderNameValidation = z.string()
  .transform(val => val?.trim())
  .refine(val => val && val.length >= 1, 'フォルダ名は必須です')
  .refine(val => val && val.length <= 100, 'フォルダ名は100文字以内で入力してください')
  .refine(val => {
    // Windows/macOS/Linuxで使用できない文字をチェック
    const invalidChars = /[/\\:*?"<>|]/
    return val && !invalidChars.test(val)
  }, 'フォルダ名に使用できない文字が含まれています（/ \\ : * ? " < > |）')
  .refine(val => {
    // 予約語チェック（Windows）
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    return val && !reservedNames.includes(val.toUpperCase())
  }, 'このフォルダ名は予約語のため使用できません')

// オプショナルフォルダ名（更新時用）
const optionalFolderNameValidation = z.string()
  .transform(val => val?.trim())
  .refine(val => !val || val.length >= 1, 'フォルダ名は1文字以上で入力してください')
  .refine(val => !val || val.length <= 100, 'フォルダ名は100文字以内で入力してください')
  .refine(val => {
    if (!val) return true
    const invalidChars = /[/\\:*?"<>|]/
    return !invalidChars.test(val)
  }, 'フォルダ名に使用できない文字が含まれています（/ \\ : * ? " < > |）')
  .refine(val => {
    if (!val) return true
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    return !reservedNames.includes(val.toUpperCase())
  }, 'このフォルダ名は予約語のため使用できません')
  .optional()

// 親フォルダIDのバリデーション
const parentIdValidation = z.union([
  z.string()
    .transform(val => val?.trim())
    .refine(val => {
      if (val === '' || val === undefined) return true
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効な親フォルダIDを指定してください')
    .transform(val => val === '' ? null : val),
  z.null()
])
.optional()

// 説明のバリデーション
const descriptionValidation = z.string()
  .transform(val => val?.trim() || undefined)
  .refine(val => !val || val.length <= 500, '説明は500文字以内で入力してください')
  .optional()

/**
 * フォルダ作成時のバリデーションスキーマ
 */
export const createFolderSchema = z.object({
  name: folderNameValidation,
  description: descriptionValidation,
  parentId: parentIdValidation,
})

/**
 * フォルダ更新時のバリデーションスキーマ
 */
export const updateFolderSchema = z.object({
  name: optionalFolderNameValidation,
  description: descriptionValidation,
  parentId: parentIdValidation,
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
 * フォルダID パラメータのバリデーション
 */
export const folderIdSchema = z.object({
  id: z.string()
    .min(1, 'フォルダIDは必須です')
    .refine(val => {
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なフォルダIDを指定してください'),
})

/**
 * フォルダ一覧取得時のバリデーションスキーマ
 */
export const getFoldersSchema = z.object({
  parentId: parentIdValidation,
  
  includeItemCount: z.union([
    z.string().transform(val => val === 'true'),
    z.boolean()
  ])
  .optional()
  .default(false),
  
  includeChildren: z.union([
    z.string().transform(val => val === 'true'),
    z.boolean()
  ])
  .optional()
  .default(false),
})

/**
 * アイテム移動時のバリデーションスキーマ
 */
export const moveItemsSchema = z.object({
  itemIds: z.array(z.string())
    .min(1, '移動するアイテムを選択してください')
    .max(100, '一度に移動できるアイテムは100個までです'),
  
  targetFolderId: z.string()
    .nullable(),
})

/**
 * 型エクスポート
 */
export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type FolderIdInput = z.infer<typeof folderIdSchema>
export type GetFoldersInput = z.infer<typeof getFoldersSchema>
export type MoveItemsInput = z.infer<typeof moveItemsSchema>