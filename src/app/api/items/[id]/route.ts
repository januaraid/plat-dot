import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  updateItemSchema, 
  itemIdSchema, 
  validationErrorResponse, 
  ErrorResponses, 
  handleDatabaseError 
} from '@/lib/validations'
import { ZodError } from 'zod'
import { Decimal } from 'decimal.js'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

/**
 * GET /api/items/[id] - 単一アイテム取得
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

    // アイテム取得
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!item) {
      return ErrorResponses.notFound('アイテム')
    }

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'アイテムIDの形式に誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/items/[id] error:', error)
    return ErrorResponses.internalError('アイテムの取得に失敗しました')
  }
}

/**
 * PUT /api/items/[id] - アイテム更新
 */
export async function PUT(
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

    // リクエストボディのバリデーション
    const body = await request.json()
    const data = updateItemSchema.parse(body)

    // アイテムの存在確認
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    })

    if (!existingItem) {
      return ErrorResponses.notFound('アイテム')
    }

    // フォルダの存在確認（指定されている場合）
    if (data.folderId !== undefined) {
      if (data.folderId) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: data.folderId,
            userId: dbUser.id,
          },
        })

        if (!folder) {
          return ErrorResponses.notFound('フォルダ')
        }
      }
    }

    // Decimal型のフィールドを変換
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }
    
    // purchasePriceをDecimalに変換
    if (data.purchasePrice !== undefined) {
      updateData.purchasePrice = new Decimal(data.purchasePrice)
    }

    // アイテム更新
    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'アイテムの更新データに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('PUT /api/items/[id] error:', error)
    return ErrorResponses.internalError('アイテムの更新に失敗しました')
  }
}

/**
 * DELETE /api/items/[id] - アイテム削除
 */
export async function DELETE(
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

    // アイテムの存在確認
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        images: true,
      },
    })

    if (!item) {
      return ErrorResponses.notFound('アイテム')
    }

    // TODO: 画像ファイルの物理削除処理を追加
    // item.images.forEach(image => {
    //   deleteFile(image.url)
    // })

    // アイテムと関連データの削除（カスケード削除）
    await prisma.item.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'アイテムIDの形式に誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('DELETE /api/items/[id] error:', error)
    return ErrorResponses.internalError('アイテムの削除に失敗しました')
  }
}