import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  updateFolderSchema, 
  folderIdSchema, 
  validationErrorResponse, 
  ErrorResponses, 
  handleDatabaseError 
} from '@/lib/validations'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

/**
 * GET /api/folders/[id] - 単一フォルダ取得
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
    const { id } = folderIdSchema.parse(resolvedParams)

    // フォルダ取得
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                items: true,
                children: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
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

    if (!folder) {
      return ErrorResponses.notFound('フォルダ')
    }

    return NextResponse.json(folder)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダIDの形式に誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/folders/[id] error:', error)
    return ErrorResponses.internalError('フォルダの取得に失敗しました')
  }
}

/**
 * PUT /api/folders/[id] - フォルダ更新
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
    const { id } = folderIdSchema.parse(resolvedParams)

    // リクエストボディのバリデーション
    const body = await request.json()
    const data = updateFolderSchema.parse(body)

    // フォルダの存在確認
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    })

    if (!existingFolder) {
      return ErrorResponses.notFound('フォルダ')
    }

    // 親フォルダの変更がある場合の処理
    if (data.parentId !== undefined) {
      // 自分自身を親にしようとしていないかチェック
      if (data.parentId === id) {
        return ErrorResponses.badRequest('自分自身を親フォルダにすることはできません', 'parentId')
      }

      // 親フォルダの存在確認（nullでない場合）
      if (data.parentId) {
        const parentFolder = await prisma.folder.findFirst({
          where: {
            id: data.parentId,
            userId: dbUser.id,
          },
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        })

        if (!parentFolder) {
          return ErrorResponses.notFound('親フォルダ')
        }

        // 階層深度チェック（3階層まで）
        let depth = 1
        let currentParent = parentFolder.parent
        while (currentParent && depth < 3) {
          depth++
          currentParent = (currentParent as any).parent
        }

        if (depth >= 3) {
          return ErrorResponses.badRequest('フォルダの階層は3階層までです', 'parentId')
        }

        // 循環参照チェック（子フォルダを親にしようとしていないか）
        const isDescendant = await checkIfDescendant(id, data.parentId)
        if (isDescendant) {
          return ErrorResponses.badRequest('子フォルダを親フォルダにすることはできません', 'parentId')
        }
      }
    }

    // 名前の重複チェック（名前が変更される場合）
    if (data.name && data.name !== existingFolder.name) {
      const duplicateFolder = await prisma.folder.findFirst({
        where: {
          userId: dbUser.id,
          name: data.name,
          parentId: data.parentId !== undefined ? data.parentId : existingFolder.parentId,
          id: {
            not: id,
          },
        },
      })

      if (duplicateFolder) {
        return ErrorResponses.conflict('同じ階層に同名のフォルダが既に存在します')
      }
    }

    // フォルダ更新
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(folder)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダの更新データに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('PUT /api/folders/[id] error:', error)
    return ErrorResponses.internalError('フォルダの更新に失敗しました')
  }
}

/**
 * DELETE /api/folders/[id] - フォルダ削除
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
    const { id } = folderIdSchema.parse(resolvedParams)

    // フォルダの存在確認
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
      },
    })

    if (!folder) {
      return ErrorResponses.notFound('フォルダ')
    }

    // 子フォルダが存在する場合はエラー
    if (folder.children.length > 0) {
      const childNames = folder.children.map(child => child.name).slice(0, 3).join('、')
      const moreCount = folder.children.length > 3 ? `他${folder.children.length - 3}個` : ''
      const childrenInfo = moreCount ? `${childNames}、${moreCount}` : childNames
      
      return ErrorResponses.badRequest(
        `このフォルダには${folder.children.length}個のサブフォルダ（${childrenInfo}）が存在するため削除できません。先にサブフォルダを削除してください。`
      )
    }

    // トランザクションでフォルダ削除とアイテム移動を実行
    await prisma.$transaction(async (tx) => {
      // フォルダ内のアイテムを未分類（folderId = null）に移動
      if (folder.items.length > 0) {
        await tx.item.updateMany({
          where: {
            folderId: id,
            userId: dbUser.id,
          },
          data: {
            folderId: null,
            updatedAt: new Date(),
          },
        })
      }

      // フォルダを削除
      await tx.folder.delete({
        where: { id },
      })
    })

    return NextResponse.json({ 
      message: 'フォルダが削除されました',
      movedItemsCount: folder.items.length,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダIDの形式に誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('DELETE /api/folders/[id] error:', error)
    return ErrorResponses.internalError('フォルダの削除に失敗しました')
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