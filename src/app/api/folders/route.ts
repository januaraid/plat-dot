import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  createFolderSchema, 
  getFoldersSchema, 
  validationErrorResponse, 
  ErrorResponses,
  handleDatabaseError
} from '@/lib/validations'
import { ZodError } from 'zod'
import { ensureUserExists } from '@/lib/user-helper'

export const runtime = 'nodejs'

/**
 * GET /api/folders - フォルダ一覧取得
 */
export async function GET(request: NextRequest) {
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

    // クエリパラメータのバリデーション
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = getFoldersSchema.parse(searchParams)

    // Prismaクエリの構築
    const where: any = {
      userId: dbUser.id,
    }

    // 親フォルダでフィルタリング
    if (params.parentId) {
      where.parentId = params.parentId
    } else {
      // parentIdが指定されていない場合は、ルートフォルダ（parentId = null）のみ取得
      where.parentId = null
    }

    // includeオプションの構築
    const include: any = {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
    }

    if (params.includeChildren) {
      include.children = {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: params.includeItemCount ? {
            select: {
              items: true,
            },
          } : undefined,
        },
        orderBy: {
          name: 'asc',
        },
      }
    }

    if (params.includeItemCount) {
      include._count = {
        select: {
          items: true,
          children: true,
        },
      }
    }

    // フォルダ取得
    const folders = await prisma.folder.findMany({
      where,
      include,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ folders })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダ一覧取得のパラメータに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('GET /api/folders error:', error)
    return ErrorResponses.internalError('フォルダ一覧の取得に失敗しました')
  }
}

/**
 * POST /api/folders - フォルダ新規作成
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
    const data = createFolderSchema.parse(body)

    // 親フォルダの存在確認（指定されている場合）
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
    }

    // 同一階層での重複名チェック
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: dbUser.id,
        name: data.name,
        parentId: data.parentId || null,
      },
    })

    if (existingFolder) {
      return ErrorResponses.conflict('同じ階層に同名のフォルダが既に存在します')
    }

    // フォルダ作成
    const folder = await prisma.folder.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        userId: dbUser.id,
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

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error, 'フォルダの作成データに誤りがあります')
    }
    
    // データベースエラーの場合
    if (error && typeof error === 'object' && 'code' in error) {
      return handleDatabaseError(error)
    }
    
    console.error('POST /api/folders error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    return ErrorResponses.internalError('フォルダの作成に失敗しました')
  }
}