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
import { del } from '@vercel/blob'

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
            thumbnailSmall: true,
            thumbnailMedium: true,
            thumbnailLarge: true,
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

    // 画像URLをAPI経由のパスに変換
    const itemWithFixedUrls = {
      ...item,
      images: item.images.map(image => ({
        ...image,
        url: image.url.startsWith('/uploads/') 
          ? image.url.replace('/uploads/', '/api/uploads/')
          : image.url
      }))
    }

    return NextResponse.json(itemWithFixedUrls)
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
            thumbnailSmall: true,
            thumbnailMedium: true,
            thumbnailLarge: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    // 画像URLをAPI経由のパスに変換
    const itemWithFixedUrls = {
      ...item,
      images: item.images.map(image => ({
        ...image,
        url: image.url.startsWith('/uploads/') 
          ? image.url.replace('/uploads/', '/api/uploads/')
          : image.url
      }))
    }

    return NextResponse.json(itemWithFixedUrls)
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

    // Vercel Blobから画像とサムネイルを削除
    if (item.images.length > 0) {
      try {
        // 全ての画像とサムネイルを並列で削除
        await Promise.all(
          item.images.map(async (image) => {
            const urlsToDelete = [image.url]
            
            // サムネイルURLも削除対象に追加
            if (image.thumbnailSmall) urlsToDelete.push(image.thumbnailSmall)
            if (image.thumbnailMedium) urlsToDelete.push(image.thumbnailMedium)
            if (image.thumbnailLarge) urlsToDelete.push(image.thumbnailLarge)
            
            // 全てのURLを並列で削除
            await Promise.allSettled(
              urlsToDelete.map(async (url) => {
                try {
                  await del(url)
                  console.log(`Deleted blob: ${url}`)
                } catch (blobError) {
                  console.warn(`Failed to delete blob: ${url}`, blobError)
                  // 個別のBlob削除に失敗してもアイテム削除は続行
                }
              })
            )
          })
        )
      } catch (error) {
        console.warn('Failed to delete some blobs during item deletion:', error)
        // Blob削除に失敗してもアイテム削除は続行
      }
    }

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