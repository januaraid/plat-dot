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
 * Zodエラーをフォーマットして返す
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!formattedErrors[path]) {
      formattedErrors[path] = []
    }
    formattedErrors[path].push(err.message)
  })

  return formattedErrors
}

/**
 * バリデーションエラーレスポンスを生成
 */
export function validationErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: formatZodError(error),
    },
    { status: 400 }
  )
}

/**
 * 汎用エラーレスポンスを生成
 */
export function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    {
      error: message,
    },
    { status }
  )
}