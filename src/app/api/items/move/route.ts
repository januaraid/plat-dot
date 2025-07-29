import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'
import { z } from 'zod'

export const runtime = 'nodejs'

/**
 * アイテム移動時のバリデーションスキーマ
 */
const moveItemSchema = z.object({
  itemId: z.string()
    .min(1, 'アイテムIDは必須です')
    .refine(val => {
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なアイテムIDを指定してください'),

  targetFolderId: z.string()
    .transform(val => val?.trim())
    .refine(val => {
      if (val === '' || val === undefined) return true
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効な移動先フォルダIDを指定してください')
    .transform(val => val === '' ? null : val)
    .nullable()
    .optional()
    .default(null),
})

/**
 * POST /api/items/move - アイテムのフォルダ移動
 */
export async function POST(request: NextRequest) {
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
    const data = moveItemSchema.parse(body)

    // アイテムの存在と所有権をチェック
    const item = await prisma.item.findFirst({
      where: {
        id: data.itemId,
        userId: dbUser.id,
      },
      select: {
        id: true,
        name: true,
        folderId: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!item) {
      return ErrorResponses.notFound('指定されたアイテムが見つかりません', 'itemId')
    }

    // 移動先フォルダが指定されている場合は存在と所有権をチェック
    let targetFolder = null
    if (data.targetFolderId) {
      targetFolder = await prisma.folder.findFirst({
        where: {
          id: data.targetFolderId,
          userId: dbUser.id,
        },
        select: {
          id: true,
          name: true,
        },
      })

      if (!targetFolder) {
        return ErrorResponses.notFound('指定された移動先フォルダが見つかりません', 'targetFolderId')
      }
    }

    // 同じフォルダへの移動をチェック
    if (item.folderId === data.targetFolderId) {
      const currentLocation = item.folder?.name || '未分類'
      const targetLocation = targetFolder?.name || '未分類'
      return ErrorResponses.badRequest(
        `アイテムは既に「${currentLocation}」フォルダに配置されています`,
        'targetFolderId'
      )
    }

    // アイテムのフォルダを更新
    const updatedItem = await prisma.item.update({
      where: {
        id: data.itemId,
      },
      data: {
        folderId: data.targetFolderId,
      },
      select: {
        id: true,
        name: true,
        folderId: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // 移動結果のメッセージを作成
    const fromLocation = item.folder?.name || '未分類'
    const toLocation = updatedItem.folder?.name || '未分類'
    const message = `アイテム「${updatedItem.name}」を「${fromLocation}」から「${toLocation}」に移動しました`

    return NextResponse.json({
      success: true,
      message,
      item: updatedItem,
      moveDetails: {
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        fromFolder: {
          id: item.folderId,
          name: fromLocation,
        },
        toFolder: {
          id: updatedItem.folderId,
          name: toLocation,
        },
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'アイテム移動のデータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('POST /api/items/move error:', error)
    return ErrorResponses.internalError('アイテムの移動に失敗しました')
  }
}