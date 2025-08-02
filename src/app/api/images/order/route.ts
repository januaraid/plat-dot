import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { updateImageOrderSchema } from '@/lib/validations/upload'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

/**
 * PUT /api/images/order - 画像の順序更新
 */
export async function PUT(request: NextRequest) {
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

    // リクエストボディのバリデーション
    const body = await request.json()
    const data = updateImageOrderSchema.parse(body)

    // すべての画像IDを取得
    const imageIds = data.imageOrders.map(order => order.imageId)

    // 画像の存在と所有権をチェック
    const images = await prisma.itemImage.findMany({
      where: {
        id: {
          in: imageIds,
        },
      },
      include: {
        item: {
          select: {
            id: true,
            userId: true,
            name: true,
          },
        },
      },
    })

    // すべての画像が見つかったかチェック
    if (images.length !== imageIds.length) {
      return ErrorResponses.notFound('指定された画像の一部が見つかりません')
    }

    // すべての画像が同じアイテムに属しているかチェック
    const itemIds = [...new Set(images.map(img => img.item.id))]
    if (itemIds.length > 1) {
      return ErrorResponses.badRequest('異なるアイテムの画像を同時に更新することはできません')
    }

    // アイテムの所有権チェック
    const itemUserId = images[0].item.userId
    if (itemUserId !== dbUser.id) {
      return ErrorResponses.forbidden('これらの画像を更新する権限がありません')
    }

    // 順序の重複チェック
    const orders = data.imageOrders.map(order => order.order)
    const uniqueOrders = [...new Set(orders)]
    if (orders.length !== uniqueOrders.length) {
      return ErrorResponses.badRequest('順序に重複があります', 'imageOrders')
    }

    // 順序の範囲チェック（0-9）
    const invalidOrders = orders.filter(order => order < 0 || order > 9)
    if (invalidOrders.length > 0) {
      return ErrorResponses.badRequest('順序は0から9の範囲で指定してください', 'imageOrders')
    }

    // トランザクションで順序を更新
    // 一時的に大きな番号に変更してから、正しい順序に更新することで制約違反を回避
    const updatedImages = await prisma.$transaction(async (tx) => {
      // Step 1: すべての画像を一時的に大きな番号（1000以上）に変更
      await Promise.all(
        data.imageOrders.map((orderData, index) =>
          tx.itemImage.update({
            where: {
              id: orderData.imageId,
            },
            data: {
              order: 1000 + index, // 一時的な大きな番号
            },
          })
        )
      )

      // Step 2: 正しい順序に更新
      const results = await Promise.all(
        data.imageOrders.map(orderData =>
          tx.itemImage.update({
            where: {
              id: orderData.imageId,
            },
            data: {
              order: orderData.order,
            },
            select: {
              id: true,
              url: true,
              filename: true,
              order: true,
            },
          })
        )
      )

      return results
    })

    // レスポンスを整形
    const formattedImages = updatedImages
      .sort((a, b) => a.order - b.order)
      .map(image => ({
        ...image,
        fileName: image.filename, // 互換性のため
      }))

    return NextResponse.json({
      success: true,
      message: '画像の順序を更新しました',
      item: {
        id: images[0].item.id,
        name: images[0].item.name,
      },
      images: formattedImages,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, '画像順序更新のデータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('PUT /api/images/order error:', error)
    return ErrorResponses.internalError('画像順序の更新に失敗しました')
  }
}