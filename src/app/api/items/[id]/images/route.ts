import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { itemIdSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

/**
 * GET /api/items/[id]/images - アイテムの画像一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.email) {
      return ErrorResponses.unauthorized()
    }

    // ユーザーをデータベースに確実に存在させる
    const dbUser = await ensureUserExists({
      id: session.user.id || '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    })

    // IDのバリデーション
    const resolvedParams = await params
    const { id } = itemIdSchema.parse(resolvedParams)

    // アイテムの存在と所有権をチェック
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    if (!item) {
      return ErrorResponses.notFound('指定されたアイテムが見つかりません')
    }

    // 画像一覧を取得
    const images = await prisma.itemImage.findMany({
      where: {
        itemId: id,
      },
      select: {
        id: true,
        url: true,
        filename: true,
        mimeType: true,
        size: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    // レスポンスを整形（クライアント互換性のためキャメルケースも追加）
    const formattedImages = images.map(image => ({
      ...image,
      fileName: image.filename, // 互換性のため
      fileSize: image.size,     // 互換性のため
    }))

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
      },
      images: formattedImages,
      statistics: {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + img.size, 0),
        totalSizeMB: (images.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024).toFixed(2),
        remainingSlots: 10 - images.length,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'アイテムIDが不正です')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/items/[id]/images error:', error)
    return ErrorResponses.internalError('画像一覧の取得に失敗しました')
  }
}