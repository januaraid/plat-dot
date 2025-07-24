import { z } from 'zod'

/**
 * ユーザープロフィール更新時のバリデーションスキーマ
 */
export const updateUserProfileSchema = z.object({
  name: z.string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください')
    .optional(),
  
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .max(200, 'メールアドレスは200文字以内で入力してください')
    .optional(),
})

/**
 * パスワードリセットリクエストのバリデーション
 */
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .max(200, 'メールアドレスは200文字以内で入力してください'),
})

/**
 * パスワードリセット実行のバリデーション
 */
export const passwordResetSchema = z.object({
  token: z.string()
    .min(1, 'トークンは必須です'),
  
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'パスワードは大文字、小文字、数字、特殊文字を含む必要があります'
    ),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

/**
 * アカウント削除のバリデーション
 */
export const deleteAccountSchema = z.object({
  confirmation: z.string()
    .refine(val => val === 'DELETE', 'DELETE と入力してください'),
  
  password: z.string()
    .min(1, 'パスワードは必須です'),
})

/**
 * AI使用量更新のバリデーション（内部API用）
 */
export const updateAIUsageSchema = z.object({
  increment: z.number()
    .int()
    .positive()
    .max(100, '一度に増加できる使用量は100までです')
    .optional()
    .default(1),
})

/**
 * 型エクスポート
 */
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export type UpdateAIUsageInput = z.infer<typeof updateAIUsageSchema>