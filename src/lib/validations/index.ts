/**
 * バリデーションスキーマの再エクスポート
 */

export * from './item'
export * from './folder'
export * from './user'
export * from './upload'

import { ZodError } from 'zod'
import { NextResponse } from 'next/server'

/**
 * エラーの種類を定義
 */
export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND' 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'

/**
 * 詳細なエラー情報の型定義
 */
export interface DetailedError {
  type: ErrorType
  message: string
  field?: string
  code?: string
  details?: Record<string, any>
}

/**
 * Zodエラーをフォーマットして返す（改良版）
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.length > 0 ? err.path.join('.') : '_root'
    if (!formattedErrors[path]) {
      formattedErrors[path] = []
    }
    
    // より読みやすいエラーメッセージに変換
    let message = err.message
    
    // 特定のエラーコードに対するカスタムメッセージ
    switch (err.code) {
      case 'invalid_type':
        if (err.expected === 'string' && err.received === 'undefined') {
          message = `${path}は必須項目です`
        } else {
          message = `${path}の形式が正しくありません（${err.expected}形式で入力してください）`
        }
        break
      case 'too_small':
        if (err.type === 'string') {
          message = `${path}は${err.minimum}文字以上で入力してください`
        } else if (err.type === 'number') {
          message = `${path}は${err.minimum}以上で入力してください`
        }
        break
      case 'too_big':
        if (err.type === 'string') {
          message = `${path}は${err.maximum}文字以内で入力してください`
        } else if (err.type === 'number') {
          message = `${path}は${err.maximum}以下で入力してください`
        }
        break
      case 'invalid_string':
        if (err.validation === 'uuid') {
          message = `${path}の形式が正しくありません（UUID形式で入力してください）`
        } else if (err.validation === 'datetime') {
          message = `${path}の日付形式が正しくありません（ISO 8601形式で入力してください）`
        }
        break
    }
    
    formattedErrors[path].push(message)
  })

  return formattedErrors
}

/**
 * 詳細なバリデーションエラーレスポンスを生成
 */
export function validationErrorResponse(
  error: ZodError, 
  customMessage?: string
): NextResponse {
  const details = formatZodError(error)
  
  return NextResponse.json(
    {
      error: customMessage || 'バリデーションエラーが発生しました',
      type: 'VALIDATION_ERROR' as ErrorType,
      details,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  )
}

/**
 * 詳細なエラーレスポンスを生成
 */
export function detailedErrorResponse(
  type: ErrorType,
  message: string, 
  status: number = 500,
  field?: string,
  code?: string,
  details?: Record<string, any>
): NextResponse {
  const errorData: DetailedError & { timestamp: string } = {
    type,
    message,
    timestamp: new Date().toISOString(),
  }
  
  if (field) errorData.field = field
  if (code) errorData.code = code
  if (details) errorData.details = details
  
  return NextResponse.json(
    { error: errorData },
    { status }
  )
}

/**
 * 汎用エラーレスポンスを生成（下位互換性のため維持）
 */
export function errorResponse(message: string, status: number = 500): NextResponse {
  return detailedErrorResponse('INTERNAL_ERROR', message, status)
}

/**
 * よく使われるエラーレスポンスのヘルパー関数
 */
export const ErrorResponses = {
  unauthorized: (message = '認証が必要です') => 
    detailedErrorResponse('UNAUTHORIZED', message, 401),
    
  forbidden: (message = 'アクセス権限がありません') => 
    detailedErrorResponse('FORBIDDEN', message, 403),
    
  notFound: (resource = 'リソース', message?: string) => 
    detailedErrorResponse(
      'NOT_FOUND', 
      message || `指定された${resource}が見つかりません`, 
      404
    ),
    
  conflict: (message = 'データの競合が発生しました') => 
    detailedErrorResponse('CONFLICT', message, 409),
    
  badRequest: (message = '不正なリクエストです', field?: string) => 
    detailedErrorResponse('BAD_REQUEST', message, 400, field),
    
  internalError: (message = 'サーバー内部エラーが発生しました') => 
    detailedErrorResponse('INTERNAL_ERROR', message, 500),
}

/**
 * データベースエラーをハンドリング
 */
export function handleDatabaseError(error: any): NextResponse {
  console.error('Database error:', error)
  
  // Prismaエラーの処理
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        return ErrorResponses.conflict('データが重複しています')
      case 'P2025':
        return ErrorResponses.notFound('データ')
      case 'P2003':
        return ErrorResponses.badRequest('関連するデータが見つかりません')
      case 'P2016':
        return ErrorResponses.badRequest('クエリの実行に失敗しました')
      default:
        return ErrorResponses.internalError('データベースエラーが発生しました')
    }
  }
  
  return ErrorResponses.internalError()
}