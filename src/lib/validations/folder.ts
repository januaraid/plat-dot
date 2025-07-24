import { z } from 'zod'

/**
 * フォルダ作成時のバリデーションスキーマ
 */
export const createFolderSchema = z.object({
  name: z.string()
    .min(1, 'フォルダ名は必須です')
    .max(100, 'フォルダ名は100文字以内で入力してください')
    .regex(/^[^/\\:*?"<>|]+$/, '使用できない文字が含まれています'),
  
  parentId: z.number()
    .int()
    .positive()
    .optional(),
})

/**
 * フォルダ更新時のバリデーションスキーマ
 */
export const updateFolderSchema = z.object({
  name: z.string()
    .min(1, 'フォルダ名は必須です')
    .max(100, 'フォルダ名は100文字以内で入力してください')
    .regex(/^[^/\\:*?"<>|]+$/, '使用できない文字が含まれています')
    .optional(),
  
  parentId: z.number()
    .int()
    .positive()
    .nullable()
    .optional(),
})

/**
 * フォルダID パラメータのバリデーション
 */
export const folderIdSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, '有効なIDを指定してください')
    .transform(Number),
})

/**
 * フォルダ一覧取得時のバリデーションスキーマ
 */
export const getFoldersSchema = z.object({
  parentId: z.string()
    .regex(/^\d+$/, '有効な親フォルダIDを指定してください')
    .transform(Number)
    .optional(),
  
  includeItemCount: z.string()
    .transform(val => val === 'true')
    .optional()
    .default('false'),
})

/**
 * アイテム移動時のバリデーションスキーマ
 */
export const moveItemsSchema = z.object({
  itemIds: z.array(z.number().int().positive())
    .min(1, '移動するアイテムを選択してください')
    .max(100, '一度に移動できるアイテムは100個までです'),
  
  targetFolderId: z.number()
    .int()
    .positive()
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