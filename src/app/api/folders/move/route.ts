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
 * フォルダ移動時のバリデーションスキーマ
 */
const moveFolderSchema = z.object({
  folderId: z.string()
    .min(1, '移動するフォルダIDは必須です')
    .refine(val => {
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効なフォルダIDを指定してください'),
    
  targetParentId: z.string()
    .transform(val => val?.trim())
    .refine(val => {
      if (val === '' || val === undefined) return true
      // UUIDまたはcuid形式のIDを許可
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const cuidRegex = /^c[a-z0-9]{24,}$/i
      return uuidRegex.test(val) || cuidRegex.test(val)
    }, '有効な移動先親フォルダIDを指定してください')
    .transform(val => val === '' ? null : val)
    .nullable(),
})

/**
 * POST /api/folders/move - フォルダ移動
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
    const data = moveFolderSchema.parse(body)

    // 移動するフォルダの存在確認
    const folderToMove = await prisma.folder.findFirst({
      where: {
        id: data.folderId,
        userId: dbUser.id,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    })

    if (!folderToMove) {
      return ErrorResponses.notFound('移動するフォルダ')
    }

    // 自分自身を親にしようとしていないかチェック
    if (data.targetParentId === data.folderId) {
      return ErrorResponses.badRequest('フォルダを自分自身の子にすることはできません', 'targetParentId')
    }

    // 既に同じ場所にある場合はエラー
    if (folderToMove.parentId === data.targetParentId) {
      return ErrorResponses.badRequest('フォルダは既に指定された場所にあります', 'targetParentId')
    }

    // 移動先親フォルダの存在確認（nullでない場合）
    let targetParentFolder = null
    if (data.targetParentId) {
      targetParentFolder = await prisma.folder.findFirst({
        where: {
          id: data.targetParentId,
          userId: dbUser.id,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      })

      if (!targetParentFolder) {
        return ErrorResponses.notFound('移動先親フォルダ')
      }
    }

    // 循環参照チェック（移動するフォルダの子孫を親にしようとしていないか）
    if (data.targetParentId) {
      const isDescendant = await checkIfDescendant(data.folderId, data.targetParentId)
      if (isDescendant) {
        return ErrorResponses.badRequest('フォルダを自分の子孫フォルダの下に移動することはできません', 'targetParentId')
      }
    }

    // 階層深度チェック
    const newDepth = await calculateDepthAfterMove(data.folderId, data.targetParentId)
    if (newDepth > 3) {
      return ErrorResponses.badRequest('移動後の階層が3階層を超えてしまいます', 'targetParentId')
    }

    // 同一階層での重複名チェック
    const duplicateFolder = await prisma.folder.findFirst({
      where: {
        userId: dbUser.id,
        name: folderToMove.name,
        parentId: data.targetParentId,
        id: {
          not: data.folderId,
        },
      },
    })

    if (duplicateFolder) {
      return ErrorResponses.conflict('移動先に同名のフォルダが既に存在します')
    }

    // フォルダ移動を実行
    const movedFolder = await prisma.folder.update({
      where: {
        id: data.folderId,
      },
      data: {
        parentId: data.targetParentId,
        updatedAt: new Date(),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
            children: true,
          },
        },
      },
    })

    // 移動後のパス情報を取得
    const folderPath = await buildFolderPath(data.folderId)

    const response = {
      movedFolder,
      path: folderPath,
      message: `フォルダ「${folderToMove.name}」を移動しました`,
      metadata: {
        previousParentId: folderToMove.parentId,
        newParentId: data.targetParentId,
        newDepth: folderPath.length,
        movedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダ移動のデータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('POST /api/folders/move error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return ErrorResponses.internalError('フォルダの移動に失敗しました')
  }
}

/**
 * 指定されたフォルダが別のフォルダの子孫かどうかチェック
 */
async function checkIfDescendant(folderId: string, potentialAncestorId: string): Promise<boolean> {
  const descendants = await prisma.folder.findMany({
    where: {
      parentId: folderId,
    },
    select: {
      id: true,
    },
  })

  for (const descendant of descendants) {
    if (descendant.id === potentialAncestorId) {
      return true
    }
    // 再帰的にチェック
    const isDescendant = await checkIfDescendant(descendant.id, potentialAncestorId)
    if (isDescendant) {
      return true
    }
  }

  return false
}

/**
 * フォルダ移動後の深度を計算
 */
async function calculateDepthAfterMove(folderId: string, newParentId: string | null): Promise<number> {
  if (!newParentId) {
    // ルートレベルに移動する場合
    return 1
  }

  // 移動先親フォルダの深度を取得
  const parentPath = await buildFolderPath(newParentId)
  return parentPath.length + 1
}

/**
 * フォルダのパス（ルートから指定フォルダまで）を構築
 */
async function buildFolderPath(folderId: string): Promise<Array<{id: string, name: string}>> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  })

  if (!folder) {
    return []
  }

  if (!folder.parentId) {
    return [{ id: folder.id, name: folder.name }]
  }

  const parentPath = await buildFolderPath(folder.parentId)
  return [...parentPath, { id: folder.id, name: folder.name }]
}