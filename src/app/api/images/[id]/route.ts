import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { deleteImageSchema } from '@/lib/validations/upload'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'
import { del } from '@vercel/blob'

export const runtime = 'nodejs'

/**
 * DELETE /api/images/[id] - 画像削除
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
    const { imageId } = deleteImageSchema.parse({ imageId: resolvedParams.id })

    // 画像の存在と所有権をチェック
    const image = await prisma.itemImage.findFirst({
      where: {
        id: imageId,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    })

    if (!image) {
      return ErrorResponses.notFound('指定された画像が見つかりません')
    }

    // アイテムの所有権チェック
    if (image.item.userId !== dbUser.id) {
      return ErrorResponses.forbidden('この画像を削除する権限がありません')
    }

    // Vercel Blobから画像とサムネイルを削除
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
        } catch (error) {
          console.warn(`Failed to delete blob: ${url}`, error)
          // 個別のBlob削除に失敗してもデータベース削除は続行
        }
      })
    )

    // データベースから画像情報を削除
    await prisma.itemImage.delete({
      where: {
        id: imageId,
      },
    })

    // 同じアイテムの残りの画像の順序を更新
    const remainingImages = await prisma.itemImage.findMany({
      where: {
        itemId: image.itemId,
      },
      orderBy: {
        order: 'asc',
      },
    })

    // 順序を0から振り直す
    await Promise.all(
      remainingImages.map((img, index) =>
        prisma.itemImage.update({
          where: { id: img.id },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: '画像を削除しました',
      deletedImage: {
        id: image.id,
        fileName: image.filename,
        itemId: image.itemId,
        itemName: image.item.name,
      },
      remainingImagesCount: remainingImages.length,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, '画像IDが不正です')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('DELETE /api/images/[id] error:', error)
    return ErrorResponses.internalError('画像の削除に失敗しました')
  }
}