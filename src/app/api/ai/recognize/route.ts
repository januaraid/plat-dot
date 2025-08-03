import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { recognizeItemFromImage, checkRateLimit } from '@/lib/ai/gemini'
import { aiRecognizeRequestSchema } from '@/lib/validations/ai'
import { categorizeAIError, formatErrorResponse, AIErrorCode } from '@/lib/ai/errors'
import { prisma } from '@/lib/db'
import { logAIUsage, normalizeUserId } from '@/lib/ai/usage'

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーIDを正規化
    const normalizedUserId = await normalizeUserId(session.user.id || '', session.user.email || '')

    // レート制限チェック
    if (!checkRateLimit(normalizedUserId)) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 })
    }

    // リクエストボディの検証
    const body = await req.json()
    const validationResult = aiRecognizeRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return Response.json({ 
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { imageBase64, mimeType } = validationResult.data

    // AI画像認識実行
    const result = await recognizeItemFromImage(imageBase64)
    
    // 使用履歴を記録（非同期で実行、エラーがあっても処理は継続）
    logAIUsage(normalizedUserId, 'image_recognition')
    
    return Response.json({
      success: true,
      data: {
        suggestions: result.suggestions,
        category: result.category,
        manufacturer: result.manufacturer,
        description: result.description
      }
    })

  } catch (error) {
    console.error('AI recognition API error:', error)
    
    const aiError = categorizeAIError(error)
    return Response.json(
      formatErrorResponse(aiError), 
      { status: aiError.statusCode }
    )
  }
}